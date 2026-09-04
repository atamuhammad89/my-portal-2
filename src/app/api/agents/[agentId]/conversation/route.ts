import { NextRequest, NextResponse } from "next/server";
import { updateRetellAgent, getRetellAgent, updateRetellLlm } from "@/lib/retell-api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { begin_message, general_prompt, begin_after_user_silence_ms } = body;

    // 1. Prepare agent payload
    const rawMs = begin_after_user_silence_ms !== undefined ? Number(begin_after_user_silence_ms) : undefined;
    const finalMs = rawMs !== undefined && !isNaN(rawMs) ? (rawMs < 50 ? rawMs * 1000 : rawMs) : undefined;

    const agentPayload: Record<string, any> = {};
    if (begin_message !== undefined) agentPayload.begin_message = begin_message;
    if (general_prompt !== undefined) agentPayload.general_prompt = general_prompt;
    if (finalMs !== undefined) {
      agentPayload.begin_after_user_silence_ms = finalMs;
      agentPayload.post_response_delay_ms = finalMs;
    }

    // 2. Update agent directly on Retell AI REST API
    const retellResult = await updateRetellAgent(agentId, agentPayload);

    // 3. If agent has Retell LLM ID, update LLM prompt asynchronously in background without blocking response
    const llmId = (retellResult as any)?.response_engine?.llm_id;
    if (llmId && (general_prompt !== undefined || begin_message !== undefined)) {
      updateRetellLlm(llmId, {
        ...(general_prompt !== undefined ? { general_prompt } : {}),
        ...(begin_message !== undefined ? { begin_message } : {}),
      }).catch((err) => console.warn("[Conversation LLM Sync async warn]", err));
    }

    return NextResponse.json({
      success: true,
      section: "conversation",
      data: {
        ...retellResult,
        id: retellResult.agent_id || agentId,
        agent_id: retellResult.agent_id || agentId,
        begin_message: retellResult.begin_message ?? begin_message ?? "",
        general_prompt: retellResult.general_prompt ?? general_prompt ?? "",
        begin_after_user_silence_ms: (retellResult as any).begin_after_user_silence_ms ?? finalMs ?? 2000,
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/conversation]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update prompt and conversation settings on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
