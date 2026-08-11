import { apiClient } from "@/lib/api-client";
import { RetellAgent, CreateRetellAgentPayload, CallLog, CallLogsOverview } from "@/types/retell";

export type AdminAgentsListParams = {
  page?: number;
  limit?: number;
};

export const adminRetellAgentsService = {
  // ── Agents ──────────────────────────────────────────────────────────────────
  async getAgents(): Promise<RetellAgent[]> {
    const res = await apiClient.get<RetellAgent[]>("/admin/agents");
    return res.data;
  },

  async getAgentById(agentId: string): Promise<RetellAgent> {
    const res = await apiClient.get<RetellAgent>(`/admin/agents/${agentId}`);
    return res.data;
  },

  async createAgent(payload: CreateRetellAgentPayload): Promise<RetellAgent> {
    const res = await apiClient.post<RetellAgent>("/admin/agents", payload);
    return res.data;
  },

  async updateAgent(agentId: string, payload: Partial<CreateRetellAgentPayload>): Promise<RetellAgent> {
    const res = await apiClient.patch<RetellAgent>(`/admin/agents/${agentId}`, payload);
    return res.data;
  },

  async deleteAgent(agentId: string): Promise<void> {
    await apiClient.delete(`/admin/agents/${agentId}`);
  },

  async publishAgent(agentId: string): Promise<{ agent_id: string; version: number; published_at: number }> {
    const res = await apiClient.post<{ agent_id: string; version: number; published_at: number }>(
      `/admin/agents/${agentId}/publish`
    );
    return res.data;
  },

  // ── Access Management ────────────────────────────────────────────────────────
  async getAgentAccess(agentId: string) {
    const res = await apiClient.get(`/admin/agents/${agentId}/access`);
    return res.data;
  },

  async grantAccess(agentId: string, userIds: string[]): Promise<void> {
    await apiClient.post(`/admin/agents/${agentId}/access`, { user_ids: userIds });
  },

  async revokeAccess(agentId: string, userIds: string[]): Promise<void> {
    await apiClient.delete(`/admin/agents/${agentId}/access`, { data: { user_ids: userIds } });
  },

  // ── Call Logs ────────────────────────────────────────────────────────────────
  async getCallLogs(params?: {
    agent_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: CallLog[]; total: number }> {
    const res = await apiClient.get<{ data: CallLog[]; total: number }>("/admin/call-logs", { params });
    return res.data;
  },

  // ── Analytics ────────────────────────────────────────────────────────────────
  async getAnalytics(): Promise<CallLogsOverview> {
    const res = await apiClient.get<CallLogsOverview>("/admin/agents/analytics");
    return res.data;
  },
};
