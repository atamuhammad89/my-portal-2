import { NextResponse } from "next/server";
import { listRetellCalls, stopRetellCall } from "@/lib/retell-api";
import { z } from "zod";

const stopCallPayloadSchema = z.object({
  action: z.literal("stop"),
  call_id: z.string().min(1, "Call ID is required"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    if (searchParams.get("agent_id")) filter.agent_id = searchParams.get("agent_id");
    if (searchParams.get("call_type")) filter.call_type = searchParams.get("call_type");

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const calls = await listRetellCalls(filter, { correlationId });
    return NextResponse.json(calls);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list calls" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = stopCallPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await stopRetellCall(validation.data.call_id, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to stop call" },
      { status: error.status || 500 }
    );
  }
}
