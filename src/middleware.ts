import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "voiceos_auth_token";
const ROLE_COOKIE_NAME = "voiceos_user_role";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value ?? "";

  const isUserRoute = matchesPrefix(pathname, USER_PROTECTED);
  const isAdminRoute = matchesPrefix(pathname, ADMIN_PROTECTED);
  const isResellerRoute = matchesPrefix(pathname, RESELLER_PROTECTED);

  // 1. Unauthenticated → redirect to login
  if ((isUserRoute || isAdminRoute || isResellerRoute) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated but not an admin role trying to access admin → redirect
  if (isAdminRoute && !ADMIN_ROLES.has(role)) {
    const dest = role === "reseller" ? "/reseller" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 3. Reseller trying to access standard client pages → redirect to reseller portal
  if (isUserRoute && role === "reseller") {
    return NextResponse.redirect(new URL("/reseller", request.url));
  }

  // 4. Non-reseller trying to access reseller routes → redirect to standard dashboard or admin
  if (isResellerRoute && role !== "reseller") {
    const dest = ADMIN_ROLES.has(role) ? "/admin/overview" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 5. Already logged-in user hitting /auth/login → send to their home
  if (pathname.startsWith("/auth/login") && hasSession) {
    const dest = ADMIN_ROLES.has(role)
      ? "/admin/overview"
      : role === "reseller"
      ? "/reseller"
      : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
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
