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

  const body = await req.json();
  const { newPassword } = body;

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
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