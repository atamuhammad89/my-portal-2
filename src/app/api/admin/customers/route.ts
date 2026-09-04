import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";
import bcrypt from "bcryptjs";

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
        is_email_verified,
        tenant_id,
        created_at,
        updated_at,
        active_subscription_id,
        reseller_id,
        commission_rate,
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
      .in("role", ["owner", "super_admin", "reseller"])
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
        isEmailVerified: u.is_email_verified ?? false,
        tenantId: u.tenant_id,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        resellerId: u.reseller_id,
        commissionRate: u.commission_rate !== null && u.commission_rate !== undefined ? parseFloat(u.commission_rate) : 0.00,
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

// POST /api/admin/customers — insert new user
export async function POST(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();
     const { email, password, fullName, role, isActive, resellerId, commissionRate } = await req.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email already in use
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .ilike("email", trimmedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: trimmedEmail,
        password_hash: passwordHash,
        full_name: fullName.trim(),
        role,
        is_active: isActive !== undefined ? isActive : true,
        reseller_id: resellerId || null,
        commission_rate: commissionRate !== undefined ? commissionRate : 0.00,
      })
      .select("id, email, full_name, role, is_active, reseller_id, commission_rate, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: newUser.id,
      fullName: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.is_active,
      resellerId: newUser.reseller_id,
      commissionRate: newUser.commission_rate !== null && newUser.commission_rate !== undefined ? parseFloat(newUser.commission_rate) : 0.00,
      createdAt: newUser.created_at,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/customers]", err);
    return NextResponse.json({ error: err?.message || "Failed to create user." }, { status: 500 });
  }
}