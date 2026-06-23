// src/app/api/billing/overage-checkout/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatDate } from "@/utils/format";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch the pending overage invoice to verify ownership and amount
    const { data: invoice, error: invError } = await supabase
      .from("pending_overage_invoices")
      .select("id, overage_amount, overage_minutes, plan_name, period_start, period_end, user_id, status")
      .eq("id", invoiceId)
      .eq("user_id", payload.sub)
      .single();

    if (invError || !invoice) {
      console.error("[overage-checkout] Fetch invoice error:", invError);
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: "This invoice has already been paid or waived." },
        { status: 400 }
      );
    }

    const amount = Number(invoice.overage_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invoice amount is invalid or zero." },
        { status: 400 }
      );
    }

    // Fetch user details to prefill Stripe
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", payload.sub)
      .single();

    const formattedStart = invoice.period_start ? formatDate(invoice.period_start) : "";
    const formattedEnd = invoice.period_end ? formatDate(invoice.period_end) : "present";
    const periodStr = formattedStart ? ` (${formattedStart} to ${formattedEnd})` : "";
    const description = `Overage charges of ${invoice.overage_minutes} minutes for ${invoice.plan_name || "Standard Plan"}${periodStr}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Overage Billing — ${invoice.plan_name || "Standard Plan"}`,
              description,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: user?.email ?? undefined,
      metadata: {
        invoice_id: invoice.id,
        user_id: payload.sub,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/overage/success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/billing/overage-checkout]", err);
    return NextResponse.json(
      { error: "Overage checkout session creation failed. Please try again." },
      { status: 500 }
    );
  }
}
