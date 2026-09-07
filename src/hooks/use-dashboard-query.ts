"use client";

import { useEffect, useState } from "react";
import { supabase, cdrsSupabase } from "@/lib/supabase";
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

  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    async function fetchOverview() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/dashboard/overview");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard metrics");
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        console.error("[useDashboardOverviewQuery Error]", e);
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOverview();
  }, [hydrated]);

  return { data, isLoading, error };
}