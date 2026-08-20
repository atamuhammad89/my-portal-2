import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { JWT_SECRET } from "@/lib/jwt-auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const SESSION_HOURS = Number(process.env.NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS ?? 8);

const googleAuthSchema = z.object({
  email: z.string().email("Invalid email format").max(255).toLowerCase().trim(),
  full_name: z.string().min(1, "Name is required").max(100).trim(),
  google_id: z.string().optional(),
  avatar_url: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const limitResult = await rateLimit(ip, 15, 60000);

  if (!limitResult.success) {
    const retryAfter = Math.ceil((limitResult.resetTime - Date.now()) / 1000);
    return new NextResponse(
      JSON.stringify({ error: "Too many authentication attempts. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const validation = googleAuthSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid Google auth payload." },
        { status: 400 }
      );
    }

    const { email, full_name, google_id } = validation.data;
    const supabase = createServerSupabaseClient();

    // 1. Check if user already exists
    let { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, full_name, role, tenant_id, is_active, active_subscription_id")
      .ilike("email", email)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[/api/auth/google] User lookup error:", fetchError);
    }

    // 2. If user does not exist, create user account
    if (!user) {
      const dummyPassword = `GoogleOAuth_${google_id || Date.now()}_${Math.random().toString(36).substring(2)}`;
      const password_hash = await bcrypt.hash(dummyPassword, 10);

      // Create new user in public.users with 'owner' role
      const { data: newUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          email,
          full_name,
          password_hash,
          role: "owner",
          is_active: true,
          is_email_verified: true,
        })
        .select("id, email, full_name, role, tenant_id, is_active, active_subscription_id")
        .single();

      if (createUserError || !newUser) {
        console.error("[/api/auth/google] User creation error:", createUserError);
        return NextResponse.json(
          { error: createUserError?.message || "Failed to create user account." },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // 3. Check if user has ANY prior subscriptions before creating a free trial
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id);

    if (!existingSubs || existingSubs.length === 0) {
      // Find 'free_trial' plan or fallback to cheapest active plan
      let { data: trialPlan } = await supabase
        .from("plans")
        .select("id, monthly_price, price_per_minute, total_minutes")
        .eq("name", "free_trial")
        .eq("is_active", true)
        .maybeSingle();

      if (!trialPlan) {
        const { data: defaultPlan } = await supabase
          .from("plans")
          .select("id, monthly_price, price_per_minute, total_minutes")
          .eq("is_active", true)
          .order("monthly_price", { ascending: true })
          .limit(1)
          .maybeSingle();
        trialPlan = defaultPlan;
      }

      if (trialPlan) {
        const startedAt = new Date();
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        // Create 30-Day Free Trial record in public.subscriptions
        const { data: newSubscription, error: createSubError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_id: trialPlan.id,
            status: "active",
            started_at: startedAt.toISOString(),
            ends_at: endsAt.toISOString(),
            minutes_used: 0,
            monthly_price_snapshot: trialPlan.monthly_price ?? 0,
            price_per_minute_snapshot: trialPlan.price_per_minute ?? 0,
            total_minutes_snapshot: trialPlan.total_minutes ?? 50,
          })
          .select("id")
          .single();

        if (!createSubError && newSubscription) {
          // Link active subscription to user
          await supabase
            .from("users")
            .update({ active_subscription_id: newSubscription.id })
            .eq("id", user.id);

          user.active_subscription_id = newSubscription.id;
        } else {
          console.warn("[/api/auth/google] Subscription creation warning:", createSubError);
        }
      }
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account is disabled. Please contact support." },
        { status: 403 }
      );
    }

    // 3. Generate JWT Session Token
    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id ?? null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_HOURS}h`)
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id ?? null,
        activeSubscriptionId: user.active_subscription_id ?? null,
        isEmailVerified: true,
      },
    });

    response.cookies.set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("[/api/auth/google]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
