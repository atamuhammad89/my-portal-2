import { NextRequest, NextResponse } from "next/server";
import { updateRetellAgent, getRetellAgent } from "@/lib/retell-api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { name, language } = body;

    // Call Retell AI REST API directly (Retell as Single Source of Truth)
    const retellResult = await updateRetellAgent(agentId, {
      agent_name: name,
      language: language || "en-US",
    });

    return NextResponse.json({
      success: true,
      section: "general",
      data: {
        ...retellResult,
        id: retellResult.agent_id || agentId,
        agent_id: retellResult.agent_id || agentId,
        name: retellResult.agent_name || name,
        agent_name: retellResult.agent_name || name,
        language: retellResult.language || language || "en-US",
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/general]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update general settings on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
