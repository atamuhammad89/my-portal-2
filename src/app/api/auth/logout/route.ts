// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly "token" cookie that was set by /api/auth/login.
 * Client-side logout (clearAuthSession) already clears localStorage and
 * the "voiceos_auth_token" presence cookie, but it cannot touch the
 * HttpOnly cookie — only the server can do that.
 *
 * Without this, a logged-out user still carries the "token" cookie,
 * which makes /api/checkout think they are logged in and sends them
 * to /dashboard instead of /auth/register after a guest purchase.
 */
function clearAuthCookies(response: NextResponse): NextResponse {
  const configuredName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "voiceos_auth_token";
  const cookieNames = ["token", configuredName, "voiceos_auth_token", "access_token"];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}