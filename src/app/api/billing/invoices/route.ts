// src/app/api/billing/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", payload.sub)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/billing/invoices] db error:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices ?? [] });
  } catch (err) {
    console.error("[GET /api/billing/invoices] server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
