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
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.user_id !== payload.sub) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
    }

    const amountInCents = Math.max(100, Math.round(parseFloat(invoice.amount) * 100));
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: invoice.billing_email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: invoice.plan_name || "Phone Number Purchase",
              description: `Invoice #${invoice.invoice_number}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        user_id: payload.sub,
        type: "invoice_payment",
      },
      success_url: `${baseUrl}/billing?payment=success&invoice_id=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[/api/billing/checkout-invoice]", err);
    return NextResponse.json({ error: err.message || "Failed to create payment session." }, { status: 500 });
  }
}
