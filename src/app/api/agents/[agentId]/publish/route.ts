import { NextRequest, NextResponse } from "next/server";
import { publishRetellAgentVersion, getRetellAgent } from "@/lib/retell-api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // body optional
    }

    let retellAgentId = agentId;
    let currentVersion = body.version || 1;

    const supabase = createServerSupabaseClient();
    try {
      const { data: dbAgent } = await supabase
        .from("agents")
        .select("*")
        .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
        .single();

      if (dbAgent) {
        retellAgentId = dbAgent.retell_agent_id || dbAgent.id;
        if (dbAgent.config?.version) {
          currentVersion = Number(dbAgent.config.version);
        }
      }
    } catch (e) {
      console.warn("[Publish Agent DB Lookup Warning]", e);
    }

    // Try fetching live agent from Retell to determine latest version
    try {
      const retellAgent = await getRetellAgent(retellAgentId);
      if (retellAgent?.version) {
        currentVersion = Number(retellAgent.version);
      }
    } catch {
      // ignore
    }

    const versionToPublish = body.version ?? currentVersion ?? 1;
    const versionTitle = body.version_title || `v${versionToPublish}.0`;
    const versionDescription = body.version_description || "Published via CallAutomate Portal";

    // Call Retell POST /publish-agent-version/{retellAgentId}
    const publishResult = await publishRetellAgentVersion(retellAgentId, {
      version: versionToPublish,
      version_title: versionTitle,
      version_description: versionDescription,
    });

    // Update Supabase DB
    try {
      await supabase
        .from("agents")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${agentId},retell_agent_id.eq.${retellAgentId}`);
    } catch (e) {
      console.warn("[Publish Agent DB update warning]", e);
    }

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      retell_agent_id: retellAgentId,
      version: versionToPublish,
      version_title: versionTitle,
      result: publishResult,
      message: `Agent version v${versionToPublish} published successfully!`,
    });
  } catch (error: any) {
    console.error("[POST /api/agents/[agentId]/publish]", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to publish agent version",
      },
      { status: error.status || 500 }
    );
  }
}
