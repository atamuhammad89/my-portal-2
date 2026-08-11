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

    // Sync snapshot to local Supabase DB
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("retell_phone_numbers")
        .upsert({
          phone_number: result.phone_number || decodedNumber,
          nickname: result.nickname,
          inbound_agent_id: result.inbound_agents?.[0]?.agent_id || null,
          outbound_agent_id: result.outbound_agents?.[0]?.agent_id || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "phone_number" });
    } catch (dbErr) {
      console.warn("[Phone Number DB Snapshot Warning]", dbErr);
    }

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

    // Delete snapshot from local Supabase DB
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("retell_phone_numbers")
        .delete()
        .eq("phone_number", decodedNumber);
    } catch (dbErr) {
      console.warn("[Phone Number DB Delete Warning]", dbErr);
    }

    return NextResponse.json({ success: true, phone_number: decodedNumber });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete phone number" },
      { status: error.status || 500 }
    );
  }
}
