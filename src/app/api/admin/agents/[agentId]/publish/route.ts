import { NextResponse } from "next/server";
import { publishRetellAgent } from "@/lib/retell-api";
import { publishAgentSchema } from "@/lib/validations/retell";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const validation = publishAgentSchema.safeParse({ agent_id: agentId });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const idempotencyKey = request.headers.get("idempotency-key") || undefined;
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    const result = await publishRetellAgent(agentId, { idempotencyKey, correlationId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to publish agent" },
      { status: error.status || 500 }
    );
  }
}
