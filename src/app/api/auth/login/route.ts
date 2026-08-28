import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { JWT_SECRET } from "@/lib/jwt-auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const SESSION_HOURS = Number(process.env.NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS ?? 8);

const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email is too long").toLowerCase().trim(),
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Login API endpoint is active." });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const limitResult = await rateLimit(ip, 10, 60000);

  if (!limitResult.success) {
    const retryAfter = Math.ceil((limitResult.resetTime - Date.now()) / 1000);
    return new NextResponse(
      JSON.stringify({ error: "Too many login attempts. Please try again later." }),
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

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid request body." },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const supabase = createServerSupabaseClient();

    // Fetch user row (email is stored lower-cased via the index)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, tenant_id, password_hash, is_active, is_email_verified")
      .ilike("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account is disabled. Contact your administrator." },
        { status: 403 }
      );
    }

    // Constant-time password comparison
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;

    // Sign a JWT with the user's id + role embedded
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
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id ?? null,
        isEmailVerified: user.is_email_verified ?? false,
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
    console.error("[/api/auth/login]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
