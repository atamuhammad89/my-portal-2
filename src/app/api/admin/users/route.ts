import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, tenant_id, created_at, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[/api/admin/users]", err);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}