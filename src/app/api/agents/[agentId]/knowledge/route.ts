import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getRetellAgent, updateRetellAgent, updateRetellLlm, getKnowledgeBase } from "@/lib/retell-api";
import { verifyRequestJwt } from "@/lib/jwt-auth";

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (users && users.length > 0) return users[0].id;
  } catch (e) {}
  return null;
}

async function getUserKnowledgeBases(req: NextRequest): Promise<any[]> {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    if (!userId) userId = await getFallbackUserId();

    if (!userId) return [];

    const supabase = createServerSupabaseClient();
    const { data: userKbs } = await supabase.from("retell_knowledge_bases").select("*");

    const userKbRecords = (userKbs || []).filter(
      (kb: any) => kb.created_by === userId || kb.raw_payload?.created_by === userId
    );

    if (userKbRecords.length === 0) return [];

    return await Promise.all(
      userKbRecords.map(async (record: any) => {
        try {
          const live = await getKnowledgeBase(record.knowledge_base_id, { skipCache: true });
          return {
            ...record,
            ...live,
            knowledge_base_id: record.knowledge_base_id,
            knowledge_base_name: live?.knowledge_base_name || record.knowledge_base_name,
            status: live?.status || record.status || "complete",
          };
        } catch {
          return {
            knowledge_base_id: record.knowledge_base_id,
            knowledge_base_name: record.knowledge_base_name,
            status: record.status || "complete",
          };
        }
      })
    );
  } catch {
    return [];
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    let retellKbIds: string[] = [];

    try {
      const liveAgent = await getRetellAgent(agentId, { skipCache: true });
      if (Array.isArray(liveAgent?.knowledge_base_ids)) {
        retellKbIds = liveAgent.knowledge_base_ids;
      }
    } catch {
      const supabase = createServerSupabaseClient();
      const { data: dbAgent } = await supabase
        .from("agents")
        .select("*")
        .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
        .single();
      retellKbIds = dbAgent?.config?.knowledge_base_ids || [];
    }

    const allKbs = await getUserKnowledgeBases(req);

    return NextResponse.json({
      knowledge_base_ids: retellKbIds,
      all_kbs: allKbs,
    });
  } catch (error: any) {
    console.error("[GET /api/agents/[agentId]/knowledge]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Knowledge Base configuration" },
      { status: 500 }
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

    let finalKbIds: string[] = [];

    if (Array.isArray(body.knowledge_base_ids)) {
      finalKbIds = body.knowledge_base_ids;
    } else if (body.knowledge_base_id) {
      // Toggle single KB ID
      const { knowledge_base_id, action } = body;

      let currentKbIds: string[] = [];
      try {
        const liveAgent = await getRetellAgent(agentId, { skipCache: true });
        currentKbIds = Array.isArray(liveAgent?.knowledge_base_ids) ? liveAgent.knowledge_base_ids : [];
      } catch {
        currentKbIds = [];
      }

      if (action === "detach") {
        finalKbIds = currentKbIds.filter((id) => id !== knowledge_base_id);
      } else {
        const set = new Set(currentKbIds);
        set.add(knowledge_base_id);
        finalKbIds = Array.from(set);
      }
    } else {
      return NextResponse.json(
        { error: "knowledge_base_ids array or knowledge_base_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    const retellId = dbAgent?.retell_agent_id || agentId;

    // Fetch live agent to extract llm_id if available
    let liveAgent: any = null;
    try {
      liveAgent = await getRetellAgent(retellId, { skipCache: true });
    } catch {
      // ignore
    }

    const llmId = liveAgent?.response_engine?.llm_id || dbAgent?.config?.response_engine?.llm_id;

    // 1. If agent is powered by Retell LLM, update LLM knowledge_base_ids
    if (llmId) {
      try {
        await updateRetellLlm(llmId, {
          knowledge_base_ids: finalKbIds,
        });
      } catch (llmErr) {
        console.warn("[Retell Update LLM KB Warn]", llmErr);
      }
    }

    // 2. Update Agent on Retell AI (PATCH /v2/update-agent/{agent_id})
    try {
      await updateRetellAgent(retellId, {
        knowledge_base_ids: finalKbIds,
      } as any);
    } catch (agentErr) {
      console.warn("[Retell Update Agent KB Warn]", agentErr);
    }

    // 3. Sync Supabase local snapshot
    if (dbAgent) {
      const config = dbAgent.config || {};
      config.knowledge_base_ids = finalKbIds;

      await supabase
        .from("agents")
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);
    }

    const freshKbs = await getUserKnowledgeBases(req);

    return NextResponse.json({
      success: true,
      section: "knowledge",
      data: {
        knowledge_base_ids: finalKbIds,
        all_kbs: freshKbs,
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/knowledge]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Knowledge Base on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
