// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { z } from "zod";

const profileUpdateSchema = z.object({
  fullName: z.string().min(1, "Name cannot be empty").max(100, "Name is too long").trim().optional(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").toLowerCase().trim().optional(),
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(72, "New password is too long").optional(),
});

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, tenant_id")
    .eq("id", payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    tenantId: user.tenant_id,
  });
}

export async function PATCH(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Validate request inputs using Zod
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid request body." },
        { status: 400 }
      );
    }

    const { fullName, email, currentPassword, newPassword } = validation.data;

    const supabase = createServerSupabaseClient();

    // Fetch current user details
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("id", payload.sub)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update name if supplied
    if (fullName) {
      updates.full_name = fullName;
    }

    // Update email if supplied and changed
    if (email) {
      if (email !== user.email) {
        // Verify unique email constraint
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .ilike("email", email)
          .neq("id", user.id)
          .maybeSingle();
        if (existing) {
          return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
        }
        updates.email = email;
      }
    }

    // Update password if supplied
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      updates.password_hash = await bcrypt.hash(newPassword, 12);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
