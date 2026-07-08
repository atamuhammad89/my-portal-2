import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRetellAgentsService } from "@/services/admin/adminRetellAgentsService";
import { CreateRetellAgentPayload } from "@/types/retell";

const keys = {
  agents:       ["admin", "retell-agents"] as const,
  agentById:    (id: string) => ["admin", "retell-agents", id] as const,
  agentAccess:  (id: string) => ["admin", "retell-agents", id, "access"] as const,
  callLogs:     (params?: object) => ["admin", "retell-call-logs", params] as const,
  analytics:    ["admin", "retell-analytics"] as const,
};

// ── Agent List ────────────────────────────────────────────────────────────────
export function useAdminRetellAgentsQuery() {
  return useQuery({
    queryKey: keys.agents,
    queryFn: () => adminRetellAgentsService.getAgents(),
  });
}

// ── Single Agent ──────────────────────────────────────────────────────────────
export function useAdminRetellAgentQuery(agentId: string) {
  return useQuery({
    queryKey: keys.agentById(agentId),
    queryFn: () => adminRetellAgentsService.getAgentById(agentId),
    enabled: Boolean(agentId),
  });
}

// ── Create Agent ──────────────────────────────────────────────────────────────
export function useCreateRetellAgentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRetellAgentPayload) =>
      adminRetellAgentsService.createAgent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.agents });
      qc.invalidateQueries({ queryKey: keys.analytics });
    },
  });
}

// ── Update Agent ──────────────────────────────────────────────────────────────
export function useUpdateRetellAgentMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateRetellAgentPayload>) =>
      adminRetellAgentsService.updateAgent(agentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.agentById(agentId) });
      qc.invalidateQueries({ queryKey: keys.agents });
    },
  });
}

// ── Delete Agent ──────────────────────────────────────────────────────────────
export function useDeleteRetellAgentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => adminRetellAgentsService.deleteAgent(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.agents });
      qc.invalidateQueries({ queryKey: keys.analytics });
    },
  });
}

// ── Agent Access ──────────────────────────────────────────────────────────────
export function useAgentAccessQuery(agentId: string) {
  return useQuery({
    queryKey: keys.agentAccess(agentId),
    queryFn: () => adminRetellAgentsService.getAgentAccess(agentId),
    enabled: Boolean(agentId),
  });
}

export function useGrantAgentAccessMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      adminRetellAgentsService.grantAccess(agentId, userIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.agentAccess(agentId) }),
  });
}

export function useRevokeAgentAccessMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      adminRetellAgentsService.revokeAccess(agentId, userIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.agentAccess(agentId) }),
  });
}

// ── Call Logs ─────────────────────────────────────────────────────────────────
export function useAdminCallLogsQuery(params?: {
  agent_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: keys.callLogs(params),
    queryFn: () => adminRetellAgentsService.getCallLogs(params),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export function useAdminAgentsAnalyticsQuery() {
  return useQuery({
    queryKey: keys.analytics,
    queryFn: () => adminRetellAgentsService.getAnalytics(),
    refetchInterval: 120_000, // auto-refresh every 2 minutes
  });
}

