import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();

    // Step 1: fetch subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        plan_id,
        status,
        started_at,
        ends_at,
        cancelled_at,
        minutes_used,
        monthly_price_snapshot,
        price_per_minute_snapshot,
        total_minutes_snapshot
      `)
      .order("started_at", { ascending: false });

    if (subsError) {
      console.error("[subscriptions] subs query error:", subsError);
      throw subsError;
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: fetch user info for all user_ids in one query
    const userIds = [...new Set(subs.map((s: any) => s.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("id", userIds);

    if (usersError) {
      console.error("[subscriptions] users query error:", usersError);
      throw usersError;
    }

    const usersMap: Record<string, any> = {};
    (users ?? []).forEach((u: any) => {
      usersMap[u.id] = u;
    });

    // Step 3: fetch plan info for all plan_ids in one query
    const planIds = [...new Set(subs.map((s: any) => s.plan_id).filter(Boolean))];
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, display_name, name")
      .in("id", planIds);

    if (plansError) {
      console.error("[subscriptions] plans query error:", plansError);
      throw plansError;
    }

    const plansMap: Record<string, any> = {};
    (plans ?? []).forEach((p: any) => {
      plansMap[p.id] = p;
    });

    // Step 6: merge everything
    const rows = subs.map((row: any) => {
      const user = usersMap[row.user_id] ?? {};
      const plan = plansMap[row.plan_id] ?? {};

      return {
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        endsAt: row.ends_at,
        cancelledAt: row.cancelled_at,
        minutesUsed: parseFloat(row.minutes_used ?? "0"),
        monthlyPrice: parseFloat(row.monthly_price_snapshot ?? "0"),
        pricePerMinute: parseFloat(row.price_per_minute_snapshot ?? "0"),
        totalMinutes: row.total_minutes_snapshot,
        userFullName: user.full_name ?? "—",
        userEmail: user.email ?? "—",
        userId: row.user_id,
        planDisplayName: plan.display_name ?? "—",
        planId: row.plan_id,
        usageMinutes: parseFloat(row.minutes_used ?? "0"),
      };
    });


    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[GET /api/admin/subscriptions]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch subscriptions." },
      { status: 500 }
    );
  }
}