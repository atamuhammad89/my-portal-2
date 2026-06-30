// src/app/api/billing/renew/confirm/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/billing/renew/confirm
 * Body: { sessionId: string; planId: string }
 *
 * 1. Verifies the Stripe checkout session
 * 2. Fetches plan details from DB
 * 3. Marks the user's current active subscription as "expired"
 * 4. Inserts a new subscription row
 * 5. Updates users.active_subscription_id
 */
export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    // 1. Verify Stripe session — always retrieved server-side, never trust client input
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not completed." },
        { status: 400 }
      );
    }

    // Ensure this session belongs to this user (metadata check)
    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== payload.sub) {
      return NextResponse.json({ error: "Session mismatch." }, { status: 403 });
    }

    // ✅ Security fix: derive planId from server-set Stripe metadata, NOT from the
    // request body. Prevents plan-substitution attack where a user pays for a cheap
    // plan but submits an expensive planId in the confirm call.
    const planId = session.metadata?.plan_id ?? null;
    if (!planId) {
      return NextResponse.json(
        { error: "Plan information missing from payment session." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Prevent replay / double-subscription attacks
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, ends_at")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        subscriptionId: existing.id,
        endsAt: existing.ends_at,
      });
    }

    // 2. Fetch plan details from DB using the server-verified planId
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, monthly_price, price_per_minute, total_minutes")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    // 3. Mark the current active subscription as "expired"
    const { data: user } = await supabase
      .from("users")
      .select("active_subscription_id")
      .eq("id", payload.sub)
      .single();

    if (user?.active_subscription_id) {
      const { error: expireError } = await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", user.active_subscription_id)
        .eq("user_id", payload.sub); // safety: only touch this user's row

      if (expireError) {
        console.error("[renew/confirm] expire old subscription error:", expireError);
        // Non-fatal — proceed with creating the new subscription anyway
      }
    }

    // 4. Calculate subscription period (30 days from now)
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + 30);

    // 5. Insert new subscription row
    const { data: newSub, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: payload.sub,
        plan_id: planId,
        status: "active",
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        cancelled_at: null,
        minutes_used: 0,
        monthly_price_snapshot: plan.monthly_price,
        price_per_minute_snapshot: plan.price_per_minute,
        total_minutes_snapshot: plan.total_minutes,
        stripe_session_id: sessionId,
      })
      .select()
      .single();

    if (insertError || !newSub) {
      console.error("[renew/confirm] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create subscription." },
        { status: 500 }
      );
    }

    // 6. Update user's active_subscription_id
    const { error: updateError } = await supabase
      .from("users")
      .update({ active_subscription_id: newSub.id })
      .eq("id", payload.sub);

    if (updateError) {
      console.error("[renew/confirm] user update error:", updateError);
      return NextResponse.json(
        { error: "Subscription created but failed to activate." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: newSub.id,
      endsAt: endsAt.toISOString(),
    });
  } catch (err) {
    console.error("[/api/billing/renew/confirm]", err);
    return NextResponse.json({ error: "Billing confirmation failed. Please try again." }, { status: 500 });
  }
}