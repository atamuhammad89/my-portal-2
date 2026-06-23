// src/app/api/admin/billing/seed-invoices/route.ts
// DEV-ONLY endpoint: Seeds realistic pending overage invoices for testing
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }


  const supabase = createServerSupabaseClient();

  // 1. Fetch existing active subscriptions to seed against real data
  const { data: subscriptions, error: subErr } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan_id, status, minutes_used, total_minutes_snapshot, price_per_minute_snapshot, started_at, ends_at")
    .in("status", ["active", "expired"])
    .limit(10);

  if (subErr || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No subscriptions found to seed against. Please create some subscriptions first." },
      { status: 400 }
    );
  }

  // 2. Fetch plan names
  const planIds = [...new Set(subscriptions.map((s: any) => s.plan_id as string).filter(Boolean))];
  const plansMap: Record<string, string> = {};
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from("plans")
      .select("id, display_name")
      .in("id", planIds);
    (plans ?? []).forEach((p: any) => { plansMap[p.id] = p.display_name; });
  }

  // 3. Remove existing test/pending invoices for these subscriptions to avoid duplication
  const subIds = subscriptions.map((s: any) => s.id);
  await supabase
    .from("pending_overage_invoices")
    .delete()
    .in("subscription_id", subIds)
    .eq("status", "pending");

  // 4. Build realistic seed invoices
  const now = new Date();
  const seedData = subscriptions.map((sub: any, idx: number) => {
    const allocated = Number(sub.total_minutes_snapshot ?? 500);
    // Each subscription gets a different overage scenario
    const overageScenarios = [
      { overageMin: 47, rate: 0.0120 },
      { overageMin: 125, rate: 0.0095 },
      { overageMin: 312, rate: 0.0080 },
      { overageMin: 18, rate: 0.0150 },
      { overageMin: 87, rate: 0.0110 },
      { overageMin: 204, rate: 0.0085 },
      { overageMin: 55, rate: 0.0130 },
      { overageMin: 390, rate: 0.0075 },
      { overageMin: 23, rate: 0.0140 },
      { overageMin: 167, rate: 0.0100 },
    ];
    const scenario = overageScenarios[idx % overageScenarios.length];
    const rate = Number(sub.price_per_minute_snapshot ?? scenario.rate);
    const overageMin = scenario.overageMin;
    const overageAmt = parseFloat((overageMin * rate).toFixed(4));
    const planName = plansMap[sub.plan_id] ?? "Business";

    // Period: started from beginning of month or sub start
    const periodStart = sub.started_at ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = sub.status === "expired" ? (sub.ends_at ?? null) : null;

    return {
      user_id: sub.user_id,
      subscription_id: sub.id,
      status: "pending",
      overage_minutes: overageMin,
      overage_amount: overageAmt,
      price_per_minute: rate,
      plan_name: planName,
      period_start: periodStart,
      period_end: periodEnd,
    };
  });

  // 5. Insert seed invoices
  const { data: inserted, error: insertErr } = await supabase
    .from("pending_overage_invoices")
    .insert(seedData)
    .select("id");

  if (insertErr) {
    console.error("[seed-invoices] insert error:", insertErr);
    return NextResponse.json(
      { error: "Failed to insert seed invoices.", detail: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    seeded: inserted?.length ?? seedData.length,
    message: `Successfully seeded ${inserted?.length ?? seedData.length} pending overage invoices.`,
  });
}
