// src/app/api/billing/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[api/billing Webhook] Webhook request received.");

    // Read payload
    const body = await req.json();
    console.log("[api/billing Webhook] Payload:", JSON.stringify(body, null, 2));

    return NextResponse.json({
      success: true,
      message: "Webhook received successfully",
      receivedData: body,
    });
  } catch (err: any) {
    console.error("[api/billing Webhook] Error processing webhook:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
