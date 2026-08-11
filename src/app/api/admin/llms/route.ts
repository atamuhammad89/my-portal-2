import { NextResponse } from "next/server";
import { listRetellLlms, createRetellLlm } from "@/lib/retell-api";
import { createLlmSchema } from "@/lib/validations/retell";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const llms = await listRetellLlms({ correlationId });
    return NextResponse.json(llms);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list Retell LLMs" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createLlmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await createRetellLlm(validation.data, { correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create Retell LLM" },
      { status: error.status || 500 }
    );
  }
}
