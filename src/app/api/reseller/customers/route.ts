import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt || !requireRole(jwt, ["reseller"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resellerId = jwt.sub;

  try {
    const supabase = createServerSupabaseClient();

    // Fetch all customer owners assigned to this reseller
    const { data: clients, error: clientError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        is_active,
        created_at,
        commission_rate,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          monthly_price_snapshot,
          minutes_used,
          total_minutes_snapshot,
          started_at,
          ends_at,
          plans ( display_name )
        )
      `)
      .eq("reseller_id", resellerId)
      .eq("role", "owner")
      .order("created_at", { ascending: false });

    if (clientError) throw clientError;

    // Fetch reseller default rate to use as dynamic fallback
    const { data: resellerUser } = await supabase
      .from("users")
      .select("commission_rate")
      .eq("id", resellerId)
      .single();
    const defaultRate = resellerUser?.commission_rate !== null && resellerUser?.commission_rate !== undefined
      ? parseFloat(resellerUser.commission_rate)
      : 0.00;

    const rows = (clients ?? []).map((c: any) => {
      const sub = c.subscriptions;
      const monthlyPrice = sub ? parseFloat(sub.monthly_price_snapshot ?? "0") : 0;
      const rate = c.commission_rate !== null && c.commission_rate !== undefined 
        ? parseFloat(c.commission_rate) 
        : defaultRate;
      const commission = sub && sub.status === "active" ? monthlyPrice * rate : 0;

      return {
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        isActive: c.is_active,
        createdAt: c.created_at,
        commissionRate: rate,
        monthlyCommission: commission,
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              planName: sub.plans?.display_name ?? "—",
              minutesUsed: parseFloat(sub.minutes_used ?? "0"),
              totalMinutes: sub.total_minutes_snapshot,
              monthlyPrice,
              startedAt: sub.started_at,
              endsAt: sub.ends_at,
            }
          : null,
      };
    });

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[GET /api/reseller/customers]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch reseller customers." }, { status: 500 });
  }
}
