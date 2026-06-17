"use client";

import { useMemo, useState, useRef } from "react";
import {
  Phone, Clock, DollarSign, Filter, Search, X,
  ChevronLeft, ChevronRight, User, AlertCircle, Loader2
} from "lucide-react";
import { useAdminCdrLogsQuery, AdminCdrLog } from "@/hooks/admin/use-admin-cdr-logs-query";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModalDrawerShell } from "@/components/shared/modal-drawer-shell";
import { formatDuration } from "@/utils/format";
import { parseDateSafe } from "@/utils/timezone";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type CallStatus = "passed" | "failed";
type SortOrder  = "newest" | "oldest";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getPresetRange(preset: string): { from: string; to: string } {
  const now   = new Date();
  const today = toDateStr(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "this_week") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { from: toDateStr(mon), to: today };
  }
  if (preset === "this_month")
    return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  if (preset === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toDateStr(first), to: toDateStr(last) };
  }
  if (preset === "last_7") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toDateStr(from), to: today };
  }
  if (preset === "last_30") {
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: toDateStr(from), to: today };
  }
  return { from: "", to: "" };
}

function getStatusVariant(status: CallStatus) {
  return status === "passed" ? ("success" as const) : ("danger" as const);
}

function getSentimentDisplay(sentiment: string | null) {
  const s = (sentiment ?? "").toLowerCase();
  if (s.includes("positive") || s.includes("happy") || s.includes("satisfied"))
    return { emoji: "😊", label: "Positive", color: "sentiment-chip sentiment-positive" };
  if (s.includes("negative") || s.includes("frustrated") || s.includes("angry") || s.includes("unhappy"))
    return { emoji: "😤", label: "Negative", color: "sentiment-chip sentiment-negative" };
  if (s.includes("neutral"))
    return { emoji: "😐", label: "Neutral", color: "sentiment-chip sentiment-neutral" };
  if (sentiment)
    return { emoji: "🤔", label: sentiment, color: "sentiment-chip sentiment-other" };
  return null;
}

