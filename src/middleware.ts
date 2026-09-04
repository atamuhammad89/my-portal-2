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
  "admin",
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

function addSecurityHeaders(response: NextResponse, nonceValue: string): NextResponse {
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const isDev = process.env.NODE_ENV === "development";
  const scriptCsp = `'self' 'nonce-${nonceValue}' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ""}`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptCsp};
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
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const { pathname, searchParams } = request.nextUrl;
  
  const configuredName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "voiceos_auth_token";
  const rawCandidates = [
    request.cookies.get("token")?.value,
    request.cookies.get(configuredName)?.value,
    request.cookies.get("voiceos_auth_token")?.value,
    request.cookies.get("access_token")?.value,
  ].filter(Boolean);

  let hasSession = false;

  for (const tokenStr of rawCandidates) {
    if (tokenStr && tokenStr !== "1") {
      try {
        await jwtVerify(tokenStr, JWT_SECRET);
        hasSession = true;
        break;
      } catch {
        // Continue checking next candidate
      }
    }
  }

  const isUserRoute = matchesPrefix(pathname, USER_PROTECTED);
  const isAdminRoute = matchesPrefix(pathname, ADMIN_PROTECTED);
  const isResellerRoute = matchesPrefix(pathname, RESELLER_PROTECTED);

  // 1. Unauthenticated trying to access protected routes → redirect to login
  if ((isUserRoute || isAdminRoute || isResellerRoute) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  // 2. Already logged-in user hitting /auth/login → send to target or default home
  if (pathname.startsWith("/auth/login") && hasSession) {
    const nextParam = searchParams.get("next");
    const dest = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
    return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)), nonce);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return addSecurityHeaders(response, nonce);
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
