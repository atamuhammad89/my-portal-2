import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ subscriptionId: string }> }
) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { subscriptionId } = await context.params;
    const supabase = createServerSupabaseClient();
    const { action } = await req.json();

    if (!["pause", "resume", "renew"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    let updatePayload: Record<string, unknown> = {};

    if (action === "renew") {
      // Fetch the current subscription to read its plan snapshot duration
      const { data: existing, error: fetchError } = await supabase
        .from("subscriptions")
        .select("plan_id, total_minutes_snapshot, monthly_price_snapshot, price_per_minute_snapshot")
        .eq("id", subscriptionId)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
      }

      // Fetch plan to get duration_months (default to 1 if not set)
      const { data: plan } = await supabase
        .from("plans")
        .select("duration_months")
        .eq("id", existing.plan_id)
        .single();

      const durationMonths: number = plan?.duration_months ?? 1;
      const now = new Date();
      const newEndsAt = new Date(now);
      newEndsAt.setMonth(newEndsAt.getMonth() + durationMonths);

      updatePayload = {
        status: "active",
        started_at: now.toISOString(),
        ends_at: newEndsAt.toISOString(),
        cancelled_at: null,
        minutes_used: 0,
      };
    } else {
      const newStatus = action === "resume" ? "active" : "paused";
      updatePayload = {
        status: newStatus,
        ...(action === "resume" ? { cancelled_at: null } : {})
      };
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/subscriptions/[subscriptionId]]", err);
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
  }
}