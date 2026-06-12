// src/app/api/billing/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

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

  // Use minutes_used directly from the subscriptions table
  const usageMinutes = sub ? parseFloat(sub.minutes_used ?? "0") : 0;

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
        minutesUsed: parseFloat(sub.minutes_used ?? "0"),
        totalMinutes: sub.total_minutes_snapshot,
        monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
        pricePerMinute: parseFloat(sub.price_per_minute_snapshot ?? "0"),
      }
      : null,
    usageMinutes,
    history,
  });
}