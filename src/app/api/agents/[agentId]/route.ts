import { NextRequest, NextResponse } from "next/server";
import { getRetellAgent, updateRetellAgent, deleteRetellAgent } from "@/lib/retell-api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const live = await getRetellAgent(agentId, { skipCache: true });

    const agentData = {
      ...live,
      id: live.agent_id || agentId,
      agent_id: live.agent_id || agentId,
      name: live.agent_name || "Voice Agent",
      agent_name: live.agent_name || "Voice Agent",
      general_prompt: live.general_prompt ?? "",
      begin_message: live.begin_message ?? "",
      begin_after_user_silence_ms: (live as any).begin_after_user_silence_ms ?? 2000,
    };

    return NextResponse.json(agentData, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/agents/[agentId]]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch agent details from Retell AI" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();

    const retellResult = await updateRetellAgent(agentId, {
      ...(body.name ? { agent_name: body.name } : {}),
      ...(body.agent_name ? { agent_name: body.agent_name } : {}),
      ...(body.voice_id ? { voice_id: body.voice_id } : {}),
      ...(body.language ? { language: body.language } : {}),
      ...(body.begin_message ? { begin_message: body.begin_message } : {}),
      ...(body.general_prompt ? { general_prompt: body.general_prompt } : {}),
    });

    return NextResponse.json({
      ...retellResult,
      id: retellResult.agent_id || agentId,
      agent_id: retellResult.agent_id || agentId,
      name: retellResult.agent_name || body.name || "Voice Agent",
      agent_name: retellResult.agent_name || body.name || "Voice Agent",
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update agent on Retell AI" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    await deleteRetellAgent(agentId);
    return NextResponse.json({ success: true, agent_id: agentId });
  } catch (error: any) {
    console.error("[DELETE /api/agents/[agentId]]", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete agent from Retell AI" },
      { status: error.status || 500 }
    );
  }
}
