import { NextRequest } from "next/server";

/**
 * Returns the correct base application URL (e.g. "https://callautomate.ai" or "https://callautomate.vercel.app").
 *
 * Resolution Priority:
 * 1. Explicit production NEXT_PUBLIC_APP_URL environment variable (if not set to localhost).
 * 2. Dynamic extraction from incoming NextRequest headers (origin/host), resolving Vercel deployment domains automatically.
 * 3. VERCEL_URL environment variable provided by Vercel platform.
 * 4. Browser window location origin (for client-side execution).
 * 5. Fallback to NEXT_PUBLIC_APP_URL or "http://localhost:3000".
 */
export function getAppBaseUrl(req?: NextRequest): string {
  // 1. If NEXT_PUBLIC_APP_URL is explicitly set to a production domain (not localhost), use it
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Extract dynamically from incoming HTTP request headers if available
  if (req) {
    const origin = req.headers.get("origin");
    if (origin && !origin.includes("localhost")) {
      return origin.replace(/\/$/, "");
    }

    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost")) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }

    if (req.nextUrl?.origin && !req.nextUrl.origin.includes("localhost")) {
      return req.nextUrl.origin.replace(/\/$/, "");
    }
  }

  // 3. Check Vercel system environment variable (e.g., callautomate.vercel.app)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    if (!vercelUrl.includes("localhost")) {
      return vercelUrl.replace(/\/$/, "");
    }
  }

  // 4. Client-side browser window location fallback
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // 5. Default fallback for development
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
