import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !payload.sub) {
      return NextResponse.json({ eligible: true, authenticated: false });
    }

    const userId = payload.sub;
    const supabase = createServerSupabaseClient();

    const { data: existingSubs, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      console.error("[/api/subscriptions/check-eligibility] Error:", error);
      return NextResponse.json({ error: "Failed to check eligibility." }, { status: 500 });
    }

    const hasPriorSubscription = Boolean(existingSubs && existingSubs.length > 0);

    return NextResponse.json({
      authenticated: true,
      eligible: !hasPriorSubscription,
      hasPriorSubscription,
    });
  } catch (err) {
    console.error("[/api/subscriptions/check-eligibility]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
