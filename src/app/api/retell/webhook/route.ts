import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import crypto from "crypto";

const PROCESSED_EVENTS = new Set<string>();

/** Verifies Retell webhook signature if secret is configured */
function verifyRetellSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return true;
  try {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-retell-signature");
    const secret = process.env.RETELL_WEBHOOK_SECRET || "";

    if (secret && !verifyRetellSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.event_id || `${event}_${payload.call?.call_id}_${Date.now()}`;

    // Deduplication check
    if (PROCESSED_EVENTS.has(eventId)) {
      return NextResponse.json({ status: "already_processed", event_id: eventId });
    }
    PROCESSED_EVENTS.add(eventId);

    // Limit in-memory deduplication set size
    if (PROCESSED_EVENTS.size > 5000) {
      const iterator = PROCESSED_EVENTS.values();
      for (let i = 0; i < 1000; i++) {
        const val = iterator.next().value;
        if (val) PROCESSED_EVENTS.delete(val);
      }
    }

    const call = payload.call || {};
    const callId = call.call_id;

    if (!callId) {
      return NextResponse.json({ status: "ignored_no_call_id" });
    }

    const supabase = createServerSupabaseClient();

    switch (event) {
      case "call_started": {
        await supabase.from("call_logs").upsert(
          {
            retell_call_id: callId,
            retell_agent_id: call.agent_id || "unknown",
            call_status: "ongoing",
            start_timestamp: call.start_timestamp || Date.now(),
            from_number: call.from_number || null,
            to_number: call.to_number || null,
            raw_payload: payload,
          },
          { onConflict: "retell_call_id" }
        );
        break;
      }

      case "call_ended": {
        const durationSeconds = call.end_timestamp && call.start_timestamp
          ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
          : null;

        await supabase.from("call_logs").upsert(
          {
            retell_call_id: callId,
            retell_agent_id: call.agent_id || "unknown",
            call_status: "ended",
            start_timestamp: call.start_timestamp || null,
            end_timestamp: call.end_timestamp || Date.now(),
            duration_seconds: durationSeconds,
            disconnection_reason: call.disconnection_reason || null,
            raw_payload: payload,
          },
          { onConflict: "retell_call_id" }
        );
        break;
      }

      case "transcript_updated": {
        await supabase.from("call_logs").update({
          transcript: call.transcript || null,
          transcript_object: call.transcript_object || null,
        }).eq("retell_call_id", callId);
        break;
      }

      case "call_analyzed":
      case "recording_ready": {
        const analysis = call.call_analysis || {};
        await supabase.from("call_logs").update({
          recording_url: call.recording_url || null,
          call_cost: call.call_cost || null,
          call_analysis: analysis,
        }).eq("retell_call_id", callId);
        break;
      }

      default:
        // Default fallback for any other Retell event
        await supabase.from("call_logs").upsert(
          {
            retell_call_id: callId,
            retell_agent_id: call.agent_id || "unknown",
            raw_payload: payload,
          },
          { onConflict: "retell_call_id" }
        );
        break;
    }

    return NextResponse.json({ status: "success", event, call_id: callId });
  } catch (error: any) {
    console.error("Retell Webhook Sync Error:", error);
    return NextResponse.json({ error: error.message || "Webhook handling failed" }, { status: 500 });
  }
}
