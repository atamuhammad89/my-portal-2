// src/app/api/debug-env/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/utils/url-helper";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    RESOLVED_BASE_URL: getAppBaseUrl(req),
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ?? "NOT_SET",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "NOT_SET",
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "NOT_SET",
    VERCEL_URL: process.env.VERCEL_URL ?? "NOT_SET",
    NODE_ENV: process.env.NODE_ENV ?? "NOT_SET",
  });
}
