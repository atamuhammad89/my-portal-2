import { NextResponse } from "next/server";
import { getCallAnalysis, rerunAnalysis } from "@/lib/retell-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("call_id");
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    if (callId) {
      const analysis = await getCallAnalysis(callId, { correlationId });
      return NextResponse.json(analysis);
    }

    return NextResponse.json(
      { message: "Specify call_id to retrieve call analysis telemetry." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.call_id) {
      return NextResponse.json({ error: "call_id is required" }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await rerunAnalysis(body.call_id, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to rerun call analysis" },
      { status: error.status || 500 }
    );
  }
}
