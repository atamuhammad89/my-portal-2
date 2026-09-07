import { useEffect, useState } from "react";
import { supabase, cdrsSupabase } from "@/lib/supabase";
import { Recording } from "@/types/recording";

import { useAuthStore } from "@/store/auth-store";

export function useRecordingsQuery() {
  const [data, setData] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return; // wait until store is hydrated from storage

    async function fetch() {
      setIsLoading(true);

      if (!user?.id) {
        console.warn("[Auth] No user in store after hydration.");
        setIsLoading(false);
        return;
      }

      // ── Step 1: Resolve all agent IDs assigned to / owned by this user ────────────
      const candidateIds = new Set<string>();

      try {
        const { data: assignments } = await supabase
          .from("user_assistant_assignments")
          .select("assistant_id")
          .eq("user_id", user.id);
        (assignments || []).forEach((a: any) => { if (a.assistant_id) candidateIds.add(a.assistant_id); });
      } catch (e) {}

      try {
        const { data: accessRows } = await supabase
          .from("user_agent_access")
          .select("agent_id")
          .eq("user_id", user.id);
        (accessRows || []).forEach((a: any) => { if (a.agent_id) candidateIds.add(a.agent_id); });
      } catch (e) {}

      try {
        const { data: ownedAgents } = await supabase
          .from("agents")
          .select("id, retell_agent_id")
          .eq("created_by", user.id);
        (ownedAgents || []).forEach((a: any) => {
          if (a.id) candidateIds.add(a.id);
          if (a.retell_agent_id) candidateIds.add(a.retell_agent_id);
        });
      } catch (e) {}

      const finalAgentIds = new Set<string>(candidateIds);
      try {
        const { data: dbAgents } = await supabase
          .from("agents")
          .select("id, retell_agent_id, created_by");

        (dbAgents || []).forEach((agent: any) => {
          if (
            agent.created_by === user.id ||
            candidateIds.has(agent.id) ||
            candidateIds.has(agent.retell_agent_id)
          ) {
            if (agent.id) finalAgentIds.add(agent.id);
            if (agent.retell_agent_id) finalAgentIds.add(agent.retell_agent_id);
          }
        });
      } catch (e) {}

      const assignedIds = Array.from(finalAgentIds);

      if (assignedIds.length === 0) {
        console.warn("[Assignment] No assistant assigned to user:", user.id);
        setData([]);
        setIsLoading(false);
        return;
      }

      console.log("[Assignment] Recordings filtered to assistant_ids:", assignedIds);

      // ── Step 2: Fetch recordings filtered to the assigned assistant_ids ────
      const { data: rows, error: err } = await cdrsSupabase
        .from("cdrs")
        .select(
          "id, call_id, assistant_id, customer_number, total_seconds, start_datetime, call_recording"
        )
        .in("assistant_id", assignedIds)
        .not("call_recording", "is", null)
        .neq("call_recording", "")
        .order("start_datetime", { ascending: false });

      if (err) {
        setError(new Error(err.message));
      } else {
        setData(
          (rows ?? []).map((r) => ({
            id: r.id,
            callId: r.call_id ?? r.id,
            agentName: r.assistant_id ?? "Unknown",
            customerNumber: r.customer_number ?? "—",
            durationSeconds: r.total_seconds ?? 0,
            createdAt: r.start_datetime ?? "",
            audioUrl: r.call_recording,
          }))
        );
      }

      setIsLoading(false);
    }

    fetch();
  }, [hydrated, user]);

  return { data, isLoading, error };
}