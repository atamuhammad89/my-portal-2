import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch all purchased phone numbers
    const { data: phoneNumbers, error: numError } = await supabase
      .from("phone_numbers")
      .select("*");

    if (numError) {
      console.error("[backfill-invoices] phone_numbers error:", numError);
    }

    // Also fetch phone_orders
    const { data: phoneOrders } = await supabase
      .from("phone_orders")
      .select("*");

    // Fetch existing invoices to prevent duplicate creation
    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("plan_name, user_id");

    const existingPlanNames = new Set((existingInvoices || []).map((i) => i.plan_name));

    const createdInvoices: any[] = [];
    const numbersToProcess = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers : (phoneOrders || []);

    for (const item of numbersToProcess) {
      const numberStr = item.phone_number || (item.phoneNumbers && item.phoneNumbers[0]);
      if (!numberStr) continue;

      const planName = `Phone Number (${numberStr})`;
      if (existingPlanNames.has(planName)) {
        continue; // Already has an invoice
      }

      const userId = item.user_id;
      if (!userId) continue;

      // Fetch user details for billing name/email
      const { data: userRec } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      const now = new Date();
      const periodStart = item.created_at ? new Date(item.created_at) : now;
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const invPayload = {
        user_id: userId,
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
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("invoices")
        .insert(invPayload)
        .select()
        .single();

      if (!insertErr && inserted) {
        createdInvoices.push(inserted);
        existingPlanNames.add(planName);
      } else if (insertErr) {
        console.warn("[backfill-invoices insert warning]", insertErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${createdInvoices.length} invoice(s) for existing purchased phone numbers.`,
      invoices: createdInvoices,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/backfill-invoices]", err);
    return NextResponse.json({ error: err.message || "Failed to backfill invoices" }, { status: 500 });
  }
}
