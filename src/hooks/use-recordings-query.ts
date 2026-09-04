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

      // ── Step 1: Resolve the assistant_id assigned to this user ────────────
      const { data: assignmentRow, error: assignmentError } = await supabase
        .from("user_assistant_assignments")
        .select("assistant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (assignmentError) {
        console.error("[Assignment] Error fetching assignment:", assignmentError);
        setError(new Error(assignmentError.message));
        setIsLoading(false);
        return;
      }

      if (!assignmentRow?.assistant_id) {
        console.warn("[Assignment] No assistant assigned to user:", user.id);
        setData([]);
        setIsLoading(false);
        return;
      }

      const assignedAssistantId = assignmentRow.assistant_id;
      console.log("[Assignment] Recordings filtered to assistant_id:", assignedAssistantId);

      // ── Step 2: Fetch recordings filtered to the assigned assistant_id ────
      const { data: rows, error: err } = await cdrsSupabase
        .from("cdrs")
        .select(
          "id, call_id, assistant_id, customer_number, total_seconds, start_datetime, call_recording"
        )
        .eq("assistant_id", assignedAssistantId)
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