// ── Audio Player ──────────────────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
    setPlaying(!playing);
  }

  function fmtTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          setCurrentTime(el.currentTime);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        crossOrigin="anonymous"
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black shadow transition active:scale-95 cursor-pointer hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]"
          style={{ background: "var(--brand-500)" }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1" />
              <rect x="7" y="1" width="4" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5z" />
            </svg>
          )}
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range" min={0} max={100} value={progress}
            onChange={(e) => {
              const el = audioRef.current;
              if (!el) return;
              const t = (Number(e.target.value) / 100) * el.duration;
              el.currentTime = t;
              setCurrentTime(t);
              setProgress(Number(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--brand-500)]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
        <a
          href={url} download target="_blank" rel="noreferrer" title="Download"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-slate-400 hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Call Detail Drawer ────────────────────────────────────────────────────────

function CallDetailDrawer({ log, onClose }: { log: AdminCdrLog; onClose: () => void }) {
  const sentiment      = getSentimentDisplay(log.customerSentiment ?? null);

  const metaItems = [
    { label: "Call ID",          value: log.callId },
    { label: "Date / Time",      value: parseDateSafe(log.startedAt) },
    { label: "Customer",         value: log.customerName ? `${log.customerName} (${log.customerEmail ?? ""})` : "—" },
    { label: "From (Customer)",  value: log.fromNumber },
    { label: "Agent (Assistant)", value: log.toNumber },
    { label: "Duration",         value: formatDuration(log.durationSeconds) },
    { label: "Status",           badge: log.status as CallStatus },
    ...(log.disconnectionReason ? [{ label: "Disconnect Reason", value: log.disconnectionReason }] : []),
  ];

  return (
    <ModalDrawerShell title="Call Details" open={true} onClose={onClose}>
      <div className="space-y-6 pb-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {metaItems.map(({ label, value, badge }) => (
            <div
              key={label}
              className="rounded-lg border p-3"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--subtle-text)]">{label}</p>
              {badge ? (
                <StatusBadge
                  text={badge.charAt(0).toUpperCase() + badge.slice(1)}
                  variant={getStatusVariant(badge)}
                />
              ) : (
                <p className="truncate font-semibold text-[var(--foreground)]">{value ?? "—"}</p>
              )}
            </div>
          ))}
        </div>

        {/* Recording */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--subtle-text)]">Recording</p>
          {log.recordingUrl ? (
            <AudioPlayer url={log.recordingUrl} />
          ) : (
            <div className="rounded-xl border border-dashed py-6 text-center text-xs text-[var(--muted-text)]" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              No recording available
            </div>
          )}
        </div>

        {/* Sentiment + Summary + Transcript */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--subtle-text)]">Sentiment & Analysis</p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {sentiment ? (
                <span className={sentiment.color}>
                  <span>{sentiment.emoji}</span>
                  <span>{sentiment.label}</span>
                </span>
              ) : (
                <span className="rounded-full border px-3 py-1 text-xs text-[var(--muted-text)]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  No sentiment data
                </span>
              )}
              {log.isSuccessful !== null && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                  style={log.isSuccessful
                    ? { background: "var(--success-bg)", color: "var(--success-fg)", borderColor: "rgba(16, 185, 129, 0.2)" }
                    : { background: "var(--danger-bg)", color: "var(--danger-fg)", borderColor: "rgba(244, 63, 94, 0.2)" }
                  }
                >
                  {log.isSuccessful ? "✓ Successful" : "✗ Unsuccessful"}
                </span>
              )}
            </div>
            {log.callInfo && (
              <div className="rounded-lg border p-3" style={{ background: "var(--brand-50)", borderColor: "var(--brand-200)" }}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-500)]">Call Summary</p>
                <p className="text-xs leading-relaxed text-[var(--muted-text)]">{log.callInfo}</p>
              </div>
            )}
            {log.transcript && (
              <div className="rounded-lg border p-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--subtle-text)]">Transcript</p>
                <div className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted-text)] max-h-80 overflow-y-auto pr-1">{log.transcript}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalDrawerShell>
  );
}

