// src/app/api/admin/users/[userId]/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const payload = await verifyRequestJwt(req);
  if (!payload || !requireRole(payload, ["super_admin", "operations", "support", "finance"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = payload.role;
  const ROLE_PRIORITY: Record<string, number> = {
    super_admin: 40,
    operations: 30,
    support: 20,
    finance: 20,
    reseller: 10,
    user: 0,
    member: 0,
  };

  const supabase = createServerSupabaseClient();
  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  const actorPriority = ROLE_PRIORITY[actorRole] ?? 0;
  const targetPriority = ROLE_PRIORITY[targetUser.role] ?? 0;

  if (actorPriority <= targetPriority) {
    return NextResponse.json(
      { error: "Unauthorized: Cannot change the password of an equal or senior administrator." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { newPassword } = body;

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  const { error } = await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", userId);


  if (error) {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}