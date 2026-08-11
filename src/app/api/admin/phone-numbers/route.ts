import { NextResponse } from "next/server";
import { listRetellPhoneNumbers, createRetellPhoneNumber } from "@/lib/retell-api";
import { createPhoneNumberSchema } from "@/lib/validations/retell";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const phoneNumbers = await listRetellPhoneNumbers({ correlationId });
    return NextResponse.json(phoneNumbers);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list phone numbers" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createPhoneNumberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const idempotencyKey = request.headers.get("idempotency-key") || undefined;
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    const result = await createRetellPhoneNumber(validation.data, { idempotencyKey, correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create phone number" },
      { status: error.status || 500 }
    );
  }
}
