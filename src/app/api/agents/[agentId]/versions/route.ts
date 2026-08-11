import { NextRequest, NextResponse } from "next/server";
import { getRetellAgentVersions } from "@/lib/retell-api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;

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

    const versions = await getRetellAgentVersions(retellAgentId, { skipCache: true });
    return NextResponse.json({
      agent_id: agentId,
      retell_agent_id: retellAgentId,
      versions: versions || [],
    });
  } catch (error: any) {
    console.error("[GET /api/agents/[agentId]/versions]", error);
    return NextResponse.json(
      { versions: [], error: error.message || "Failed to fetch agent versions" },
      { status: 500 }
    );
  }
}
