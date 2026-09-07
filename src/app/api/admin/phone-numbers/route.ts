import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { listRetellPhoneNumbers, createRetellPhoneNumber } from "@/lib/retell-api";
import { createPhoneNumberSchema } from "@/lib/validations/retell";
import { getPurchasedNumbers, isTelnyxConfigured } from "@/lib/telnyx-api";

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    // 1. Fetch numbers from Supabase `phone_numbers` table joined with `users`
    const { data: dbNumbers } = await supabase
      .from("phone_numbers")
      .select(`
        *,
        users:user_id (id, email, full_name, role)
      `)
      .order("created_at", { ascending: false });

    // 2. Fetch orders from Supabase `phone_orders` table joined with `users`
    const { data: dbOrders } = await supabase
      .from("phone_orders")
      .select(`
        *,
        users:user_id (id, email, full_name, role)
      `)
      .order("created_at", { ascending: false });

    // 3. Fetch live Retell numbers
    let retellNumbers: any[] = [];
    try {
      retellNumbers = await listRetellPhoneNumbers({ correlationId });
    } catch (rErr) {
      console.warn("[Admin Numbers Retell Fetch Warn]", rErr);
    }

    // 4. Fetch live Telnyx numbers if configured
    let telnyxNumbers: any[] = [];
    if (isTelnyxConfigured()) {
      try {
        telnyxNumbers = await getPurchasedNumbers();
      } catch (tErr) {
        console.warn("[Admin Numbers Telnyx Fetch Warn]", tErr);
      }
    }

    const mergedMap = new Map<string, any>();

    // Add DB numbers first (contains real owner user details from Supabase phone_numbers table!)
    if (dbNumbers && dbNumbers.length > 0) {
      dbNumbers.forEach((n: any) => {
        if (n.phone_number) {
          const rawEmail = n.users?.email || n.user_email || "";
          const isSys = !rawEmail || ["system", "system / unassigned", "unassigned pool", "unassigned"].includes(rawEmail.toLowerCase());

          mergedMap.set(n.phone_number, {
            id: n.id || n.phone_number,
            phone_number: n.phone_number,
            phone_number_pretty: n.phone_number,
            country_code: n.country_code || (n.phone_number.startsWith("+44") ? "GB" : "US"),
            type: n.type || "local",
            status: n.status || "active",
            user_id: isSys ? "" : (n.user_id || n.users?.id || ""),
            user_email: isSys ? "CallAutomate" : rawEmail,
            user_name: isSys ? "CallAutomate" : (n.users?.full_name || n.user_name || rawEmail),
            user_role: n.users?.role || "user",
          });
        }
      });
    }

    // Merge DB orders if not already in mergedMap
    if (dbOrders && dbOrders.length > 0) {
      dbOrders.forEach((o: any) => {
        if (o.phone_number && !mergedMap.has(o.phone_number)) {
          const rawEmail = o.users?.email || "";
          const isSys = !rawEmail || ["system", "system / unassigned", "unassigned pool", "unassigned"].includes(rawEmail.toLowerCase());

          mergedMap.set(o.phone_number, {
            id: o.id || o.order_id || o.phone_number,
            phone_number: o.phone_number,
            phone_number_pretty: o.phone_number,
            country_code: o.phone_number.startsWith("+44") ? "GB" : o.phone_number.startsWith("+49") ? "DE" : "US",
            type: "local",
            status: o.status === "success" ? "active" : o.status || "pending",
            user_id: isSys ? "" : (o.user_id || o.users?.id || ""),
            user_email: isSys ? "CallAutomate" : rawEmail,
            user_name: isSys ? "CallAutomate" : (o.users?.full_name || rawEmail),
            user_role: o.users?.role || "user",
          });
        }
      });
    }

    // Merge Retell numbers if any number is missing
    (retellNumbers || []).forEach((rn: any) => {
      const num = rn.phone_number;
      if (num) {
        const nickname = rn.nickname || "";
        const isSysNick = !nickname || ["system", "system / unassigned", "unassigned pool", "unassigned"].includes(nickname.toLowerCase());

        const existing = mergedMap.get(num);
        if (existing) {
          existing.agent_id = rn.inbound_agent_id || rn.outbound_agent_id || rn.agent_id || existing.agent_id;
          if (!isSysNick && (!existing.user_email || existing.user_email === "CallAutomate")) {
            existing.user_email = nickname;
            existing.user_name = nickname;
          }
        } else {
          mergedMap.set(num, {
            id: rn.phone_number,
            phone_number: rn.phone_number,
            phone_number_pretty: rn.phone_number_pretty || rn.phone_number,
            country_code: num.startsWith("+44") ? "GB" : "US",
            type: "local",
            status: "active",
            user_id: "",
            user_email: isSysNick ? "CallAutomate" : nickname,
            user_name: isSysNick ? "CallAutomate" : nickname,
            user_role: "system",
            agent_id: rn.inbound_agent_id || rn.outbound_agent_id || rn.agent_id,
          });
        }
      }
    });

    // Merge Telnyx numbers if any number is missing
    (telnyxNumbers || []).forEach((tn: any) => {
      const num = tn.phoneNumber;
      if (num && !mergedMap.has(num)) {
        mergedMap.set(num, {
          id: tn.id || num,
          phone_number: num,
          phone_number_pretty: num,
          country_code: tn.countryCode || "US",
          type: tn.type || "local",
          status: tn.status || "active",
          user_id: "",
          user_email: "CallAutomate",
          user_name: "CallAutomate",
          user_role: "system",
        });
      }
    });

    const resultList = Array.from(mergedMap.values());
    return NextResponse.json(resultList);
  } catch (error: any) {
    console.error("[GET /api/admin/phone-numbers Error]", error);
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

export async function PATCH(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { phoneNumberId, targetUserId } = await request.json();

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Missing phoneNumberId" }, { status: 400 });
    }

    const finalUserId = (!targetUserId || targetUserId === "unassigned" || targetUserId === "callautomate") ? null : targetUserId;

    // Check if phone_numbers record exists by id or phone_number
    const { data: existing } = await supabase
      .from("phone_numbers")
      .select("id, phone_number")
      .or(`id.eq.${phoneNumberId},phone_number.eq.${phoneNumberId}`)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("phone_numbers")
        .update({ user_id: finalUserId, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from("phone_numbers")
        .insert({
          phone_number: phoneNumberId,
          user_id: finalUserId,
          status: "active",
          type: "local",
          country_code: phoneNumberId.startsWith("+44") ? "GB" : "US",
        });

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      success: true,
      message: finalUserId ? "Phone number reassigned successfully." : "Phone number assigned to CallAutomate master account.",
    });
  } catch (error: any) {
    console.error("[PATCH /api/admin/phone-numbers Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update number assignment" }, { status: 500 });
  }
}
