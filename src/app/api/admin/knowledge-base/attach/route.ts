import { NextResponse } from "next/server";
import { attachKnowledgeBase } from "@/lib/retell-api";
import { attachKbSchema } from "@/lib/validations/retell";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = attachKbSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await attachKnowledgeBase(validation.data.llm_id, validation.data.knowledge_base_id, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to attach Knowledge Base to LLM" },
      { status: error.status || 500 }
    );
  }
}
