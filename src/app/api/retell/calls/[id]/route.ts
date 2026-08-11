import { NextResponse } from "next/server";
import { getRetellCall, updateLiveCall } from "@/lib/retell-api";
import { updateLiveCallSchema } from "@/lib/validations/retell";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const callData = await getRetellCall(id, { correlationId });
    return NextResponse.json(callData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get call detail" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateLiveCallSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await updateLiveCall(id, validation.data, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update live call" },
      { status: error.status || 500 }
    );
  }
}
