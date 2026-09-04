// src/app/api/admin/agents/assistant-ids/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
    const jwt = await verifyRequestJwt(req);
    console.log("JWT Payload:", jwt);
    if (!requireRole(jwt, ["super_admin", "operations"])) {
        console.warn("Unauthorized access attempt. JWT Payload:", jwt);
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const cdrsSupabase = createCdrsServerSupabaseClient();
    // Pull distinct assistant IDs from call_logs
    const { data, error } = await cdrsSupabase
        .from("cdrs")
        .select("assistant_id")
        .order("assistant_id");
    console.log("Fetched assistant IDs:", data, "Error:", error);
    console.log(jwt);

    if (error) return NextResponse.json({ error: "Failed to fetch." }, { status: 500 });

    const unique = [...new Set((data ?? []).map((r) => r.assistant_id).filter(Boolean))];
    return NextResponse.json(unique);
}