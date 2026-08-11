import { apiClient } from "@/lib/api-client";
import { RetellCallAnalysisResponse, RetellConcurrencyStatusResponse } from "@/types/retell";

export const adminRetellAnalyticsService = {
  async getCallAnalysis(callId: string): Promise<RetellCallAnalysisResponse> {
    const res = await apiClient.get<RetellCallAnalysisResponse>("/admin/analytics", {
      params: { call_id: callId },
    });
    return res.data;
  },

  async rerunAnalysis(callId: string): Promise<RetellCallAnalysisResponse> {
    const res = await apiClient.post<RetellCallAnalysisResponse>("/admin/analytics", { call_id: callId });
    return res.data;
  },

  async getConcurrencyStatus(): Promise<RetellConcurrencyStatusResponse> {
    const res = await apiClient.get<RetellConcurrencyStatusResponse>("/admin/analytics/concurrency");
    return res.data;
  },
};
