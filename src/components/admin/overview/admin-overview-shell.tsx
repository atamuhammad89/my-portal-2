"use client";

import { useState } from "react";
import { Users, TrendingUp, Clock, DollarSign, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PbStatCard } from "@/components/shared/pb-stat-card";
import { CallTrendsChart } from "@/components/dashboard/call-trends-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { MinutesBarChart } from "@/components/dashboard/minutes-bar-chart";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useAdminOverviewQuery } from "@/hooks/admin/use-admin-overview-query";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";
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

export function AdminOverviewShell() {
  const { data, isLoading, error } = useAdminOverviewQuery();
  const [dateRange] = useState("Last 7 Days");

  return (
    <AdminPermissionGuard allow={["overview"]}>
      {isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} className="h-28" />)}
          </div>
          <LoadingSkeleton className="h-72 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <ErrorState message="Admin overview could not be loaded." />
      ) : !data ? (
        <EmptyState title="No overview data" message="No platform overview metrics are available." />
      ) : (
        <div className="space-y-5">
          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-extrabold"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--page-header-title)" }}
              >
                Platform Overview
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-text)" }}>
                Real-time metrics pulled from your database.
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
              label="Total Customers"
              value={String(data.metrics.totalUsers)}
              subtext="Registered users"
              accent="cyan"
              icon={<Users className="h-6 w-6 text-white" />}
            />
            <PbStatCard
              label="Active Subscriptions"
              value={String(data.metrics.activeSubscriptions)}
              subtext="Currently active"
              accent="green"
              icon={<TrendingUp className="h-6 w-6 text-white" />}
            />
            <PbStatCard
              label="Total Minutes Used"
              value={data.metrics.totalMinutesUsed.toLocaleString() + " min"}
              subtext="This month"
              accent="purple"
              icon={<Clock className="h-6 w-6 text-white" />}
            />
            <PbStatCard
              label="Monthly Revenue"
              value={"$" + Number(data.metrics.totalRevenue).toLocaleString()}
              subtext="Active subscriptions"
              accent="orange"
              icon={<DollarSign className="h-6 w-6 text-white" />}
            />
          </div>

          {/* ── Row 2: Recent Signups + Call Trend ── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Recent Signups Table */}
            <div
              className="xl:col-span-3 rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Recent Signups</SectionTitle>
                <Link href="/admin/customers">
                  <span
                    className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    style={{ color: "var(--brand-500)" }}
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>

              {data.recentSignups.length === 0 ? (
                <EmptyState title="No signups yet" message="No customers have signed up yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Name", "Email", "Plan", "Signed Up"].map((h) => (
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
                      {data.recentSignups.map((u) => {
                        const name = u.fullName || u.email || "Customer";
                        const initial = name[0].toUpperCase();
                        const colors = ["#00d4ff", "#22c55e", "#f97316", "#a855f7"];
                        const color = colors[name.length % colors.length];
                        const isPro = u.plan.toLowerCase().includes("pro");
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 text-white"
                                  style={{ background: color }}
                                >
                                  {initial}
                                </div>
                                <span className="font-bold" style={{ color: "var(--foreground)" }}>{name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-4" style={{ color: "var(--muted-text)" }}>{u.email}</td>
                            <td className="py-2.5 pr-4">
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                                style={
                                  isPro
                                    ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }
                                    : { background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                                }
                              >
                                {u.plan}
                              </span>
                            </td>
                            <td className="py-2.5" style={{ color: "var(--muted-text)" }}>
                              {formatDateTime(u.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                {(data.callsTrend ?? []).length > 0 ? (
                  <CallTrendsChart data={data.callsTrend} showMinutes={true} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--muted-text)" }}>No trend data yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 3: Donut + Bar + Revenue Sparkline ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Subscription Status Donut */}
            <div
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <SectionTitle>Subscriptions by Status</SectionTitle>
              <div className="flex-1 min-h-[200px]">
                <DonutChart
                  data={[
                    { name: "Active", value: data.subscriptionsByStatus?.active ?? 0, color: "#22c55e" },
                    { name: "Inactive", value: data.subscriptionsByStatus?.inactive ?? 0, color: "#f87171" },
                  ]}
                  total={(data.subscriptionsByStatus?.active ?? 0) + (data.subscriptionsByStatus?.inactive ?? 0)}
                  totalLabel="Total Subs"
                />
              </div>
            </div>

            {/* Minutes by Day Bar */}
            <div
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <SectionTitle>Minutes Used by Day</SectionTitle>
              <div className="flex-1 min-h-[200px]">
                <MinutesBarChart data={data.minutesByDay ?? []} />
              </div>
            </div>

            {/* Revenue Overview Sparkline */}
            <div
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <SectionTitle>Revenue Overview</SectionTitle>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p
                    className="text-3xl font-extrabold"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--foreground)" }}
                  >
                    ${Number(data.metrics.totalRevenue).toLocaleString()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-text)" }}>Monthly Revenue</p>
                </div>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
                >
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              {/* Mini sparkline using callsTrend totalMinutes as proxy */}
              <div className="flex-1 min-h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(data.callsTrend ?? []).map((t) => ({ value: t.totalMinutes }))}>
                    <Tooltip contentStyle={{ display: "none" }} />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
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
      )}
    </AdminPermissionGuard>
  );
}