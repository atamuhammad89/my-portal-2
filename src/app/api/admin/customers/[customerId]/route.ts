// src/app/api/admin/customers/[customerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  const payload = await verifyRequestJwt(req);
  if (!payload || !requireRole(payload, ["super_admin", "operations", "support", "finance"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, email, newPassword, isActive, role, resellerId, commissionRate } = body;

  const supabase = createServerSupabaseClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (fullName !== undefined && fullName.trim()) {
    updates.full_name = fullName.trim();
  }

  if (email !== undefined && email.trim()) {
    const newEmail = email.toLowerCase().trim();
    // Check email uniqueness
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .ilike("email", newEmail)
      .neq("id", customerId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
    }
    updates.email = newEmail;
  }

  if (typeof isActive === "boolean") {
    updates.is_active = isActive;
  }

  if (role !== undefined && ["owner", "super_admin", "reseller"].includes(role)) {
    updates.role = role;
  }

  if (resellerId !== undefined) {
    updates.reseller_id = resellerId || null;
    updates.commission_rate = null; // Inherit reseller's default rate dynamically
  }

  if (commissionRate !== undefined) {
    updates.commission_rate = commissionRate;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    updates.password_hash = await bcrypt.hash(newPassword, 12);
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", customerId);

  if (error) {
    return NextResponse.json({ error: "Failed to update customer." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}