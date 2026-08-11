import { NextRequest, NextResponse } from "next/server";
import {
  createRetellAgentVersion,
  publishRetellAgentVersion,
  getRetellAgentVersions,
} from "@/lib/retell-api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();

    const targetVersion = Number(body.targetVersion || body.base_version || body.version);
    if (!targetVersion || isNaN(targetVersion)) {
      return NextResponse.json(
        { error: "Valid targetVersion is required for rollback" },
        { status: 400 }
      );
    }

    let retellAgentId = agentId;
    const supabase = createServerSupabaseClient();
    try {
      const { data: dbAgent } = await supabase
        .from("agents")
        .select("retell_agent_id")
        .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
        .single();
      if (dbAgent?.retell_agent_id) {
        retellAgentId = dbAgent.retell_agent_id;
      }
    } catch {
      // ignore
    }

    // Step 1: Create a new draft from previous base_version via POST /create-agent-version/{agent_id}
    const createDraftRes = await createRetellAgentVersion(retellAgentId, targetVersion);
    const newDraftVersion = Number(createDraftRes?.version || createDraftRes?.draft_version || targetVersion + 1);

    // Step 2: Publish that new draft via POST /publish-agent-version/{agent_id}
    const publishRes = await publishRetellAgentVersion(retellAgentId, {
      version: newDraftVersion,
      version_title: `v${newDraftVersion}.0 (Rollback from v${targetVersion})`,
      version_description: `Re-published version v${targetVersion} as active v${newDraftVersion}`,
    });

    // Step 3: Update local DB record
    try {
      await supabase
        .from("agents")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${agentId},retell_agent_id.eq.${retellAgentId}`);
    } catch (e) {
      console.warn("[Rollback DB Update Warning]", e);
    }

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      retell_agent_id: retellAgentId,
      restored_from_version: targetVersion,
      new_published_version: newDraftVersion,
      create_draft_result: createDraftRes,
      publish_result: publishRes,
      message: `Successfully rolled back to configuration of v${targetVersion} and published as new active v${newDraftVersion}!`,
    });
  } catch (error: any) {
    console.error("[POST /api/agents/[agentId]/rollback]", error);
    return NextResponse.json(
      { error: error.message || "Failed to rollback agent version" },
      { status: error.status || 500 }
    );
  }
}
