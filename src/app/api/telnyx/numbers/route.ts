import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { listRetellPhoneNumbers } from "@/lib/retell-api";

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (users && users.length > 0) {
      return users[0].id;
    }
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    const fallbackUserId = await getFallbackUserId();

    if (!userId) {
      userId = fallbackUserId;
    }

    const retellNumberAgentMap = new Map<string, string>();
    try {
      const liveRetellNumbers = await listRetellPhoneNumbers({ skipCache: true });
      (liveRetellNumbers || []).forEach((p: any) => {
        const num = p.phone_number;
        const assignedAgent =
          p.inbound_agents?.[0]?.agent_id ||
          p.inbound_agent_id ||
          p.outbound_agents?.[0]?.agent_id ||
          p.outbound_agent_id;
        if (num && assignedAgent) {
          retellNumberAgentMap.set(num, assignedAgent);
        }
      });
    } catch (e) {
      console.warn("[Telnyx Numbers Retell Map Warning]", e);
    }

    const numbersMap = new Map<string, any>();

    // 1. Query `phone_numbers` table for THIS user with status = 'success' or 'active'
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase
        .from("phone_numbers")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId && fallbackUserId && userId !== fallbackUserId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${fallbackUserId}`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: dbNumbers } = await query;
      if (dbNumbers && dbNumbers.length > 0) {
        dbNumbers.forEach((n: any) => {
          const st = (n.status || "").toLowerCase();
          if (
            n.phone_number &&
            (st === "success" || st === "active" || st === "completed" || st === "paid")
          ) {
            numbersMap.set(n.phone_number, {
              id: n.id || n.phone_number,
              phoneNumber: n.phone_number,
              status: n.status || "active",
              countryCode: n.country_code || "US",
              type: n.type || "local",
              capabilities: n.capabilities ? Object.keys(n.capabilities) : ["voice", "sms"],
              purchasedAt: n.created_at || new Date().toISOString(),
              agentId: retellNumberAgentMap.get(n.phone_number) || n.retell_agent_id || undefined,
              userId: n.user_id || userId,
            });
          }
        });
      }
    } catch (e) {
      console.warn("[Numbers DB Query Warning]", e);
    }

    // 2. Also query `phone_orders` table for THIS user with status = 'success' or 'active'
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase
        .from("phone_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId && fallbackUserId && userId !== fallbackUserId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${fallbackUserId}`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: dbOrders } = await query;
      if (dbOrders && dbOrders.length > 0) {
        dbOrders.forEach((o: any) => {
          const st = (o.status || "").toLowerCase();
          if (
            o.phone_number &&
            !numbersMap.has(o.phone_number) &&
            (st === "success" || st === "active" || st === "completed" || st === "paid")
          ) {
            numbersMap.set(o.phone_number, {
              id: o.order_id || o.phone_number,
              phoneNumber: o.phone_number,
              status: "active",
              countryCode: o.phone_number.startsWith("+44") ? "GB" : "US",
              type: "local",
              capabilities: ["voice", "sms"],
              purchasedAt: o.created_at || new Date().toISOString(),
              agentId: retellNumberAgentMap.get(o.phone_number) || undefined,
              userId: o.user_id || userId,
            });
          }
        });
      }
    } catch (e) {
      console.warn("[Orders DB Query Warning]", e);
    }

    const resultList = Array.from(numbersMap.values());
    return NextResponse.json(resultList);
  } catch (error: any) {
    console.error("[API /telnyx/numbers Error]", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch user phone numbers" },
      { status: 500 }
    );
  }
}
