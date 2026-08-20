import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const registerSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100, "Name is too long").trim(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
  plan_id: z.string().optional(),
  plan_name: z.string().optional(),
  stripe_session_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const limitResult = await rateLimit(ip, 5, 60000);

  if (!limitResult.success) {
    const retryAfter = Math.ceil((limitResult.resetTime - Date.now()) / 1000);
    return new NextResponse(
      JSON.stringify({ message: "Too many registration attempts. Please try again later." }),
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

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0]?.message ?? "Invalid request body." },
        { status: 400 }
      );
    }

    const { full_name, email, password, plan_id, plan_name, stripe_session_id } = validation.data;
    const isFreeTrial = plan_id === "free_trial" || plan_name === "free_trial";

    const password_hash = await bcrypt.hash(password, 12);

    // If it's a free trial registration or n8n webhook is not configured, register directly in Supabase
    if (isFreeTrial || !n8nWebhookUrl) {
      const { createServerSupabaseClient } = await import("@/lib/supabase-server");
      const supabase = createServerSupabaseClient();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { message: "An account with this email already exists." },
          { status: 400 }
        );
      }

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
        .select("id, email")
        .single();

      if (createUserError || !newUser) {
        console.error("[/api/register] Direct Supabase user creation error:", createUserError);
        return NextResponse.json(
          { message: createUserError?.message || "Failed to create user account." },
          { status: 500 }
        );
      }

      if (isFreeTrial) {
        // Fetch free_trial plan
        const { data: trialPlan } = await supabase
          .from("plans")
          .select("id, total_minutes")
          .eq("name", "free_trial")
          .eq("is_active", true)
          .maybeSingle();

        if (trialPlan) {
          const startedAt = new Date();
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + 30);

          const { data: newSubscription } = await supabase
            .from("subscriptions")
            .insert({
              user_id: newUser.id,
              plan_id: trialPlan.id,
              status: "active",
              started_at: startedAt.toISOString(),
              ends_at: endsAt.toISOString(),
              minutes_used: 0,
              monthly_price_snapshot: 0,
              price_per_minute_snapshot: 0,
              total_minutes_snapshot: trialPlan.total_minutes ?? 50,
            })
            .select("id")
            .single();

          if (newSubscription) {
            await supabase
              .from("users")
              .update({ active_subscription_id: newSubscription.id })
              .eq("id", newUser.id);
          }
        }
      }

      return NextResponse.json({ success: true, message: "Account created successfully!" });
    }

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        email,
        password_hash,
        plan_id,
        plan_name,
        stripe_session_id,
      }),
    });

    const data = await n8nRes.json().catch(() => ({}));

    if (!n8nRes.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Registration failed." },
        { status: n8nRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/register]", err);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}