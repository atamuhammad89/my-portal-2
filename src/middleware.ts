import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt-auth";

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "voiceos_auth_token";

/**
 * Roles that are allowed inside the /admin section.
 * Matches the AdminRole type in src/types/admin/roles.ts
 */
const ADMIN_ROLES = new Set([
  "super_admin",
  "operations",
  "support",
  "finance",
]);

const USER_PROTECTED = [
  "/dashboard",
  "/agents",
  "/call-logs",
  "/recordings",
  "/billing",
  "/settings",
];
const ADMIN_PROTECTED = ["/admin"];
const RESELLER_PROTECTED = ["/reseller"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.stripe.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://js.stripe.com;
    connect-src 'self' https://api.stripe.com https://api.retellai.com https://*.supabase.co;
  `.replace(/\s{2,}/g, " ").trim();
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get("token")?.value;
  let role = "";
  let hasSession = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = (payload.role as string) ?? "";
      hasSession = true;
    } catch (err) {
      console.error("[Middleware] JWT verification failed:", err);
    }
  }

  const isUserRoute = matchesPrefix(pathname, USER_PROTECTED);
  const isAdminRoute = matchesPrefix(pathname, ADMIN_PROTECTED);
  const isResellerRoute = matchesPrefix(pathname, RESELLER_PROTECTED);

  // 1. Unauthenticated → redirect to login
  if ((isUserRoute || isAdminRoute || isResellerRoute) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // 2. Authenticated but not an admin role trying to access admin → redirect
  if (isAdminRoute && !ADMIN_ROLES.has(role)) {
    const dest = role === "reseller" ? "/reseller" : "/dashboard";
    return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)));
  }

  // 3. Reseller trying to access standard client pages → redirect to reseller portal
  if (isUserRoute && role === "reseller") {
    return addSecurityHeaders(NextResponse.redirect(new URL("/reseller", request.url)));
  }

  // 4. Non-reseller trying to access reseller routes → redirect to standard dashboard or admin
  if (isResellerRoute && role !== "reseller") {
    const dest = ADMIN_ROLES.has(role) ? "/admin/overview" : "/dashboard";
    return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)));
  }

  // 5. Already logged-in user hitting /auth/login → send to their home
  if (pathname.startsWith("/auth/login") && hasSession) {
    const dest = ADMIN_ROLES.has(role)
      ? "/admin/overview"
      : role === "reseller"
      ? "/reseller"
      : "/dashboard";
    return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agents/:path*",
    "/call-logs/:path*",
    "/recordings/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/reseller/:path*",
    "/auth/login",
  ],
};
