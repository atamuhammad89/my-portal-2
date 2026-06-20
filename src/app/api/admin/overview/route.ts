import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();

    // ── Core metrics ──────────────────────────────────────────────────────────
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role", ["owner", "super_admin", "reseller"]);

    const { count: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: inactiveSubscriptions } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .neq("status", "active");

    const { data: minutesRows } = await supabase
      .from("subscriptions")
      .select("minutes_used")
      .eq("status", "active");

    const totalMinutesUsed = (minutesRows ?? []).reduce(
      (sum: number, row: any) => sum + parseFloat(row.minutes_used ?? "0"),
      0
    );

    const { data: revenueData } = await supabase
      .from("subscriptions")
      .select("monthly_price_snapshot")
      .eq("status", "active");

    const totalRevenue = (revenueData ?? []).reduce(
      (sum, row) => sum + parseFloat(row.monthly_price_snapshot ?? "0"),
      0
    );

    // ── Recent signups ────────────────────────────────────────────────────────
    const { data: recentUsers } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        created_at,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          plans ( display_name )
        )
      `)
      .in("role", ["owner", "super_admin", "reseller"])
      .order("created_at", { ascending: false })
      .limit(5);

    const recentSignups = (recentUsers ?? []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      createdAt: u.created_at,
      plan: u.subscriptions?.plans?.display_name ?? "No Plan",
    }));

    // ── CDR call trends: last 7 days ──────────────────────────────────────────
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const { data: recentCdrs } = await supabase
      .from("cdrs")
      .select("start_datetime, is_successful, total_mins")
      .gte("start_datetime", sevenDaysAgo.toISOString())
      .order("start_datetime", { ascending: false });

    const dayMap: Record<string, { total: number; answered: number; missed: number; minutes: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      dayMap[label] = { total: 0, answered: 0, missed: 0, minutes: 0 };
    }

    (recentCdrs ?? []).forEach((r: any) => {
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

    const callsTrend = Object.entries(dayMap).map(([date, v]) => ({
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

    // Total platform-level calls & status
    const { count: totalPlatformCalls } = await supabase
      .from("cdrs")
      .select("*", { count: "exact", head: true });

    const { count: passedCalls } = await supabase
      .from("cdrs")
      .select("*", { count: "exact", head: true })
      .eq("is_successful", true);

    const failedCalls = (totalPlatformCalls ?? 0) - (passedCalls ?? 0);

    return NextResponse.json({
      metrics: {
        totalUsers: totalUsers ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        totalMinutesUsed: Math.round(totalMinutesUsed),
        totalRevenue: totalRevenue.toFixed(2),
      },
      recentSignups,
      callsTrend,
      minutesByDay,
      callsByStatus: { passed: passedCalls ?? 0, failed: failedCalls },
      subscriptionsByStatus: {
        active: activeSubscriptions ?? 0,
        inactive: inactiveSubscriptions ?? 0,
      },
    });
  } catch (err) {
    console.error("[/api/admin/overview]", err);
    return NextResponse.json({ error: "Failed to load overview." }, { status: 500 });
  }
}