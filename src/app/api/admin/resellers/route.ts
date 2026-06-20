import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance", "operations"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch all reseller role users
    const { data: resellers, error: resellerError } = await supabase
      .from("users")
      .select("id, full_name, email, is_active, created_at, commission_rate")
      .eq("role", "reseller")
      .order("created_at", { ascending: false });

    if (resellerError) throw resellerError;

    if (!resellers || resellers.length === 0) {
      return NextResponse.json([]);
    }

    const resellerIds = resellers.map((r: any) => r.id);

    // 2. Fetch all customers assigned to these resellers
    const { data: customers, error: customerError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        is_active,
        reseller_id,
        commission_rate,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          monthly_price_snapshot,
          plans ( display_name )
        )
      `)
      .in("reseller_id", resellerIds)
      .eq("role", "owner");

    if (customerError) throw customerError;

    const customersByReseller: Record<string, any[]> = {};
    (customers ?? []).forEach((c: any) => {
      if (!c.reseller_id) return;
      if (!customersByReseller[c.reseller_id]) {
        customersByReseller[c.reseller_id] = [];
      }
      customersByReseller[c.reseller_id].push(c);
    });

    // 3. Assemble the response
    const rows = resellers.map((reseller: any) => {
      const clients = customersByReseller[reseller.id] ?? [];
      
      let totalRevenue = 0;
      let totalCommission = 0;

      const formattedClients = clients.map((c: any) => {
        const sub = c.subscriptions;
        const monthlyPrice = sub ? parseFloat(sub.monthly_price_snapshot ?? "0") : 0;
        const rate = c.commission_rate !== null && c.commission_rate !== undefined ? parseFloat(c.commission_rate) : parseFloat(reseller.commission_rate ?? "0.00");
        const clientCommission = monthlyPrice * rate;

        if (sub && sub.status === "active") {
          totalRevenue += monthlyPrice;
          totalCommission += clientCommission;
        }

        return {
          id: c.id,
          fullName: c.full_name,
          email: c.email,
          isActive: c.is_active,
          planName: sub?.plans?.display_name ?? "—",
          subscriptionStatus: sub?.status ?? "none",
          monthlyPrice,
          commissionRate: rate,
          monthlyCommission: clientCommission,
        };
      });

      return {
        id: reseller.id,
        fullName: reseller.full_name,
        email: reseller.email,
        isActive: reseller.is_active,
        createdAt: reseller.created_at,
        defaultCommissionRate: reseller.commission_rate !== null && reseller.commission_rate !== undefined ? parseFloat(reseller.commission_rate) : 0.00,
        clientsCount: clients.length,
        totalRevenue,
        totalCommission,
        clients: formattedClients,
      };
    });

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[GET /api/admin/resellers]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch resellers." }, { status: 500 });
  }
}
