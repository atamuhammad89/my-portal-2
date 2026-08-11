import { notFound } from "next/navigation";
import { AgentEditorShell } from "@/components/agents/editor/agent-editor-shell";
import { getRetellAgent } from "@/lib/retell-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AgentDetailPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params;

  let agentData: any = null;

  try {
    const live = await getRetellAgent(agentId, { skipCache: true });
    if (live) {
      agentData = {
        ...live,
        id: live.agent_id || agentId,
        agent_id: live.agent_id || agentId,
        name: live.agent_name || "Voice Agent",
        agent_name: live.agent_name || "Voice Agent",
        general_prompt: live.general_prompt ?? "",
        begin_message: live.begin_message ?? "",
        begin_after_user_silence_ms: (live as any).begin_after_user_silence_ms ?? 2000,
      };
    }
  } catch (err) {
    console.error("[AgentDetailPage Direct Retell API Error]", err);
  }

  if (!agentData) {
    notFound();
  }

  return <AgentEditorShell agent={agentData} />;
}
