import { NextRequest, NextResponse } from "next/server";
import { listRetellPhoneNumbers } from "@/lib/retell-api";

export async function GET(req: NextRequest) {
  try {
    const numbers = await listRetellPhoneNumbers({ skipCache: true });
    return NextResponse.json(numbers);
  } catch (error: any) {
    console.error("[GET /api/retell/phone-numbers]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch phone numbers from Retell AI" },
      { status: 500 }
    );
  }
}
