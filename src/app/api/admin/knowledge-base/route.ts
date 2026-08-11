import { NextResponse } from "next/server";
import { listKnowledgeBases, createKnowledgeBase } from "@/lib/retell-api";
import { createKbSchema } from "@/lib/validations/retell";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const kbs = await listKnowledgeBases({ correlationId });
    return NextResponse.json(kbs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list Knowledge Bases" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createKbSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await createKnowledgeBase(validation.data, { correlationId });

    // Sync snapshot to local Supabase DB
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("retell_knowledge_bases")
        .upsert({
          knowledge_base_id: result.knowledge_base_id,
          knowledge_base_name: result.knowledge_base_name,
          status: result.status || "indexing",
          documents: result.documents || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "knowledge_base_id" });
    } catch (dbErr) {
      console.warn("[Knowledge Base DB Snapshot Warning]", dbErr);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}
