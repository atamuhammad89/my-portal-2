"use client";

import { useState } from "react";
import { Users, DollarSign, Activity, PhoneCall, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { parseDateSafe, formatDuration } from "@/utils/timezone";
import { CallTrendsChart } from "@/components/dashboard/call-trends-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { MinutesBarChart } from "@/components/dashboard/minutes-bar-chart";
import { PbStatCard } from "@/components/shared/pb-stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useResellerOverviewQuery } from "@/hooks/use-reseller-queries";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ─── Section Header ──────────────────────────────────────────────────────────
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

// ─── Chart Card ─────────────────────────────────────────────────────────────
function ChartPanel({ title, children, height = 240 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <SectionTitle>{title}</SectionTitle>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ResellerDashboardPage() {
  const { data, isLoading, error } = useResellerOverviewQuery();
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

  if (error) return <ErrorState message="Reseller overview could not be loaded." />;
  if (!data) return <EmptyState title="No metrics" message="No reseller statistics are available yet." />;

  // Parse KPI values
  const [custKpi, commKpi, minsKpi, callsKpi] = data.kpis ?? [];
  const callsByStatus = (data as any).callsByStatus ?? { passed: 0, failed: 0 };
  const minutesByDay: { date: string; minutes: number }[] = (data as any).minutesByDay ?? [];
  const totalCallsNum = parseInt(callsKpi?.value ?? "0", 10) || 0;
  const totalCommission = commKpi?.value ?? "$0.00";

  // Build commission sparkline from trends
  const commSparkline = (data.trends ?? []).map((t: any) => ({
    value: t.totalMinutes ?? 0,
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
            Reseller Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-text)" }}>
            Monitor your clients, track commission earnings, and view call history.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Data as of */}
          <div className="text-xs text-right" style={{ color: "var(--muted-text)" }}>
            <span className="font-semibold" style={{ color: "var(--brand-500)" }}>Data as of</span>
            <br />
            {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
          {/* Date Range chip */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-default"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--brand-500)" }} />
            {dateRange}
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PbStatCard
          label="My Customers"
          value={custKpi?.value ?? "0"}
          subtext="Total active customers"
          accent="cyan"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Monthly Commission"
          value={commKpi?.value ?? "$0.00"}
          subtext="Total commission earned"
          accent="green"
          icon={<DollarSign className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Total Minutes Used"
          value={minsKpi?.value ?? "0"}
          subtext="Total call minutes used"
          accent="purple"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <PbStatCard
          label="Total Calls"
          value={callsKpi?.value ?? "0"}
          subtext="Total calls placed"
          accent="pink"
          icon={<PhoneCall className="h-6 w-6 text-white" />}
        />
      </div>

      {/* ── Row 2: Recent Logs + Trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Recent Call Logs */}
        <div
          className="xl:col-span-3 rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Recent Call Logs</SectionTitle>
            <Link href="/reseller/call-logs">
              <span
                className="flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
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
                  {data.recentCallLogs.map((row: any) => (
                    <tr
                      key={row.id}
                      className="transition-colors"
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
                Showing 1 – {data.recentCallLogs.length} of {callsKpi?.value ?? data.recentCallLogs.length}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--muted-text)" }}>No calls recorded yet.</p>
            </div>
          )}
        </div>

        {/* Calls & Minutes Trend */}
        <ChartPanel title="Calls & Minutes Trend" height={260}>
          {data.trends?.length > 0 ? (
            <CallTrendsChart data={data.trends} showMinutes={true} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--muted-text)" }}>No trend data yet.</p>
            </div>
          )}
        </ChartPanel>
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

        {/* Commission Overview */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SectionTitle>Commission Overview</SectionTitle>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p
                className="text-3xl font-extrabold"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--foreground)" }}
              >
                {totalCommission}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-text)" }}>Total Commission</p>
            </div>
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 12px rgba(34,197,94,0.35)" }}
            >
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          {/* Mini sparkline */}
          <div className="flex-1 min-h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commSparkline}>
                <Tooltip
                  contentStyle={{ display: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
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
