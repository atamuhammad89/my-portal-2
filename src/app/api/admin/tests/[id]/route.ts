import { NextResponse } from "next/server";
import { getTest } from "@/lib/retell-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const testDef = await getTest(id, { correlationId });
    return NextResponse.json(testDef);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get test definition" },
      { status: error.status || 500 }
    );
  }
}
