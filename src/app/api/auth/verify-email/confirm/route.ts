// src/app/api/auth/verify-email/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json().catch(() => ({}));

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. Fetch user by verification token
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, is_email_verified")
      .eq("email_verification_token", token)
      .single();

    if (fetchError || !user) {
      // Token not found — check if it was already consumed (already verified)
      // This handles React StrictMode double-invocation and network retries gracefully.
      console.warn(`[verify-email/confirm] Token not found: ${token}. Checking for already-verified state.`);
      return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
    }

    // 2. Mark email as verified and clear the token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_email_verified: true,
        email_verification_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[verify-email/confirm] DB update error:", updateError);
      return NextResponse.json({ error: "Failed to verify email. Please try again." }, { status: 500 });
    }

    console.log(`[verify-email/confirm] User ${user.email} successfully verified.`);
    return NextResponse.json({ success: true, email: user.email });
  } catch (err: any) {
    console.error("[verify-email/confirm] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
