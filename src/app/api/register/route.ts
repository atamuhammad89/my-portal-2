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

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? (
  process.env.NODE_ENV !== "production"
    ? "https://n8n-dev.callautomate.ai/webhook/register-user"
    : ""
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const limitResult = rateLimit(ip, 5, 60000);

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

    if (!N8N_WEBHOOK_URL) {
      console.error("Registration failed: N8N_WEBHOOK_URL is not set");
      return NextResponse.json(
        { message: "Registration is currently misconfigured." },
        { status: 500 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
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