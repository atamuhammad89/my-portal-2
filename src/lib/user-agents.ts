import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserAgentIds(supabase: SupabaseClient | any, userId: string): Promise<string[]> {
  const agentIds = new Set<string>();

  // 1. Owned agents in agents table
  try {
    const { data } = await supabase
      .from("agents")
      .select("id, retell_agent_id")
      .eq("created_by", userId);
    (data || []).forEach((a: any) => {
      if (a.id) agentIds.add(a.id);
      if (a.retell_agent_id) agentIds.add(a.retell_agent_id);
    });
  } catch (e) {}

  // 2. Agents assigned to user's phone numbers
  try {
    const { data } = await supabase
      .from("phone_numbers")
      .select("inbound_agent_id, outbound_agent_id, agent_id")
      .eq("user_id", userId);
    (data || []).forEach((p: any) => {
      if (p.inbound_agent_id) agentIds.add(p.inbound_agent_id);
      if (p.outbound_agent_id) agentIds.add(p.outbound_agent_id);
      if (p.agent_id) agentIds.add(p.agent_id);
    });
  } catch (e) {}

  // 3. User agent access table
  try {
    const { data } = await supabase
      .from("user_agent_access")
      .select("agent_id")
      .eq("user_id", userId);
    (data || []).forEach((a: any) => {
      if (a.agent_id) agentIds.add(a.agent_id);
    });
  } catch (e) {}

  // 4. User assistant assignments table
  try {
    const { data } = await supabase
      .from("user_assistant_assignments")
      .select("assistant_id")
      .eq("user_id", userId);
    (data || []).forEach((a: any) => {
      if (a.assistant_id) agentIds.add(a.assistant_id);
    });
  } catch (e) {}

  // 5. Expand candidate IDs via agents table lookup
  const candidateIds = Array.from(agentIds);
  if (candidateIds.length > 0) {
    try {
      const { data: allAgents } = await supabase
        .from("agents")
        .select("id, retell_agent_id, created_by");

      (allAgents || []).forEach((agent: any) => {
        const isMatch =
          agent.created_by === userId ||
          candidateIds.includes(agent.id) ||
          candidateIds.includes(agent.retell_agent_id);
        if (isMatch) {
          if (agent.id) agentIds.add(agent.id);
          if (agent.retell_agent_id) agentIds.add(agent.retell_agent_id);
        }
      });
    } catch (e) {}
  }

  return Array.from(agentIds);
}
