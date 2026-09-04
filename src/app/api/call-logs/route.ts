import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

/**
 * GET /api/call-logs
 *
 * Returns CDR rows for the authenticated customer based on agent IDs assigned to them
 * in the agents table (created_by = user_id), user_agent_access, or user_assistant_assignments.
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient(); // service-role key, bypasses RLS

  // ── 1. Resolve all agent IDs assigned to / owned by this user ─────────────────
  const agentIdsSet = new Set<string>();

  // a) From agents table (ownership where created_by = jwt.sub)
  try {
    const { data: ownedAgents } = await supabase
      .from("agents")
      .select("id, retell_agent_id")
      .eq("created_by", jwt.sub);

    (ownedAgents || []).forEach((a: any) => {
      if (a.retell_agent_id) agentIdsSet.add(a.retell_agent_id);
      if (a.id) agentIdsSet.add(a.id);
    });
  } catch (e) {
    console.warn("[call-logs] ownedAgents query error:", e);
  }

  // b) From user_agent_access table
  try {
    const { data: accessRows } = await supabase
      .from("user_agent_access")
      .select("agent_id")
      .eq("user_id", jwt.sub);

    (accessRows || []).forEach((r: any) => {
      if (r.agent_id) agentIdsSet.add(r.agent_id);
    });
  } catch (e) {
    console.warn("[call-logs] user_agent_access query error:", e);
  }

  // c) From user_assistant_assignments table
  try {
    const { data: legacyAssignments } = await supabase
      .from("user_assistant_assignments")
      .select("assistant_id")
      .eq("user_id", jwt.sub);

    (legacyAssignments || []).forEach((a: any) => {
      if (a.assistant_id) agentIdsSet.add(a.assistant_id);
    });
  } catch (e) {
    console.warn("[call-logs] user_assistant_assignments query error:", e);
  }

  const assignedAgentIds = Array.from(agentIdsSet);

  // ── 2. Fetch ALL subscription periods for this user ────────────────────────
  let subscriptions: any[] = [];
  try {
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("id, started_at, ends_at, status, price_per_minute_snapshot")
      .eq("user_id", jwt.sub)
      .order("started_at", { ascending: true });

    subscriptions = subRows ?? [];
  } catch (e) {
    console.warn("[call-logs] subscriptions query warn:", e);
  }

  // ── 3. Resolve price_per_minute from active subscription if available ───────
  let pricePerMinute: number | null = null;
  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("active_subscription_id")
      .eq("id", jwt.sub)
      .single();

    if (userRow?.active_subscription_id) {
      const activeSub = subscriptions.find((s: any) => s.id === userRow.active_subscription_id);
      if (activeSub) {
        pricePerMinute = Number((activeSub as any).price_per_minute_snapshot);
      }
    }
  } catch (e) {}

  const cdrsSupabase = createCdrsServerSupabaseClient();
  let rows: any[] = [];

  // ── 4. Fetch CDR rows matching user's assigned agent IDs ────────────────────
  try {
    if (assignedAgentIds.length > 0) {
      const { data, error: cdrError } = await cdrsSupabase
        .from("cdrs")
        .select("*")
        .in("assistant_id", assignedAgentIds)
        .order("start_datetime", { ascending: false });

      if (!cdrError && data) {
        rows = data;
      } else if (cdrError) {
        console.warn("[call-logs] CDR fetch error by assistant_id:", cdrError);
      }
    }
  } catch (cdrErr) {
    console.error("[call-logs] CDR fetch exception:", cdrErr);
  }

  // ── 5. Filter CDRs to subscription period ONLY IF subscription ranges exist ─────
  function parseCdrDate(raw: string | number | null | undefined): number | null {
    if (raw === null || raw === undefined || raw === "") return null;

    const ts = Number(raw);
    if (!isNaN(ts) && String(raw).trim() !== "") {
      const ms = ts > 1e12 ? ts : ts * 1000;
      return isNaN(ms) ? null : ms;
    }

    if (typeof raw === "string") {
      const ddmm = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}:\d{2}(?::\d{2})?))?/);
      if (ddmm) {
        const [, dd, mm, yyyy, time] = ddmm;
        const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time ?? "00:00:00"}`;
        const d = new Date(iso).getTime();
        return isNaN(d) ? null : d;
      }
      const d = new Date(raw).getTime();
      return isNaN(d) ? null : d;
    }

    return null;
  }

  let filteredRows = rows;

  if (subscriptions.length > 0) {
    const subRanges = subscriptions
      .map((s: any) => {
        const start = s.started_at ? new Date(s.started_at).getTime() : null;
        const end   = s.ends_at    ? new Date(s.ends_at).getTime()    : null;
        return { start, end };
      })
      .filter((r) => r.start !== null && !isNaN(r.start!)) as Array<{
        start: number;
        end: number | null;
      }>;

    if (subRanges.length > 0) {
      filteredRows = rows.filter((row: any) => {
        const callMs = parseCdrDate(row.start_datetime);
        if (callMs === null) return false;

        return subRanges.some(({ start, end }) => {
          const afterStart = callMs >= start;
          const beforeEnd  = end === null ? true : callMs <= end;
          return afterStart && beforeEnd;
        });
      });
    }
  }

  console.log(
    `[call-logs] user=${jwt.sub} | assignedAgents=${assignedAgentIds.length} | total CDRs: ${rows.length} | filtered: ${filteredRows.length}`
  );

  // ── 6. Shape & enrich the response ────────────────────────────────────────
  const result = filteredRows.map((row: any) => {
    const durationSeconds =
      row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
    const billableMinutes = durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0;

    let computedCost: number | null = null;
    if (pricePerMinute !== null && durationSeconds > 0) {
      computedCost = Math.round(billableMinutes * pricePerMinute * 100) / 100;
    }

    return {
      id: row.id,
      callId: row.call_id ?? row.id,
      startedAt: row.start_datetime ?? "",
      endedAt: row.end_datetime ?? null,
      fromNumber: row.customer_number ?? "—",
      toNumber: row.assistant_id ?? "—",
      durationSeconds,
      status: row.is_successful === true ? "passed" : "failed",
      agentName: row.assistant_id ?? "Voice Agent",
      hasRecording: Boolean(row.call_recording),
      recordingUrl: row.call_recording ?? null,
      cost: computedCost,
      transcript: row.transcript ?? null,
      disconnectionReason: row.disconnection_reason ?? null,
      callInfo: row.call_info ?? null,
      customerSentiment: row.customer_sentiment ?? null,
      isSuccessful: row.is_successful ?? null,
    };
  });

  return NextResponse.json(result);
}
