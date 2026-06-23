import { useEffect, useState } from "react";
import { CallLog } from "@/types/call-log";
import { useAuthStore } from "@/store/auth-store";
import { env } from "@/config/env";

/**
 * Fetches the customer's call logs via /api/call-logs.
 *
 * The API route runs server-side with the service-role Supabase key (bypassing
 * RLS), fetches the user's full subscription history, and returns ONLY the CDR
 * rows whose start_datetime falls within at least one subscription period.
 *
 * Auth is passed via the JWT in localStorage → Authorization header, which
 * the API route verifies with verifyRequestJwt().
 */
export function useCallLogsQuery() {
  const [data, setData] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user     = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    async function fetchCallLogs() {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        console.warn("[call-logs] No user in store after hydration.");
        setData([]);
        setIsLoading(false);
        return;
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };


        const res = await fetch("/api/call-logs", { headers });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }

        const rows: CallLog[] = await res.json();
        setData(rows);
      } catch (err: any) {
        console.error("[call-logs] fetch error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCallLogs();
  }, [hydrated, user]);

  return { data, isLoading, error };
}
