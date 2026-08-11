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

    const freshAgent = await getRetellAgent(agentId, { skipCache: true });

    return NextResponse.json({
      success: true,
      section: "general",
      data: {
        ...retellResult,
        ...freshAgent,
        name: freshAgent.agent_name || name || retellResult.agent_name,
        agent_name: freshAgent.agent_name || name || retellResult.agent_name,
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
