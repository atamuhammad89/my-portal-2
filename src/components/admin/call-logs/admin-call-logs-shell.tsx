"use client";

import { useState } from "react";
import { Phone, Clock, DollarSign, Loader2, AlertCircle, Download, Filter } from "lucide-react";
import { useAdminCallLogsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { useAdminRetellAgentsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { CallLog } from "@/types/retell";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    ended:      { bg: "rgba(16, 185, 129, 0.08)", color: "#34d399", border: "rgba(16, 185, 129, 0.2)" },
    ongoing:    { bg: "rgba(0, 240, 255, 0.05)", color: "#00f0ff", border: "rgba(0, 240, 255, 0.15)" },
    registered: { bg: "rgba(245, 158, 11, 0.08)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.2)" },
    error:      { bg: "rgba(244, 63, 94, 0.08)", color: "#fb7185", border: "rgba(244, 63, 94, 0.2)" },
    unknown:    { bg: "rgba(255, 255, 255, 0.05)", color: "#cbd5e1", border: "rgba(255, 255, 255, 0.1)" },
  };
  const style = map[status] ?? map.unknown;
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {status}
    </span>
  );
}

function TranscriptModal({ log, onClose }: { log: CallLog; onClose: () => void }) {
  const turns = log.transcript_object ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Call Transcript</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{log.retell_call_id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3">
          {turns.length > 0 ? turns.map((t, i) => (
            <div key={i} className={cn("flex gap-3", t.role === "agent" ? "justify-start" : "justify-end")}>
              <div className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                t.role === "agent"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-slate-900 text-white"
              )}>
                <p className="text-xs font-medium mb-1 opacity-60 capitalize">{t.role}</p>
                <p>{t.content}</p>
              </div>
            </div>
          )) : log.transcript ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{log.transcript}</pre>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No transcript available.</p>
          )}
        </div>
        <div className="border-t px-6 py-4">
          <button onClick={onClose} className="w-full rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export function AdminCallLogsShell() {
  const [filters, setFilters] = useState({ agent_id: "", status: "all" });
  const [page, setPage] = useState(1);
  const [transcript, setTranscript] = useState<CallLog | null>(null);

  const queryParams = {
    agent_id: filters.agent_id || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useAdminCallLogsQuery(queryParams);
  const { data: agents = [] } = useAdminRetellAgentsQuery();

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Call Logs</h1>
        <p className="mt-1 text-sm text-slate-500">All calls received via Retell webhook — updated in real time.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="text-sm bg-transparent focus:outline-none"
            value={filters.agent_id}
            onChange={(e) => { setFilters((p) => ({ ...p, agent_id: e.target.value })); setPage(1); }}
          >
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <select
            className="text-sm bg-transparent focus:outline-none"
            value={filters.status}
            onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="ended">Ended</option>
            <option value="ongoing">Ongoing</option>
            <option value="registered">Registered</option>
            <option value="error">Error</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-slate-400">{total} total</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center animate-pulse">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-400">{(error as Error).message}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <Phone className="h-10 w-10 text-[var(--subtle-text)]" />
          <p className="text-sm text-[var(--muted-text)]">No call logs found.</p>
        </div>
      ) : (
        <>
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>From</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-slate-400 max-w-[120px] truncate">
                      {log.retell_call_id}
                    </td>
                    <td className="text-white font-medium">
                      {(log.agent as { name?: string })?.name ?? <span className="text-slate-500">—</span>}
                    </td>
                    <td>
                      <StatusBadge status={log.call_status} />
                    </td>
                    <td className="text-slate-300">{log.from_number ?? "—"}</td>
                    <td className="text-slate-400 text-xs whitespace-nowrap">
                      {formatTimestamp(log.start_timestamp)}
                    </td>
                    <td className="text-slate-300">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {formatDuration(log.duration_seconds)}
                      </span>
                    </td>
                    <td className="text-slate-300">
                      {log.call_cost != null ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                          {Number(log.call_cost).toFixed(4)}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {(log.transcript || log.transcript_object) && (
                          <button
                            onClick={() => setTranscript(log)}
                            className="text-xs text-[var(--brand-500)] underline hover:text-white cursor-pointer"
                          >
                            Transcript
                          </button>
                        )}
                        {log.recording_url && (
                          <a
                            href={log.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-teal hover:underline cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" /> Recording
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-[var(--border)] bg-[rgba(0,240,255,0.03)] px-3 py-1.5 text-sm text-[var(--brand-500)] transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-white enabled:hover:text-black enabled:hover:border-white"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-transparent bg-[var(--brand-500)] px-3 py-1.5 text-sm text-black transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-white enabled:hover:text-black enabled:hover:border-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {transcript && (
        <TranscriptModal log={transcript} onClose={() => setTranscript(null)} />
      )}
    </div>
  );
}
