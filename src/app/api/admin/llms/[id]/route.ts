import { NextResponse } from "next/server";
import { getRetellLlm, updateRetellLlm, deleteRetellLlm } from "@/lib/retell-api";
import { updateLlmSchema } from "@/lib/validations/retell";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const llm = await getRetellLlm(id, { correlationId });
    return NextResponse.json(llm);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get Retell LLM" },
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
    const validation = updateLlmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await updateRetellLlm(id, validation.data, { correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update Retell LLM" },
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
    await deleteRetellLlm(id, { correlationId });
    return NextResponse.json({ success: true, llm_id: id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete Retell LLM" },
      { status: error.status || 500 }
    );
  }
}
