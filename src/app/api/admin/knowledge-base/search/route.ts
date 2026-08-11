import { NextResponse } from "next/server";
import { searchKnowledgeBase } from "@/lib/retell-api";
import { searchKbSchema } from "@/lib/validations/retell";
import { z } from "zod";

const searchKbRequestSchema = searchKbSchema.extend({
  knowledge_base_id: z.string().min(1, "Knowledge Base ID is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = searchKbRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await searchKnowledgeBase(validation.data.knowledge_base_id, validation.data.query, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to search Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}
