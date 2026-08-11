import { NextResponse } from "next/server";
import { createBatchPhoneCall } from "@/lib/retell-api";
import { createBatchCallSchema } from "@/lib/validations/retell";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createBatchCallSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const idempotencyKey = request.headers.get("idempotency-key") || undefined;
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    const result = await createBatchPhoneCall(validation.data, { idempotencyKey, correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create batch phone calls" },
      { status: error.status || 500 }
    );
  }
}
