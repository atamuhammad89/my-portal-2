"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CallLog } from "@/types/call-log";
import { Recording } from "@/types/recording";
import { TrendPoint, AgentPerformancePoint, DashboardKpi } from "@/types/dashboard";
import { useAuthStore } from "@/store/auth-store";

export type DashboardOverview = {
  kpis: DashboardKpi[];
  trends: TrendPoint[];
  agentPerformance: AgentPerformancePoint[];
  recentCallLogs: CallLog[];
  recentRecordings: Recording[];
  callsByStatus: { passed: number; failed: number };
  minutesByDay: { date: string; minutes: number }[];
};

function toDateLabel(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function useDashboardOverviewQuery() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    async function fetch() {
      setIsLoading(true);
      try {
        if (!user?.id) {
          console.warn("[Auth] No user in store after hydration.");
          setIsLoading(false);
          return;
        }

        // ── Step 1: Resolve the assistant_id assigned to this user ────────────
        const { data: assignmentRow, error: assignmentError } = await supabase
          .from("user_assistant_assignments")
          .select("assistant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (assignmentError) throw new Error(assignmentError.message);

        if (!assignmentRow?.assistant_id) {
          const today = new Date();
          const empty7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return { date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), minutes: 0 };
          });
          setData({
            kpis: [
              { label: "Total Calls", value: "0" },
              { label: "Succeeded Calls", value: "0" },
              { label: "Failed Calls", value: "0" },
              { label: "Total Minutes Used", value: "0.0" },
            ],
            trends: [],
            agentPerformance: [],
            recentCallLogs: [],
            recentRecordings: [],
            callsByStatus: { passed: 0, failed: 0 },
            minutesByDay: empty7Days,
          });
          setIsLoading(false);
          return;
        }

        const assignedAssistantId = assignmentRow.assistant_id;

        // ── Step 2: Fetch CDRs scoped to assigned assistant ────────────────────
        const { data: rows, error: err } = await supabase
          .from("cdrs")
          .select("*")
          .eq("assistant_id", assignedAssistantId)
          .order("start_datetime", { ascending: false });

        if (err) throw new Error(err.message);

        const all = rows ?? [];
        const today = new Date();

        // ── KPIs ──────────────────────────────────────────────────────────────
        const totalCalls = all.length;
        const succeededCalls = all.filter((r) => r.is_successful === true).length;
        const failedCalls = all.filter((r) => r.is_successful === false).length;
        const distinctAgents = new Set(all.map((r) => r.assistant_id).filter(Boolean)).size;
        const totalMinutes = all.reduce((acc, r) => acc + (r.total_mins ?? 0), 0);

        const kpis: DashboardKpi[] = [
          { label: "Total Calls",       value: totalCalls.toLocaleString() },
          { label: "Succeeded Calls",   value: succeededCalls.toLocaleString() },
          { label: "Failed Calls",      value: failedCalls.toLocaleString() },
          { label: "Total Minutes Used",value: totalMinutes.toFixed(1) },
        ];

        // ── Trends + minutesByDay in one pass ─────────────────────────────────
        const dayMap: Record<string, { total: number; answered: number; missed: number; minutes: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          dayMap[label] = { total: 0, answered: 0, missed: 0, minutes: 0 };
        }

        all.forEach((r) => {
          const ts = Number(r.start_datetime);
          const d = isNaN(ts) ? new Date(r.start_datetime) : new Date(ts);
          if (isNaN(d.getTime())) return;
          const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
          if (diff > 6 || diff < 0) return;
          const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          if (!dayMap[label]) return;
          dayMap[label].total++;
          if (r.is_successful === true) dayMap[label].answered++;
          if (r.is_successful === false) dayMap[label].missed++;
          dayMap[label].minutes += r.total_mins ?? 0;
        });

        const trends: TrendPoint[] = Object.entries(dayMap).map(([date, v]) => ({
          date,
          totalCalls: v.total,
          answeredCalls: v.answered,
          missedCalls: v.missed,
          totalMinutes: parseFloat(v.minutes.toFixed(1)),
        }));

        const minutesByDay = Object.entries(dayMap).map(([date, v]) => ({
          date,
          minutes: parseFloat(v.minutes.toFixed(1)),
        }));

        // ── callsByStatus ─────────────────────────────────────────────────────
        const callsByStatus = { passed: succeededCalls, failed: failedCalls };

        // ── Agent Performance ─────────────────────────────────────────────────
        const agentMap: Record<string, { total: number; success: number; durations: number[] }> = {};
        all.forEach((r) => {
          const id = r.assistant_id ?? "Unknown";
          if (!agentMap[id]) agentMap[id] = { total: 0, success: 0, durations: [] };
          agentMap[id].total++;
          if (r.is_successful === true) agentMap[id].success++;
          if (r.total_seconds) agentMap[id].durations.push(r.total_seconds);
        });

        const agentPerformance: AgentPerformancePoint[] = Object.entries(agentMap)
          .map(([id, v]) => ({
            agentName: id.length > 16 ? id.slice(0, 14) + "…" : id,
            successRate: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
            avgDurationSeconds:
              v.durations.length > 0
                ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length)
                : 0,
          }))
          .slice(0, 8);

        // ── Recent Call Logs (last 5) ─────────────────────────────────────────
        const recentCallLogs: CallLog[] = all.slice(0, 5).map((r) => ({
          id: r.id,
          callId: r.call_id ?? r.id,
          startedAt: r.start_datetime ?? "",
          endedAt: r.end_datetime ?? null,
          fromNumber: r.customer_number ?? "—",
          toNumber: r.assistant_id ?? "—",
          durationSeconds: r.total_seconds ?? 0,
          status: r.is_successful === true ? "passed" : "failed",
          agentName: r.assistant_id ?? "Unknown",
          hasRecording: Boolean(r.call_recording),
          recordingUrl: r.call_recording ?? null,
          cost: r.total_mins ?? null,
          transcript: r.transcript ?? null,
          disconnectionReason: r.disconnection_reason ?? null,
          callInfo: r.call_info ?? null,
          customerSentiment: r.customer_sentiment ?? null,
          isSuccessful: r.is_successful ?? null,
        }));

        // ── Recent Recordings ─────────────────────────────────────────────────
        const withRecording = all.filter((r) => Boolean(r.call_recording));
        const recentRecordings: Recording[] = withRecording.slice(0, 2).map((r) => ({
          id: r.id,
          callId: r.call_id ?? r.id,
          agentName: r.assistant_id ?? "Unknown",
          customerNumber: r.customer_number ?? "—",
          durationSeconds: r.total_seconds ?? 0,
          createdAt: r.start_datetime ?? "",
          audioUrl: r.call_recording,
        }));

        setData({ kpis, trends, agentPerformance, recentCallLogs, recentRecordings, callsByStatus, minutesByDay });
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [hydrated, user]);

  return { data, isLoading, error };
}