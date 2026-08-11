import { NextResponse } from "next/server";
import { getConcurrencyStatus } from "@/lib/retell-api";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const concurrency = await getConcurrencyStatus({ correlationId });
    return NextResponse.json(concurrency);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch concurrency status" },
      { status: error.status || 500 }
    );
  }
}
