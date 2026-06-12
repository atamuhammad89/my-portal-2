// src/app/api/admin/billing/pending-bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createServerSupabaseClient();

  // ── 1. Load all pending_overage_invoices from DB (source of truth) ─────────
  const { data: invoices, error: invError } = await supabase
    .from("pending_overage_invoices")
    .select(`
      id,
      user_id,
      subscription_id,
      status,
      overage_minutes,
      overage_amount,
      price_per_minute,
      plan_name,
      period_start,
      period_end,
      created_at
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invError) {
    console.error("[admin pending-bills] invoice fetch error:", invError);
    return NextResponse.json({ error: "Failed to fetch invoices.", detail: invError.message }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ pendingBills: [] });
  }

  // ── 2. Fetch related subscriptions to get live minutes_used ───────────────
  const subIds = [...new Set(invoices.map((i: any) => i.subscription_id as string))];
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, status, minutes_used, total_minutes_snapshot, monthly_price_snapshot, started_at, ends_at")
    .in("id", subIds);

  const subsMap: Record<string, any> = {};
  (subs ?? []).forEach((s: any) => { subsMap[s.id] = s; });

  // ── 3. Skip real-time DB updating, let database trigger handle usage updates ───

  // ── 4. Fetch user details ─────────────────────────────────────────────────
  const userIds = [...new Set(invoices.map((i: any) => i.user_id as string))];
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("id", userIds);

  const usersMap: Record<string, any> = {};
  (users ?? []).forEach((u: any) => { usersMap[u.id] = u; });

  // ── 5. Build response ──────────────────────────────────────────────────────
  const pendingBills = invoices.map((inv: any) => {
    const sub = subsMap[inv.subscription_id];
    const user = usersMap[inv.user_id] ?? {};

    return {
      invoiceId: inv.id,
      subscriptionId: inv.subscription_id,
      subscriptionStatus: (sub?.status ?? "expired") as string,
      userId: inv.user_id as string,
      userName: user.full_name ?? "—",
      userEmail: user.email ?? "—",
      userRole: user.role ?? "—",
      planName: inv.plan_name ?? "—",
      invoiceStatus: inv.status as string,
      periodStart: (inv.period_start ?? sub?.started_at ?? "") as string,
      periodEnd: (inv.period_end ?? sub?.ends_at ?? null) as string | null,
      allocatedMinutes: Number(sub?.total_minutes_snapshot ?? 0),
      usedMinutes: Number(sub?.minutes_used ?? 0),
      overageMinutes: Number(inv.overage_minutes),
      pricePerMinute: Number(inv.price_per_minute ?? 0),
      overageAmount: Number(inv.overage_amount),
      monthlyPrice: Number(sub?.monthly_price_snapshot ?? 0),
      generatedAt: inv.created_at as string,
    };
  });

  return NextResponse.json({ pendingBills });
}