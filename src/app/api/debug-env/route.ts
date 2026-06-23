// src/app/api/debug-env/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ?? "NOT_SET",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "NOT_SET",
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "NOT_SET",
    NODE_ENV: process.env.NODE_ENV ?? "NOT_SET",
  });
}
