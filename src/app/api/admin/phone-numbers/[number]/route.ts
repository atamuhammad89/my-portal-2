import { NextResponse } from "next/server";
import { getRetellPhoneNumber, updateRetellPhoneNumber, deleteRetellPhoneNumber } from "@/lib/retell-api";
import { updatePhoneNumberSchema } from "@/lib/validations/retell";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const decodedNumber = decodeURIComponent(number);
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const phoneData = await getRetellPhoneNumber(decodedNumber, { correlationId });
    return NextResponse.json(phoneData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get phone number details" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const decodedNumber = decodeURIComponent(number);
    const body = await request.json();
    const validation = updatePhoneNumberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await updateRetellPhoneNumber(decodedNumber, validation.data, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update phone number" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const decodedNumber = decodeURIComponent(number);
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    await deleteRetellPhoneNumber(decodedNumber, { correlationId });
    return NextResponse.json({ success: true, phone_number: decodedNumber });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete phone number" },
      { status: error.status || 500 }
    );
  }
}
