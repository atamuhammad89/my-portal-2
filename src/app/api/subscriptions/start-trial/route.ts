import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub;
    const supabase = createServerSupabaseClient();

    // 1. Check if user already exists and has ANY subscriptions before
    const { data: existingSubs, error: fetchSubError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId);

    if (fetchSubError) {
      console.error("[/api/subscriptions/start-trial] Error checking subscriptions:", fetchSubError);
      return NextResponse.json({ error: "Database error while checking eligibility." }, { status: 500 });
    }

    if (existingSubs && existingSubs.length > 0) {
      return NextResponse.json(
        {
          eligible: false,
          error: "You are not eligible for a Free Trial because you already have or had a subscription/trial.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch the free_trial plan from public.plans
    const { data: freeTrialPlan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("name", "free_trial")
      .eq("is_active", true)
      .maybeSingle();

    if (planError || !freeTrialPlan) {
      console.error("[/api/subscriptions/start-trial] Free trial plan not found:", planError);
      return NextResponse.json(
        { error: "Free Trial plan is not currently configured." },
        { status: 500 }
      );
    }

    // 3. Calculate 30-day trial period
    const startedAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30);

    // 4. Create 30-Day Free Trial record in public.subscriptions
    const { data: newSubscription, error: createSubError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: freeTrialPlan.id,
        status: "active",
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        minutes_used: 0,
        monthly_price_snapshot: 0,
        price_per_minute_snapshot: 0,
        total_minutes_snapshot: freeTrialPlan.total_minutes ?? 50,
      })
      .select("id")
      .single();

    if (createSubError || !newSubscription) {
      console.error("[/api/subscriptions/start-trial] Failed to create subscription:", createSubError);
      return NextResponse.json(
        { error: createSubError?.message || "Failed to start 30-day Free Trial." },
        { status: 500 }
      );
    }

    // 5. Update user's active_subscription_id
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ active_subscription_id: newSubscription.id })
      .eq("id", userId);

    if (updateUserError) {
      console.warn("[/api/subscriptions/start-trial] Warning updating user active subscription:", updateUserError);
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      message: "30-day Free Trial activated successfully!",
      subscriptionId: newSubscription.id,
      redirect: "/dashboard",
    });
  } catch (err) {
    console.error("[/api/subscriptions/start-trial]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
