"use client";

import { useState } from "react";
import { useResellerCallLogsQuery } from "@/hooks/use-reseller-queries";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { parseDateSafe } from "@/utils/timezone";
import { CallDetailDrawer } from "@/components/call-logs/call-logs-shell";
import { InlineAudioPlayer } from "@/components/dashboard/recent-call-logs-table";
import { CallLog } from "@/types/call-log";

export default function ResellerCallLogsPage() {
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useResellerCallLogsQuery({
    customer_id: customerId || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sort,
    page,
    limit,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const customers = data?.customers ?? [];
  const totalPages = Math.ceil(total / limit);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs"
        description="Filter and analyze call history for all clients assigned to you."
      />

      {/* Filter controls */}
      <div
        className="grid grid-cols-1 gap-4 rounded-2xl border p-5 sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Customer select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Filter by Customer</label>
          <select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition cursor-pointer"
          >
            <option value="" className="bg-[var(--surface-2)]">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--surface-2)]">
                {c.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">From Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
            />
          </div>
        </div>

        {/* To Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">To Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
            />
          </div>
        </div>

        {/* Sort and Actions */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <label className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider hidden lg:block">&nbsp;</label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSort(sort === "newest" ? "oldest" : "newest");
                setPage(1);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] transition cursor-pointer"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort: {sort === "newest" ? "Newest" : "Oldest"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs loading states */}
      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <ErrorState message="Failed to fetch call logs." />
      ) : logs.length === 0 ? (
        <EmptyState title="No logs found" message="No call logs matching these filters were found." />
      ) : (
        <>
          <div
            className="overflow-x-auto rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Customer Name</th>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">From Number</th>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Duration</th>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Status</th>
                  <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b last:border-b-0 hover:bg-slate-500/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                      {parseDateSafe(log.startedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--foreground)]">{log.customerName || "—"}</div>
                      <div className="text-xs text-[var(--muted-text)] mt-0.5">{log.customerEmail || "—"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[var(--foreground)]">
                      {log.fromNumber}
                    </td>
                    <td className="px-6 py-4 text-[var(--foreground)]">
                      {formatDuration(log.durationSeconds)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          log.status === "passed"
                            ? "bg-[var(--success-bg)] text-[var(--success-fg)] border border-[var(--success-border)]"
                            : "bg-[var(--danger-bg)] text-[var(--danger-fg)] border border-[var(--danger-border)]"
                        }`}
                      >
                        {log.status === "passed" ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log as CallLog)}
                        className="rounded-lg px-3 py-1 text-xs font-bold text-[var(--brand-btn-text)] bg-[var(--brand-500)] transition active:scale-95 hover:bg-[var(--foreground)] hover:text-[var(--background)] cursor-pointer hover:shadow-[var(--card-hover-shadow)]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-[var(--muted-text)]">
                Showing page <span className="font-semibold text-[var(--foreground)]">{page}</span> of{" "}
                <span className="font-semibold text-[var(--foreground)]">{totalPages}</span> ({total} logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-slate-400 hover:text-[var(--foreground)] disabled:opacity-50 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-slate-400 hover:text-[var(--foreground)] disabled:opacity-50 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {selectedLog && (
        <CallDetailDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          hideMeta={true}
        />
      )}
    </div>
  );
}
