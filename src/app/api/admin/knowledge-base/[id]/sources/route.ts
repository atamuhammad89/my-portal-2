import { NextResponse } from "next/server";
import { addKnowledgeBaseSources } from "@/lib/retell-api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    // 1. Synchronize with official Retell API first
    const result = await addKnowledgeBaseSources(id, body, { correlationId });

    // 2. Update local Supabase snapshot table
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("retell_knowledge_bases")
        .upsert({
          knowledge_base_id: result.knowledge_base_id || id,
          knowledge_base_name: result.knowledge_base_name,
          status: result.status || "indexing",
          documents: result.documents || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "knowledge_base_id" });
    } catch (dbErr) {
      console.warn("[Knowledge Base Sources DB Snapshot Warning]", dbErr);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add sources to Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}
