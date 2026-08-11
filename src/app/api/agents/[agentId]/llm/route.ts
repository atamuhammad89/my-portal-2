import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateRetellLlm, createRetellLlm, updateRetellAgent, getRetellAgent } from "@/lib/retell-api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    const retellAgentId = dbAgent?.retell_agent_id || agentId;

    // 1. Resolve live Retell agent & extract llm_id
    let llmId: string | undefined = dbAgent?.config?.response_engine?.llm_id;
    let liveAgent: any = null;

    if (retellAgentId) {
      try {
        liveAgent = await getRetellAgent(retellAgentId);
        if (liveAgent?.response_engine?.llm_id) {
          llmId = liveAgent.response_engine.llm_id;
        }
      } catch (err) {
        console.warn("[PATCH /api/agents/[agentId]/llm] could not fetch live Retell agent", err);
      }
    }

    let retellLlmResult = null;

    // 2. Sync with Retell AI
    if (llmId) {
      try {
        retellLlmResult = await updateRetellLlm(llmId, {
          model,
          model_temperature: typeof temperature === "number" ? temperature : undefined,
        });
      } catch (retellErr: any) {
        console.error("[LLM Section Retell Update Error]", retellErr);
        return NextResponse.json(
          { error: retellErr.message || "Failed to update LLM configuration on Retell AI" },
          { status: retellErr.status || 500 }
        );
      }
    } else if (retellAgentId) {
      // If agent has no LLM on Retell yet, create one & bind to agent
      try {
        const newLlm = await createRetellLlm({
          model: model || "gpt-4o",
          general_prompt: dbAgent?.general_prompt || liveAgent?.general_prompt || "You are a helpful AI assistant.",
        });
        llmId = newLlm.llm_id;
        retellLlmResult = newLlm;

        await updateRetellAgent(retellAgentId, {
          response_engine: {
            type: "retell-llm",
            llm_id: newLlm.llm_id,
          },
        });
      } catch (createErr: any) {
        console.error("[LLM Section Retell Create Error]", createErr);
        return NextResponse.json(
          { error: createErr.message || "Failed to create LLM engine on Retell AI" },
          { status: createErr.status || 500 }
        );
      }
    }

    // 3. Update local Supabase DB snapshot
    if (dbAgent) {
      const config = dbAgent.config || {};
      if (llmId) {
        config.response_engine = { type: "retell-llm", llm_id: llmId };
      }
      config.llm = { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url };

      await supabase
        .from("agents")
        .update({
          llm_websocket_url: custom_websocket_url || dbAgent.llm_websocket_url,
          config: retellLlmResult ? { ...config, llm_response: retellLlmResult } : config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);
    }

    return NextResponse.json({
      success: true,
      section: "llm",
      data: { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url },
      retellLlmResult,
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/llm]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update LLM settings" },
      { status: 500 }
    );
  }
}
