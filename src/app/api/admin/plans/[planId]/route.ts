import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

// PATCH /api/admin/plans/[planId] — update a plan
export async function PATCH(req: NextRequest, context: any) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { planId } = await context.params;
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("plans")
      .update({
        name: body.name,
        display_name: body.display_name,
        monthly_price: body.monthly_price,
        total_minutes: body.total_minutes,
        price_per_minute: body.price_per_minute,
        description: body.description ?? null,
        is_active: body.is_active,
        stripe_price_id: body.stripe_price_id?.trim() || null,
        features: body.features ?? [],
        is_featured: body.is_featured ?? false,
      })
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/plans/[planId]]", err);
    return NextResponse.json({ error: "Failed to update plan." }, { status: 500 });
  }
}

// DELETE /api/admin/plans/[planId] — delete a plan
export async function DELETE(req: NextRequest, context: any) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { planId } = await context.params;
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", planId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/plans/[planId]]", err);
    return NextResponse.json({ error: "Failed to delete plan." }, { status: 500 });
  }
}