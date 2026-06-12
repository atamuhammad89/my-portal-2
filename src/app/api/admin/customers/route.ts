import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

// GET /api/admin/customers
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all"; // 'all' | 'active' | 'inactive'

    let query = supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        tenant_id,
        created_at,
        updated_at,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          minutes_used,
          total_minutes_snapshot,
          monthly_price_snapshot,
          started_at,
          ends_at,
          plans ( display_name )
        )
      `)
      .in("role", ["owner", "member"])
      .order("created_at", { ascending: false });

    if (status === "active") query = query.eq("is_active", true);
    if (status === "inactive") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) throw error;

    // --- Usage via user_assistant_assignments + call_logs ---

    // 1. Fetch assistant assignments for all fetched users
    const userIds = (data ?? []).map((u: any) => u.id);
    const { data: assignments } = await supabase
      .from("user_assistant_assignments")
      .select("user_id, assistant_id")
      .in("user_id", userIds);

    // 2. Build map: user_id -> assistant_id
    const assignmentMap: Record<string, string> = {};
    (assignments ?? []).forEach((a: any) => {
      assignmentMap[a.user_id] = a.assistant_id;
    });

    // 3. Fetch total duration per retell_agent_id from call_logs
    const assistantIds = Object.values(assignmentMap);
    const usageMap: Record<string, number> = {};
    if (assistantIds.length > 0) {
      const { data: usageRows } = await supabase
        .from("cdrs")
        .select("assistant_id, total_seconds")
        .in("assistant_id", assistantIds);

      (usageRows ?? []).forEach((row: any) => {
        const aid = row.assistant_id;
        usageMap[aid] = (usageMap[aid] ?? 0) + (row.total_seconds ?? 0);
      });
    }

    // --- Build response rows ---
    let rows = (data ?? []).map((u: any) => {
      const sub = u.subscriptions;
      const assignedAgentId = assignmentMap[u.id] ?? null;
      const usageSeconds = assignedAgentId ? (usageMap[assignedAgentId] ?? 0) : 0;

      return {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        tenantId: u.tenant_id,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        usageMinutes: Math.round(usageSeconds / 60),
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              planName: sub.plans?.display_name ?? "—",
              minutesUsed: parseFloat(sub.minutes_used ?? "0"),
              totalMinutes: sub.total_minutes_snapshot,
              monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
              startedAt: sub.started_at,
              endsAt: sub.ends_at,
            }
          : null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.tenantId ?? "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json({ error: "Failed to fetch customers." }, { status: 500 });
  }
}