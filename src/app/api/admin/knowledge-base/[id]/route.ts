import { NextResponse } from "next/server";
import { getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from "@/lib/retell-api";
import { updateKbSchema } from "@/lib/validations/retell";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const kb = await getKnowledgeBase(id, { correlationId });
    return NextResponse.json(kb);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateKbSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await updateKnowledgeBase(id, validation.data, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    await deleteKnowledgeBase(id, { correlationId });
    return NextResponse.json({ success: true, knowledge_base_id: id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}
