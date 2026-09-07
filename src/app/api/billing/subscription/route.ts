// src/app/api/billing/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { getUserAgentIds } from "@/lib/user-agents";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const supabase = createServerSupabaseClient();

  const { data: user, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      active_subscription_id,
      subscriptions!users_active_subscription_id_fkey (
        id,
        status,
        started_at,
        ends_at,
        cancelled_at,
        minutes_used,
        monthly_price_snapshot,
        price_per_minute_snapshot,
        total_minutes_snapshot,
        plans ( display_name )
      )
    `)
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const sub = (user as any).subscriptions;

  // Compute minutes from CDRs for user's assigned agents
  const assignedAgentIds = await getUserAgentIds(supabase, userId);
  let cdrMinutes = 0;
  if (assignedAgentIds.length > 0) {
    const cdrsSupabase = createCdrsServerSupabaseClient();
    const { data: cdrRows } = await cdrsSupabase
      .from("cdrs")
      .select("total_mins, total_seconds")
      .in("assistant_id", assignedAgentIds);

    if (cdrRows) {
      cdrMinutes = cdrRows.reduce((acc: number, r: any) => {
        const mins = typeof r.total_mins === "number" ? r.total_mins : (r.total_seconds ? r.total_seconds / 60 : 0);
        return acc + mins;
      }, 0);
    }
  }

  const dbMinutes = sub ? parseFloat(sub.minutes_used ?? "0") : 0;
  const usageMinutes = Math.max(dbMinutes, parseFloat(cdrMinutes.toFixed(1)));

  // Fetch full subscription history for this user, newest first
  const { data: historyRows } = await supabase
    .from("subscriptions")
    .select(`
      id,
      status,
      started_at,
      ends_at,
      cancelled_at,
      minutes_used,
      monthly_price_snapshot,
      total_minutes_snapshot,
      plans ( display_name )
    `)
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  const history = (historyRows ?? []).map((h: any) => ({
    id: h.id,
    status: h.status,
    planName: h.plans?.display_name ?? "—",
    startedAt: h.started_at,
    endsAt: h.ends_at,
    cancelledAt: h.cancelled_at,
    minutesUsed: parseFloat(h.minutes_used ?? "0"),
    totalMinutes: h.total_minutes_snapshot,
    monthlyPrice: parseFloat(h.monthly_price_snapshot ?? "0"),
  }));

  return NextResponse.json({
    subscription: sub
      ? {
        id: sub.id,
        status: sub.status,
        planName: sub.plans?.display_name ?? "—",
        startedAt: sub.started_at,
        endsAt: sub.ends_at,
        cancelledAt: sub.cancelled_at,
        minutesUsed: usageMinutes,
        totalMinutes: sub.total_minutes_snapshot,
        monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
        pricePerMinute: parseFloat(sub.price_per_minute_snapshot ?? "0"),
      }
      : null,
    usageMinutes,
    history,
  });
}