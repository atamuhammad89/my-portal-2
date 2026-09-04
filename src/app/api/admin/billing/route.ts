import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

// GET /api/admin/billing — all non-admin users with their active subscription billing info
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          started_at,
          ends_at,
          minutes_used,
          monthly_price_snapshot,
          price_per_minute_snapshot,
          total_minutes_snapshot,
          plans ( display_name )
        )
      `)
      .eq("role", "owner")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch assistant assignments for all users
    const userIds = (data ?? []).map((u: any) => u.id);
    const { data: assignments } = await supabase
      .from("user_assistant_assignments")
      .select("user_id, assistant_id")
      .in("user_id", userIds);

    const assignmentMap: Record<string, string> = {};
    (assignments ?? []).forEach((a: any) => {
      assignmentMap[a.user_id] = a.assistant_id;
    });

    // Fetch usage from call_logs per assistant
    const assistantIds = Object.values(assignmentMap);
    const usageMap: Record<string, number> = {};
    if (assistantIds.length > 0) {
      const cdrsSupabase = createCdrsServerSupabaseClient();
      const { data: usageRows } = await cdrsSupabase
        .from("cdrs")
        .select("assistant_id, total_seconds")
        .in("assistant_id", assistantIds);

      (usageRows ?? []).forEach((row: any) => {
        const aid = row.assistant_id;
        usageMap[aid] = (usageMap[aid] ?? 0) + (row.total_seconds ?? 0);
      });
    }

    const rows = (data ?? []).map((u: any) => {
      const sub = u.subscriptions;
      const assignedAgentId = assignmentMap[u.id] ?? null;
      const usageSeconds = assignedAgentId ? (usageMap[assignedAgentId] ?? 0) : 0;

      return {
        userId: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        usageMinutes: Math.round(usageSeconds / 60),
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              planName: sub.plans?.display_name ?? "—",
              startedAt: sub.started_at,
              endsAt: sub.ends_at,
              minutesUsed: parseFloat(sub.minutes_used ?? "0"),
              totalMinutes: sub.total_minutes_snapshot,
              monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
              pricePerMinute: parseFloat(sub.price_per_minute_snapshot ?? "0"),
            }
          : null,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/admin/billing]", err);
    return NextResponse.json({ error: "Failed to fetch billing data." }, { status: 500 });
  }
}