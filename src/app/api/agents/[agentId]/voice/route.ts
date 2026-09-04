import { NextRequest, NextResponse } from "next/server";
import { updateRetellAgent, getRetellAgent } from "@/lib/retell-api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { voice_id, provider, speed, pitch } = body;

    const retellResult = await updateRetellAgent(agentId, { voice_id });

    return NextResponse.json({
      success: true,
      section: "voice",
      data: {
        ...retellResult,
        id: retellResult.agent_id || agentId,
        agent_id: retellResult.agent_id || agentId,
        voice_id: retellResult.voice_id || voice_id,
        provider,
        speed,
        pitch,
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/voice]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update voice configuration on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
