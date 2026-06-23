// src/app/api/admin/billing/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!requireRole(payload, ["super_admin", "finance", "operations"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/billing/invoices] db error:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/billing/invoices] server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