// ── Main Shell ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export function AdminCdrLogsShell() {
  // Filters stored as state; actual fetch is done server-side via API
  const [customerId,  setCustomerId]  = useState("");
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState<"all" | CallStatus>("all");
  const [datePreset,  setDatePreset]  = useState("all");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");
  const [sortOrder,   setSortOrder]   = useState<SortOrder>("newest");
  const [page,        setPage]        = useState(1);
  const [selectedLog, setSelectedLog] = useState<AdminCdrLog | null>(null);

  const effectiveDateRange = useMemo(() => {
    if (datePreset === "custom") return { from: customFrom, to: customTo };
    if (datePreset === "all")    return { from: "", to: "" };
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const queryParams = {
    customer_id: customerId || undefined,
    status:      status !== "all" ? status : undefined,
    from:        effectiveDateRange.from || undefined,
    to:          effectiveDateRange.to   || undefined,
    sort:        sortOrder,
    search:      search || undefined,
    page,
    limit:       PAGE_SIZE,
  };

  const { data: result, isLoading, error } = useAdminCdrLogsQuery(queryParams);

  const logs      = result?.data      ?? [];
  const total     = result?.total     ?? 0;
  const customers = result?.customers ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function resetPage() { setPage(1); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs / CDR"
        description="All CDR records across every customer — filter by customer, status, date and more."
      />

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">

          {/* Customer filter — admin-only extra */}
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2 min-w-[180px]"
               style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <User className="h-4 w-4 shrink-0 text-brand-cyan" />
            <select
              value={customerId}
              onChange={(e) => { resetPage(); setCustomerId(e.target.value); }}
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none cursor-pointer"
            >
              <option value="" className="bg-[var(--surface)] text-[var(--foreground)]">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[var(--surface)] text-[var(--foreground)]">
                  {c.fullName || c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Search by number */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border px-3 py-2"
               style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { resetPage(); setSearch(e.target.value); }}
              placeholder="Search by number…"
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => { resetPage(); setSearch(""); }} className="text-slate-400 hover:text-[var(--foreground)] cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { resetPage(); setStatus(e.target.value as "all" | CallStatus); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}
          >
            <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Statuses</option>
            <option value="passed" className="bg-[var(--surface)] text-[var(--foreground)]">Passed</option>
            <option value="failed" className="bg-[var(--surface)] text-[var(--foreground)]">Failed</option>
          </select>

          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => { resetPage(); setDatePreset(e.target.value); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}
          >
            <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Dates</option>
            <option value="today" className="bg-[var(--surface)] text-[var(--foreground)]">Today</option>
            <option value="last_7" className="bg-[var(--surface)] text-[var(--foreground)]">Last 7 Days</option>
            <option value="this_week" className="bg-[var(--surface)] text-[var(--foreground)]">This Week</option>
            <option value="this_month" className="bg-[var(--surface)] text-[var(--foreground)]">This Month</option>
            <option value="last_month" className="bg-[var(--surface)] text-[var(--foreground)]">Last Month</option>
            <option value="last_30" className="bg-[var(--surface)] text-[var(--foreground)]">Last 30 Days</option>
            <option value="custom" className="bg-[var(--surface)] text-[var(--foreground)]">Custom Range…</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => { resetPage(); setSortOrder(e.target.value as SortOrder); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}
          >
            <option value="newest" className="bg-[var(--surface)] text-[var(--foreground)]">↓ Newest First</option>
            <option value="oldest" className="bg-[var(--surface)] text-[var(--foreground)]">↑ Oldest First</option>
          </select>

          {/* Custom date range pickers */}
          {datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={customFrom}
                onChange={(e) => { resetPage(); setCustomFrom(e.target.value); }}
                className="rounded-lg border px-3 py-2 text-sm cursor-pointer"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={customTo}
                onChange={(e) => { resetPage(); setCustomTo(e.target.value); }}
                className="rounded-lg border px-3 py-2 text-sm cursor-pointer"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          )}

          {/* Active date chip */}
          {effectiveDateRange.from && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}>
              📅 {effectiveDateRange.from} → {effectiveDateRange.to || "today"}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          {isLoading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* ── Table / States ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border py-20 text-center animate-pulse" style={{ borderColor: "rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.05)" }}>
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-400">{(error as Error).message}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <Phone className="h-10 w-10 text-[var(--subtle-text)]" />
          <p className="text-sm text-[var(--muted-text)]">No call logs match your filters.</p>
        </div>
      ) : (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                {["Date / Time", "Customer", "From (Number)", "Duration", "Status", "Sentiment", "Actions"].map((h) => (
                  <th key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const sentiment = getSentimentDisplay(log.customerSentiment ?? null);
                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-xs">
                      {parseDateSafe(log.startedAt)}
                    </td>
                    <td>
                      {log.customerName ? (
                        <div>
                          <p className="font-semibold text-[var(--foreground)] text-xs">{log.customerName}</p>
                          <p className="text-[var(--muted-text)] text-xs">{log.customerEmail ?? ""}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="font-mono text-xs">{log.fromNumber}</td>
                    <td className="whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[var(--subtle-text)]" />
                        {formatDuration(log.durationSeconds)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        text={log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        variant={getStatusVariant(log.status)}
                      />
                    </td>
                    <td>
                      {sentiment ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sentiment.color}`}>
                          {sentiment.emoji} {sentiment.label}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg px-3 py-1 text-xs font-bold text-[var(--brand-btn-text)] bg-[var(--brand-500)] transition active:scale-95 cursor-pointer hover:bg-[var(--foreground)] hover:text-[var(--background)] hover:shadow-[var(--card-hover-shadow)]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} records
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--brand-500)] transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-[var(--surface)] enabled:hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="h-4 w-4 transition-colors" /> Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--brand-500)] px-3 py-1.5 text-sm text-[var(--brand-btn-text)] transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:opacity-90"
            >
              Next <ChevronRight className="h-4 w-4 transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ────────────────────────────────────────────────── */}
      {selectedLog && (
        <CallDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
