import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt || !requireRole(jwt, ["reseller"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resellerId = jwt.sub;

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch all customer owners assigned to this reseller
    const { data: clients, error: clientError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        is_active,
        commission_rate,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          monthly_price_snapshot,
          minutes_used,
          started_at,
          ends_at,
          plans ( display_name )
        )
      `)
      .eq("reseller_id", resellerId)
      .eq("role", "owner");

    if (clientError) throw clientError;

    const clientIds = (clients ?? []).map((c: any) => c.id);
    const totalCustomers = clientIds.length;

    // 2. Fetch reseller default commission rate
    const { data: resellerUser } = await supabase
      .from("users")
      .select("commission_rate")
      .eq("id", resellerId)
      .single();
    const defaultRate =
      resellerUser?.commission_rate !== null && resellerUser?.commission_rate !== undefined
        ? parseFloat(resellerUser.commission_rate)
        : 0.0;

    // 3. Calculate total commission from active subscriptions
    let totalCommission = 0;
    (clients ?? []).forEach((c: any) => {
      const sub = c.subscriptions;
      if (sub && sub.status === "active") {
        const monthlyPrice = parseFloat(sub.monthly_price_snapshot ?? "0");
        const rate =
          c.commission_rate !== null && c.commission_rate !== undefined
            ? parseFloat(c.commission_rate)
            : defaultRate;
        totalCommission += monthlyPrice * rate;
      }
    });

    // Construct map of user subscriptions to check dates
    const userSubscriptionMap: Record<string, { start: number | null; end: number | null }> = {};
    (clients ?? []).forEach((c: any) => {
      const sub = c.subscriptions;
      if (sub) {
        const start = sub.started_at ? new Date(sub.started_at).getTime() : null;
        const end = sub.ends_at ? new Date(sub.ends_at).getTime() : null;
        userSubscriptionMap[c.id] = { start, end };
      } else {
        userSubscriptionMap[c.id] = { start: null, end: null };
      }
    });

    // 4. Resolve assistant_ids for these customers and fetch CDRs
    let totalMinutes = 0;
    let totalCalls = 0;
    let passedCount = 0;
    let failedCount = 0;
    let recentCallLogs: any[] = [];
    let trends: any[] = [];
    let minutesByDay: { date: string; minutes: number }[] = [];

    // Build default 7-day structure
    const today = new Date();

    const trendsMap: Record<string, { total: number; answered: number; missed: number; minutes: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      trendsMap[label] = { total: 0, answered: 0, missed: 0, minutes: 0 };
    }

    if (clientIds.length > 0) {
      const { data: assignments, error: assignmentError } = await supabase
        .from("user_assistant_assignments")
        .select("user_id, assistant_id")
        .in("user_id", clientIds);

      if (assignmentError) throw assignmentError;

      const assistantIds = (assignments ?? []).map((a: any) => a.assistant_id).filter(Boolean);
      const assistantToUser: Record<string, string> = {};
      const userMap: Record<string, { fullName: string; email: string }> = {};

      (assignments ?? []).forEach((a: any) => {
        assistantToUser[a.assistant_id] = a.user_id;
      });
      (clients ?? []).forEach((c: any) => {
        userMap[c.id] = { fullName: c.full_name, email: c.email };
      });

      if (assistantIds.length > 0) {
        const cdrsSupabase = createCdrsServerSupabaseClient();
        const { data: cdrs, error: cdrError } = await cdrsSupabase
          .from("cdrs")
          .select("*")
          .in("assistant_id", assistantIds)
          .order("start_datetime", { ascending: false });

        if (cdrError) throw cdrError;

        const allCdrs = cdrs ?? [];

        // Filter CDRs to only include calls within customer subscription start and end dates
        const filteredCdrs = allCdrs.filter((r: any) => {
          const userId = assistantToUser[r.assistant_id];
          if (!userId) return false;
          const subDates = userSubscriptionMap[userId];
          if (!subDates || subDates.start === null) return false;

          const callMs = parseCdrDate(r.start_datetime);
          if (callMs === null) return false;

          if (callMs < subDates.start) return false;
          if (subDates.end !== null && callMs > subDates.end) return false;
          return true;
        });

        // Aggregate totals based on filtered CDRs
        totalMinutes = filteredCdrs.reduce((acc: number, r: any) => acc + (r.total_mins ?? 0), 0);
        totalCalls = filteredCdrs.length;
        passedCount = filteredCdrs.filter((r: any) => r.is_successful === true).length;
        failedCount = filteredCdrs.filter((r: any) => r.is_successful === false).length;

        // Build trend + minutesByDay maps in one pass
        filteredCdrs.forEach((r: any) => {
          const ts = Number(r.start_datetime);
          const d = isNaN(ts) ? new Date(r.start_datetime) : new Date(ts);
          if (isNaN(d.getTime())) return;
          const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
          if (diff > 6 || diff < 0) return;
          const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          if (!trendsMap[label]) return;
          trendsMap[label].total++;
          if (r.is_successful === true) trendsMap[label].answered++;
          if (r.is_successful === false) trendsMap[label].missed++;
          trendsMap[label].minutes += r.total_mins ?? 0;
        });

        // Recent call logs (last 5)
        recentCallLogs = filteredCdrs.slice(0, 5).map((row: any) => {
          const durationSeconds = row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
          const userId = assistantToUser[row.assistant_id] ?? null;
          const userInfo = userId ? userMap[userId] : null;
          return {
            id: row.id,
            callId: row.call_id ?? row.id,
            startedAt: row.start_datetime ?? "",
            endedAt: row.end_datetime ?? null,
            fromNumber: row.customer_number ?? "—",
            toNumber: row.assistant_id ?? "—",
            durationSeconds,
            status: row.is_successful === true ? "passed" : "failed",
            hasRecording: Boolean(row.call_recording),
            recordingUrl: row.call_recording ?? null,
            customerName: userInfo?.fullName ?? "—",
            customerEmail: userInfo?.email ?? "—",
          };
        });
      }
    }

    // Build final arrays from trendsMap
    trends = Object.entries(trendsMap).map(([date, v]) => ({
      date,
      totalCalls: v.total,
      answeredCalls: v.answered,
      missedCalls: v.missed,
      totalMinutes: parseFloat(v.minutes.toFixed(1)),
    }));

    minutesByDay = Object.entries(trendsMap).map(([date, v]) => ({
      date,
      minutes: parseFloat(v.minutes.toFixed(1)),
    }));

    const kpis = [
      { label: "My Customers",       value: totalCustomers.toLocaleString() },
      { label: "Monthly Commission",  value: `$${totalCommission.toFixed(2)}` },
      { label: "Total Minutes Used",  value: totalMinutes.toFixed(1) },
      { label: "Total Calls",         value: totalCalls.toLocaleString() },
    ];

    return NextResponse.json({
      kpis,
      trends,
      recentCallLogs,
      callsByStatus: { passed: passedCount, failed: failedCount },
      minutesByDay,
    });
  } catch (err: any) {
    console.error("[GET /api/reseller/overview]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch overview." }, { status: 500 });
  }
}

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
