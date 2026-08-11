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

    // 1. Fetch current agent live details to check for llm_id
    const currentAgent = await getRetellAgent(agentId, { skipCache: true });
    const llmId = currentAgent?.response_engine?.llm_id;

    // 2. If agent has Retell LLM, update prompt & first message on LLM directly
    if (llmId) {
      try {
        await updateRetellLlm(llmId, {
          general_prompt: general_prompt ?? currentAgent.general_prompt,
          begin_message: begin_message ?? currentAgent.begin_message,
        });
      } catch (llmErr) {
        console.warn("[Conversation Route LLM Sync Warn]", llmErr);
      }
    }

    // 3. Update agent level settings (pause before speaking: begin_after_user_silence_ms & post_response_delay_ms) on Retell AI
    const rawMs = begin_after_user_silence_ms !== undefined ? Number(begin_after_user_silence_ms) : undefined;
    const finalMs = rawMs !== undefined && !isNaN(rawMs) ? (rawMs < 50 ? rawMs * 1000 : rawMs) : undefined;

    const agentPayload: Record<string, any> = {};
    if (begin_message !== undefined) agentPayload.begin_message = begin_message;
    if (general_prompt !== undefined) agentPayload.general_prompt = general_prompt;
    if (finalMs !== undefined) {
      agentPayload.begin_after_user_silence_ms = finalMs;
      agentPayload.post_response_delay_ms = finalMs;
    }

    const retellResult = await updateRetellAgent(agentId, agentPayload);

    // 4. Fetch fresh agent details straight from Retell AI API
    const freshAgent = await getRetellAgent(agentId, { skipCache: true });

    return NextResponse.json({
      success: true,
      section: "conversation",
      data: {
        ...retellResult,
        ...freshAgent,
        begin_message: freshAgent.begin_message ?? begin_message ?? "",
        general_prompt: freshAgent.general_prompt ?? general_prompt ?? "",
        begin_after_user_silence_ms: (freshAgent as any).begin_after_user_silence_ms ?? finalMs ?? 2000,
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
