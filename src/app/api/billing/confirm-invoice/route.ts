import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key";
const stripe = new Stripe(stripeKey);

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, invoiceId } = await req.json();

    if (!sessionId || !invoiceId) {
      return NextResponse.json({ error: "sessionId and invoiceId are required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify session from Stripe if secret key is configured
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid" && session.status !== "complete") {
          return NextResponse.json({ error: "Payment not completed on Stripe." }, { status: 400 });
        }
      } catch (err) {
        console.warn("[confirm-invoice Stripe retrieve warn]", err);
      }
    }

    // Mark invoice as paid in DB
    const { data: updatedInvoice, error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("user_id", payload.sub)
      .select()
      .single();

    if (error) {
      console.error("[confirm-invoice DB Update Error]", error);
      return NextResponse.json({ error: "Failed to update invoice status." }, { status: 500 });
    }

    // If invoice is for a phone number, activate the phone number in DB
    if (updatedInvoice && updatedInvoice.plan_name) {
      const match = updatedInvoice.plan_name.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const num = match[1];
        await supabase
          .from("phone_numbers")
          .update({ status: "active" })
          .eq("phone_number", num)
          .eq("user_id", payload.sub);
      }
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (err: any) {
    console.error("[/api/billing/confirm-invoice]", err);
    return NextResponse.json({ error: "Payment confirmation failed." }, { status: 500 });
  }
}
