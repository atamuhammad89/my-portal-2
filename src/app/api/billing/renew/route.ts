// src/app/api/billing/renew/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/billing/renew
 * Body: { priceId: string; planId: string; planName: string }
 *
 * Creates a Stripe Checkout session for subscription renewal.
 * On success → /billing/renew/success?session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 * On cancel  → /billing
 */
export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId, planId, planName } = await req.json();

    if (!priceId || !planId || !planName) {
      return NextResponse.json(
        { error: "priceId, planId, and planName are required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch user details to pre-fill Stripe checkout
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", payload.sub)
      .single();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user?.email ?? undefined,
      metadata: {
        plan_id: planId,
        plan_name: planName,
        user_id: payload.sub,
        is_renewal: "true",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/renew/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/billing/renew]", err);
    return NextResponse.json({ error: "Renewal checkout failed. Please try again." }, { status: 500 });
  }

}
