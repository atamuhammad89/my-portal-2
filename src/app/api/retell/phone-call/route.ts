import { NextResponse } from "next/server";
import { createRetellPhoneCall } from "@/lib/retell-api";
import { createPhoneCallSchema } from "@/lib/validations/retell";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createPhoneCallSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const idempotencyKey = request.headers.get("idempotency-key") || undefined;
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    const result = await createRetellPhoneCall(validation.data, { idempotencyKey, correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger outbound phone call" },
      { status: error.status || 500 }
    );
  }
}
