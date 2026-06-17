"use client";

import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SearchInput } from "@/components/shared/search-input";
import { useRecordingsQuery } from "@/hooks/use-recordings-query";
import { formatDuration } from "@/utils/format";

const PAGE_SIZE = 6;

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

// ── Inline audio player (matching Call Logs style) ────────────────────────────

function InlineAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow transition active:scale-95 cursor-pointer"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1"/>
              <rect x="7" y="1" width="4" height="10" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5z"/>
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
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--brand-500)]"
            style={{ background: "var(--border)" }}
          />
          <div className="flex justify-between text-xs" style={{ color: "var(--muted-text)" }}>
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
        <a
          href={url} download target="_blank" rel="noreferrer"
          title="Download MP3"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted-text)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export function RecordingsShell() {
  const { data: recordings = [], isLoading, error } = useRecordingsQuery();
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);

  const agentOptions = Array.from(new Set(recordings.map((r) => r.agentName)));

  const effectiveRange = useMemo(() => {
    if (datePreset === "all") return { from: "", to: "" };
    if (datePreset === "custom") return { from: customFrom, to: customTo };
    const now = new Date();
    const today = toDateStr(now);
    if (datePreset === "today") return { from: today, to: today };
    if (datePreset === "this_week") {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: toDateStr(mon), to: today };
    }
    if (datePreset === "this_month")
      return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    if (datePreset === "last_month") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toDateStr(first), to: toDateStr(last) };
    }
    if (datePreset === "last_7") {
      const from = new Date(now); from.setDate(now.getDate() - 6);
      return { from: toDateStr(from), to: today };
    }
    if (datePreset === "last_30") {
      const from = new Date(now); from.setDate(now.getDate() - 29);
      return { from: toDateStr(from), to: today };
    }
    return { from: "", to: "" };
  }, [datePreset, customFrom, customTo]);

  const filteredRows = useMemo(() => {
    return recordings.filter((r) => {
      const q = query.trim().toLowerCase();
      const queryMatch = !q || r.customerNumber.toLowerCase().includes(q) || r.callId.toLowerCase().includes(q);
      const agentMatch = agentFilter === "all" || r.agentName === agentFilter;

      let dateMatch = true;
      if (effectiveRange.from || effectiveRange.to) {
        const ts = Number(r.createdAt);
        const d = isNaN(ts) ? new Date(r.createdAt) : new Date(ts);
        const logDate = toDateStr(d);
        if (effectiveRange.from && logDate < effectiveRange.from) dateMatch = false;
        if (effectiveRange.to && logDate > effectiveRange.to) dateMatch = false;
      }

      return queryMatch && agentMatch && dateMatch;
    });
  }, [recordings, query, agentFilter, effectiveRange]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  if (isLoading) return <LoadingSkeleton className="h-96 w-full" />;
  if (error) return <ErrorState message="Recordings could not be loaded. Please try again." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordings"
        description="Browse call recordings, linked call IDs, and playback metadata."
      />

      {/* Filter bar */}
      <div className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">

          {/* Search */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-slate-400">
              <circle cx="6" cy="6" r="4.5"/>
              <path d="M9.5 9.5l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={query}
              onChange={(e) => { resetPage(); setQuery(e.target.value); }}
              placeholder="Search by customer number or call ID"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              style={{ color: "var(--foreground)" }}
            />
            {query && (
              <button type="button" onClick={() => { resetPage(); setQuery(""); }} className="text-slate-400 hover:text-[var(--foreground)] cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => { resetPage(); setAgentFilter(e.target.value); }}
            className="rounded-lg border px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all" className="bg-[var(--surface-2)]">All Agents</option>
            {agentOptions.map((a) => (
              <option key={a} value={a} className="bg-[var(--surface-2)]">{a.length > 20 ? a.slice(0, 18) + "…" : a}</option>
            ))}
          </select>

          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => { resetPage(); setDatePreset(e.target.value); }}
            className="rounded-lg border px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all" className="bg-[var(--surface-2)]">All Dates</option>
            <option value="today" className="bg-[var(--surface-2)]">Today</option>
            <option value="last_7" className="bg-[var(--surface-2)]">Last 7 Days</option>
            <option value="this_week" className="bg-[var(--surface-2)]">This Week</option>
            <option value="this_month" className="bg-[var(--surface-2)]">This Month</option>
            <option value="last_month" className="bg-[var(--surface-2)]">Last Month</option>
            <option value="last_30" className="bg-[var(--surface-2)]">Last 30 Days</option>
            <option value="custom" className="bg-[var(--surface-2)]">Custom Range…</option>
          </select>

          {/* Custom date range */}
          {datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={customFrom}
                onChange={(e) => { resetPage(); setCustomFrom(e.target.value); }}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <span className="text-xs" style={{ color: "var(--muted-text)" }}>to</span>
              <input type="date" value={customTo}
                onChange={(e) => { resetPage(); setCustomTo(e.target.value); }}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          )}

          {effectiveRange.from && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ background: "var(--surface-2)", color: "var(--muted-text)" }}>
              {effectiveRange.from} → {effectiveRange.to || "today"}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--subtle-text)" }}>
          {filteredRows.length} recording{filteredRows.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Recording cards */}
      {pagedRows.length === 0 ? (
        <EmptyState title="No recordings found" message="Try adjusting your filters or search query." />
      ) : (
        <section className="space-y-3">
          {pagedRows.map((recording) => (
            <article key={recording.id} className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {recording.agentName.length > 30
                      ? recording.agentName.slice(0, 28) + "…"
                      : recording.agentName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-text)" }}>
                    Call: {recording.callId} · Customer: {recording.customerNumber}
                  </p>
                </div>
                <p className="whitespace-nowrap text-xs" style={{ color: "var(--muted-text)" }}>
                  {formatDuration(recording.durationSeconds)} · {formatDateSafe(recording.createdAt)}
                </p>
              </div>
              <InlineAudioPlayer url={recording.audioUrl} />
            </article>
          ))}
        </section>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((c) => Math.max(1, c - 1))}
        onNext={() => setPage((c) => Math.min(totalPages, c + 1))}
      />
    </div>
  );
}
