// src/app/api/billing/overage-checkout/confirm/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, invoiceId } = await req.json();

    if (!sessionId || !invoiceId) {
      return NextResponse.json(
        { error: "sessionId and invoiceId are required." },
        { status: 400 }
      );
    }

    // 1. Retrieve & verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not completed on Stripe." },
        { status: 400 }
      );
    }

    // Ensure session belongs to user and specific invoice
    if (session.metadata?.user_id !== payload.sub) {
      return NextResponse.json({ error: "User mismatch." }, { status: 403 });
    }

    if (session.metadata?.invoice_id !== invoiceId) {
      return NextResponse.json({ error: "Invoice ID mismatch." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Prevent double processing / replay
    const { data: currentInvoice, error: fetchError } = await supabase
      .from("pending_overage_invoices")
      .select("status")
      .eq("id", invoiceId)
      .eq("user_id", payload.sub)
      .single();

    if (fetchError || !currentInvoice) {
      console.error("[overage-checkout/confirm] fetch error:", fetchError);
      return NextResponse.json({ error: "Overage invoice not found." }, { status: 404 });
    }

    if (currentInvoice.status === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // 2. Update pending overage invoice to 'paid'
    // This will automatically fire handle_overage_invoice_update_trigger() in DB to insert invoice.
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("pending_overage_invoices")
      .update({
        status: "paid",
        paid_at: now,
        resolved_at: now,
      })
      .eq("id", invoiceId)
      .eq("user_id", payload.sub);

    if (updateError) {
      console.error("[overage-checkout/confirm] update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update overage invoice payment status." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/billing/overage-checkout/confirm]", err);
    return NextResponse.json(
      { error: "Overage checkout confirmation failed. Please try again." },
      { status: 500 }
    );
  }
}
