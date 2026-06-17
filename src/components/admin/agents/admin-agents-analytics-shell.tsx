"use client";

import { Phone, Clock, DollarSign, TrendingUp, Bot, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useAdminAgentsAnalyticsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { AgentAnalytics } from "@/types/retell";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(0,240,255,0.07)]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--brand-500)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--subtle-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {label}
        </p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)]", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs" style={{ color: "var(--subtle-text)" }}>{sub}</p>}
    </div>
  );
}

function AgentRow({ agent, rank }: { agent: AgentAnalytics; rank: number }) {
  return (
    <tr>
      <td className="py-3 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs text-[var(--muted-text)] border border-[var(--border)] font-medium">
            {rank}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{agent.agent_name}</p>
            <p className="text-xs font-mono text-[var(--subtle-text)]">{agent.retell_agent_id.slice(0, 20)}…</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">{agent.total_calls}</td>
      <td className="px-4 py-3 text-center">{agent.completed_calls}</td>
      <td className="px-4 py-3 text-center">
        {Math.floor(agent.avg_duration_seconds / 60)}m {agent.avg_duration_seconds % 60}s
      </td>
      <td className="px-4 py-3 text-center">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold border",
          agent.success_rate >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : agent.success_rate >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        )}>
          {agent.success_rate}%
        </span>
      </td>
      <td className="px-4 py-3 text-center font-semibold text-brand-teal">
        ${agent.total_cost.toFixed(4)}
      </td>
    </tr>
  );
}

function formatDurationFriendly(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function AdminAgentsAnalyticsShell() {
  const { data, isLoading, error, refetch, isRefetching } = useAdminAgentsAnalyticsQuery();

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Agents Analytics</h1>
          <p className="mt-1 text-xs text-[var(--muted-text)]">Real-time insights from Retell call data. Auto-refreshes every 30s.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded-lg border p-2 transition-colors disabled:opacity-50 hover:bg-[var(--surface-2)] cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted-text)" }}
          title="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-400">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="text-sm underline text-slate-400 hover:text-white cursor-pointer">Retry</button>
        </div>
      ) : data ? (
        <>
          {/* Overview stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Calls"
              value={data.total_calls.toLocaleString()}
              sub={`${data.ongoing_calls} currently active`}
              icon={Phone}
              color="text-brand-cyan"
            />
            <StatCard
              label="Completed Calls"
              value={data.completed_calls.toLocaleString()}
              sub={`${data.total_calls > 0 ? Math.round((data.completed_calls / data.total_calls) * 100) : 0}% completion rate`}
              icon={TrendingUp}
              color="text-emerald-400"
            />
            <StatCard
              label="Total Talk Time"
              value={formatDurationFriendly(data.total_duration_seconds)}
              sub={`${data.per_agent.length} active agents`}
              icon={Clock}
              color="text-brand-teal"
            />
            <StatCard
              label="Total Cost"
              value={`$${data.total_cost.toFixed(4)}`}
              sub="USD via Retell"
              icon={DollarSign}
              color="text-amber-400"
            />
          </div>

          {/* Per-agent breakdown */}
          {data.per_agent.length > 0 ? (
            <div className="premium-table-container">
              <div className="flex items-center gap-2 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
                <Bot className="h-4 w-4 text-brand-cyan" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Per-Agent Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="py-3 pl-5 pr-4 text-left">Agent</th>
                      <th className="px-4 py-3 text-center">Total Calls</th>
                      <th className="px-4 py-3 text-center">Completed</th>
                      <th className="px-4 py-3 text-center">Avg Duration</th>
                      <th className="px-4 py-3 text-center">Success Rate</th>
                      <th className="px-4 py-3 text-center">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.per_agent.map((agent, i) => (
                      <AgentRow key={agent.agent_id} agent={agent} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Bot className="h-10 w-10 text-[var(--subtle-text)]" />
              <p className="text-sm text-[var(--muted-text)]">No call data yet. Calls will appear here after Retell sends webhook events.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
