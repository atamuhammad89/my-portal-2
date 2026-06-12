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

    // Total non-admin users (role = 'owner' or 'member')
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role", ["owner", "member"]);

    // Active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Total minutes used — sum minutes_used from active subscriptions directly
    const { data: minutesRows } = await supabase
      .from("subscriptions")
      .select("minutes_used")
      .eq("status", "active");

    const totalMinutesUsed = (minutesRows ?? []).reduce(
      (sum: number, row: any) => sum + parseFloat(row.minutes_used ?? "0"),
      0
    );

        // Total revenue (sum of monthly_price_snapshot for active subscriptions)
    const { data: revenueData } = await supabase
      .from("subscriptions")
      .select("monthly_price_snapshot")
      .eq("status", "active");

    const totalRevenue = (revenueData ?? []).reduce(
      (sum, row) => sum + parseFloat(row.monthly_price_snapshot ?? "0"),
      0
    );

    // Recent signups (last 5 non-admin users joined with their subscription plan)
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
      .in("role", ["owner", "member"])
      .order("created_at", { ascending: false })
      .limit(5);

    const recentSignups = (recentUsers ?? []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      createdAt: u.created_at,
      plan: u.subscriptions?.plans?.display_name ?? "No Plan",
    }));

    return NextResponse.json({
      metrics: {
        totalUsers: totalUsers ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        totalMinutesUsed: Math.round(totalMinutesUsed),
        totalRevenue: totalRevenue.toFixed(2),
      },
      recentSignups,
    });
  } catch (err) {
    console.error("[/api/admin/overview]", err);
    return NextResponse.json({ error: "Failed to load overview." }, { status: 500 });
  }
}