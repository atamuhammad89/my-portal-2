"use client";

import { useState } from "react";
import { PhoneCall, CheckCircle, XCircle, Clock, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { parseDateSafe, formatDuration } from "@/utils/timezone";
import { CallTrendsChart } from "@/components/dashboard/call-trends-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { MinutesBarChart } from "@/components/dashboard/minutes-bar-chart";
import { PbStatCard } from "@/components/shared/pb-stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useDashboardOverviewQuery } from "@/hooks/use-dashboard-query";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";


function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-widest mb-4"
      style={{ color: "var(--brand-500)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
    >
      {children}
    </h3>
  );
}

// ─── Main Shell ──────────────────────────────────────────────────────────────
export function DashboardShell() {
  const { data, isLoading, error } = useDashboardOverviewQuery();
  const [dateRange] = useState("Last 7 Days");

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} className="h-28" />)}
        </div>
        <LoadingSkeleton className="h-72 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message="Dashboard data could not be loaded. Please try again." />;
  if (!data) return <EmptyState title="No dashboard data" message="No dashboard metrics are available yet." />;

  const [totalCallsKpi, succeededKpi, failedKpi, minutesKpi] = data.kpis ?? [];
  const totalCallsNum = parseInt(totalCallsKpi?.value ?? "0", 10) || 0;
  const callsByStatus = data.callsByStatus ?? { passed: 0, failed: 0 };
  const minutesByDay = data.minutesByDay ?? [];

  // Build success rate sparkline from trends
  const sparkline = (data.trends ?? []).map((t: any) => ({
    value: t.answeredCalls ?? 0,
  }));

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--page-header-title)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-text)" }}>
            Operational overview for calls and AI agent performance.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs text-right" style={{ color: "var(--muted-text)" }}>
            <span className="font-semibold" style={{ color: "var(--brand-500)" }}>Data as of</span>
            <br />
            {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-default"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--brand-500)" }} />
            {dateRange}
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PbStatCard
          label="Total Calls"
          value={totalCallsKpi?.value ?? "0"}
          subtext="All calls placed"
          accent="cyan"
          icon={<PhoneCall className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Succeeded Calls"
          value={succeededKpi?.value ?? "0"}
          subtext="Successfully connected"
          accent="green"
          icon={<CheckCircle className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Failed Calls"
          value={failedKpi?.value ?? "0"}
          subtext="Unanswered or failed"
          accent="pink"
          icon={<XCircle className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Total Minutes Used"
          value={minutesKpi?.value ?? "0.0"}
          subtext="Total call duration"
          accent="purple"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
      </div>

      {/* ── Row 2: Recent Logs + Trend ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Recent Call Logs */}
        <div
          className="xl:col-span-3 rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Recent Call Logs</SectionTitle>
            <Link href="/call-logs">
              <span
                className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
                style={{ color: "var(--brand-500)" }}
              >
                See all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          {data.recentCallLogs?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date / Time", "From", "Duration", "Status"].map((h) => (
                      <th
                        key={h}
                        className="pb-2 text-left font-bold uppercase tracking-wider pr-4"
                        style={{ color: "var(--brand-500)", fontSize: "10px" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentCallLogs.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                    >
                      <td className="py-2.5 pr-4" style={{ color: "var(--muted-text)" }}>
                        {parseDateSafe(row.startedAt)}
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: "var(--foreground)" }}>
                        {row.fromNumber}
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: "var(--muted-text)" }}>
                        {formatDuration(row.durationSeconds)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          style={
                            row.status === "passed"
                              ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }
                              : { background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
                          }
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: row.status === "passed" ? "#22c55e" : "#f87171" }}
                          />
                          {row.status === "passed" ? "Passed" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[10px]" style={{ color: "var(--subtle-text)" }}>
                Showing 1 – {data.recentCallLogs.length} of {totalCallsKpi?.value ?? data.recentCallLogs.length}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--muted-text)" }}>No calls recorded yet.</p>
            </div>
          )}
        </div>

        {/* Calls & Minutes Trend */}
        <div
          className="xl:col-span-2 rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SectionTitle>Calls &amp; Minutes Trend</SectionTitle>
          <div className="flex-1 min-h-[220px]">
            {data.trends?.length > 0 ? (
              <CallTrendsChart data={data.trends} showMinutes={true} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--muted-text)" }}>No trend data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Donut + Bar + Sparkline ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Calls by Status */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SectionTitle>Calls by Status</SectionTitle>
          <div className="flex-1 min-h-[200px]">
            <DonutChart
              data={[
                { name: "Passed", value: callsByStatus.passed, color: "#22c55e" },
                { name: "Failed", value: callsByStatus.failed, color: "#f87171" },
              ]}
              total={totalCallsNum}
            />
          </div>
        </div>

        {/* Minutes Used by Day */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SectionTitle>Minutes Used by Day</SectionTitle>
          <div className="flex-1 min-h-[200px]">
            <MinutesBarChart data={minutesByDay} />
          </div>
        </div>

        {/* Call Success Rate Sparkline */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SectionTitle>Success Rate Trend</SectionTitle>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p
                className="text-3xl font-extrabold"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--foreground)" }}
              >
                {totalCallsNum > 0
                  ? `${Math.round((callsByStatus.passed / totalCallsNum) * 100)}%`
                  : "N/A"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-text)" }}>Overall Success Rate</p>
            </div>
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#00f0ff,#0099cc)", boxShadow: "0 4px 12px rgba(0,212,255,0.35)" }}
            >
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Tooltip contentStyle={{ display: "none" }} />
                <Line type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-center pb-2" style={{ color: "var(--subtle-text)" }}>
        ⓘ All times are shown in your local time zone.
      </p>
    </div>
  );
}
