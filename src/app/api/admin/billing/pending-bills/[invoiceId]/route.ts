// src/app/api/admin/billing/pending-bills/[invoiceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

type Action = "mark_paid" | "waive_off";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "finance"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const invoiceId = (await params).invoiceId;

  let body: { action: Action };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;
  if (!["mark_paid", "waive_off"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = action === "mark_paid" ? "paid" : "waived";

  const { data, error } = await supabase
    .from("pending_overage_invoices")
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .select("id, status")
    .single();

  if (error) {
    console.error(`[admin pending-bills PATCH] error:`, error);
    return NextResponse.json({ error: "Failed to update invoice.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, invoiceId: data.id, status: data.status });
}
