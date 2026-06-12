// src/app/api/billing/pending-bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const userId = payload.sub;

  // ── 1. Load all pending invoices for this user from DB ────────────────────
  const { data: userInvoices, error: invError } = await supabase
    .from("pending_overage_invoices")
    .select(`
      id,
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
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invError) {
    console.error("[customer pending-bills] fetch pending invoices error:", invError);
    return NextResponse.json(
      { error: "Failed to fetch pending invoices.", detail: invError.message },
      { status: 500 }
    );
  }

  // ── 2. Fetch related subscriptions to enrich details ──────────────────────
  const subIds = [...new Set((userInvoices ?? []).map((inv: any) => inv.subscription_id as string))];
  const subsMap: Record<string, any> = {};

  if (subIds.length > 0) {
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        minutes_used,
        monthly_price_snapshot,
        total_minutes_snapshot
      `)
      .in("id", subIds);

    if (subsError) {
      console.error("[customer pending-bills] subscriptions query error:", subsError);
    } else {
      (subs ?? []).forEach((s: any) => {
        subsMap[s.id] = s;
      });
    }
  }

  // ── 3. Build response ──────────────────────────────────────────────────────
  const pendingBills = (userInvoices ?? []).map((inv: any) => {
    const sub = subsMap[inv.subscription_id];
    return {
      invoiceId: inv.id,
      subscriptionId: inv.subscription_id,
      subscriptionStatus: (sub?.status ?? "expired") as string,
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