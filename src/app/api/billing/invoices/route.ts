// src/app/api/billing/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch user's purchased phone numbers & orders
    const { data: userNumbers } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", payload.sub);

    const { data: userOrders } = await supabase
      .from("phone_orders")
      .select("*")
      .eq("user_id", payload.sub);

    // 2. Fetch existing invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", payload.sub)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/billing/invoices] db error:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }

    const existingPlanNames = new Set((invoices || []).map((i) => i.plan_name));
    const allUserPurchases = [...(userNumbers || []), ...(userOrders || [])];

    let newInvoiceCreated = false;
    for (const p of allUserPurchases) {
      const numStr = p.phone_number || (p.phoneNumbers && p.phoneNumbers[0]);
      if (!numStr) continue;

      const planName = `Phone Number (${numStr})`;
      if (!existingPlanNames.has(planName)) {
        const { data: userRec } = await supabase
          .from("users")
          .select("email, full_name")
          .eq("id", payload.sub)
          .single();

        const now = new Date();
        const periodStart = p.created_at ? new Date(p.created_at) : now;
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await supabase.from("invoices").insert({
          user_id: payload.sub,
          invoice_number: `INV-TEL-${Math.floor(100000 + Math.random() * 900000)}`,
          plan_name: planName,
          type: "phone_number",
          amount: 2.50,
          status: "pending",
          billing_name: userRec?.full_name || "Customer",
          billing_email: userRec?.email || "",
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          created_at: now.toISOString(),
        });
        existingPlanNames.add(planName);
        newInvoiceCreated = true;
      }
    }

    // Re-fetch invoices if any new invoice was created
    let finalInvoices = invoices ?? [];
    if (newInvoiceCreated) {
      const { data: refreshed } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", payload.sub)
        .order("created_at", { ascending: false });
      if (refreshed) finalInvoices = refreshed;
    }

    return NextResponse.json({ invoices: finalInvoices });
  } catch (err) {
    console.error("[GET /api/billing/invoices] server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
