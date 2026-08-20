import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { getAppBaseUrl } from "@/utils/url-helper";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/checkout
 * Body: { priceId; planId; planName }
 *
 * Creates a Stripe Checkout session.
 * For guests:
 *   On success → /auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 *   On cancel  → /pricing
 * For logged-in users:
 *   On success → /dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 *   On cancel  → /dashboard
 */
export async function POST(req: NextRequest) {
  try {
    const { priceId, planId, planName } = await req.json();

    if (!priceId || !planId || !planName) {
      return NextResponse.json(
        { error: "priceId, planId, and planName are required." },
        { status: 400 }
      );
    }

    const payload = await verifyRequestJwt(req);
    const hasClientSession = Boolean(
      req.cookies.get(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "voiceos_auth_token")?.value
    );
    const isLoggedIn = !!payload && hasClientSession;

    const metadata: Record<string, string> = {
      plan_id: planId,
      plan_name: planName,
    };

    if (isLoggedIn && payload.sub) {
      metadata.user_id = payload.sub;
    }

    const baseUrl = getAppBaseUrl(req);

    const successUrl = isLoggedIn
      ? `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`
      : `${baseUrl}/auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`;

    const cancelUrl = isLoggedIn
      ? `${baseUrl}/dashboard`
      : `${baseUrl}/pricing`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }

}