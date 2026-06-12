import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

// GET /api/admin/plans — list all plans
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("monthly_price", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/admin/plans]", err);
    return NextResponse.json({ error: "Failed to fetch plans." }, { status: 500 });
  }
}

// POST /api/admin/plans — create a new plan
export async function POST(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("plans")
      .insert({
        name: body.name,
        display_name: body.display_name,
        monthly_price: body.monthly_price,
        total_minutes: body.total_minutes,
        price_per_minute: body.price_per_minute,
        description: body.description ?? null,
        is_active: body.is_active ?? true,
        stripe_price_id: body.stripe_price_id?.trim() || null,
        features: body.features ?? [],
        is_featured: body.is_featured ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/plans]", err);
    return NextResponse.json({ error: "Failed to create plan." }, { status: 500 });
  }
}