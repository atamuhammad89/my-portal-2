import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { getUserAgentIds } from "@/lib/user-agents";

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub;
    const isAdmin = ["super_admin", "admin", "operations"].includes(payload.role);

    const supabase = createServerSupabaseClient();
    const assignedAgentIds = await getUserAgentIds(supabase, userId);

    const cdrsSupabase = createCdrsServerSupabaseClient();
    let rows: any[] = [];

    if (assignedAgentIds.length > 0) {
      const { data, error } = await cdrsSupabase
        .from("cdrs")
        .select("*")
        .in("assistant_id", assignedAgentIds)
        .order("start_datetime", { ascending: false });

      if (!error && data) {
        rows = data;
      }
    } else if (isAdmin) {
      const { data, error } = await cdrsSupabase
        .from("cdrs")
        .select("*")
        .order("start_datetime", { ascending: false });

      if (!error && data) {
        rows = data;
      }
    }

    const all = rows || [];
    const today = new Date();

    // ── KPIs ──────────────────────────────────────────────────────────────
    const totalCalls = all.length;
    const succeededCalls = all.filter((r) => r.is_successful === true).length;
    const failedCalls = all.filter((r) => r.is_successful === false).length;

    const totalMinutes = all.reduce((acc, r) => {
      const mins = typeof r.total_mins === "number" ? r.total_mins : (r.total_seconds ? r.total_seconds / 60 : 0);
      return acc + mins;
    }, 0);

    const kpis = [
      { label: "Total Calls", value: totalCalls.toLocaleString() },
      { label: "Succeeded Calls", value: succeededCalls.toLocaleString() },
      { label: "Failed Calls", value: failedCalls.toLocaleString() },
      { label: "Total Minutes Used", value: totalMinutes.toFixed(1) },
    ];

    // ── Trends & minutesByDay ─────────────────────────────────────────────
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

      const mins = typeof r.total_mins === "number" ? r.total_mins : (r.total_seconds ? r.total_seconds / 60 : 0);
      dayMap[label].total++;
      if (r.is_successful === true) dayMap[label].answered++;
      if (r.is_successful === false) dayMap[label].missed++;
      dayMap[label].minutes += mins;
    });

    const trends = Object.entries(dayMap).map(([date, v]) => ({
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

    const callsByStatus = { passed: succeededCalls, failed: failedCalls };

    // ── Recent Call Logs ──────────────────────────────────────────────────
    const recentCallLogs = all.slice(0, 5).map((r) => ({
      id: r.id,
      callId: r.call_id ?? r.id,
      startedAt: r.start_datetime ?? "",
      endedAt: r.end_datetime ?? null,
      fromNumber: r.customer_number ?? "—",
      toNumber: r.assistant_id ?? "—",
      durationSeconds: r.total_seconds ?? Math.round(Number(r.total_mins ?? 0) * 60),
      status: r.is_successful === true ? "passed" : "failed",
      agentName: r.assistant_id ?? "Voice Agent",
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
    const recentRecordings = withRecording.slice(0, 2).map((r) => ({
      id: r.id,
      callId: r.call_id ?? r.id,
      agentName: r.assistant_id ?? "Voice Agent",
      customerNumber: r.customer_number ?? "—",
      durationSeconds: r.total_seconds ?? Math.round(Number(r.total_mins ?? 0) * 60),
      createdAt: r.start_datetime ?? "",
      audioUrl: r.call_recording,
    }));

    return NextResponse.json({
      kpis,
      trends,
      recentCallLogs,
      recentRecordings,
      callsByStatus,
      minutesByDay,
      agentPerformance: [],
    });
  } catch (error: any) {
    console.error("[GET /api/dashboard/overview Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
}
