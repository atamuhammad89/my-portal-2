import { apiClient } from "@/lib/api-client";
import { RetellLlmResponse, CreateLlmDto, UpdateLlmDto } from "@/types/retell";

export const adminRetellLlmsService = {
  async getLlms(): Promise<RetellLlmResponse[]> {
    const res = await apiClient.get<RetellLlmResponse[]>("/admin/llms");
    return res.data;
  },

  async getLlmById(llmId: string): Promise<RetellLlmResponse> {
    const res = await apiClient.get<RetellLlmResponse>(`/admin/llms/${llmId}`);
    return res.data;
  },

  async createLlm(payload: CreateLlmDto): Promise<RetellLlmResponse> {
    const res = await apiClient.post<RetellLlmResponse>("/admin/llms", payload);
    return res.data;
  },

  async updateLlm(llmId: string, payload: UpdateLlmDto): Promise<RetellLlmResponse> {
    const res = await apiClient.patch<RetellLlmResponse>(`/admin/llms/${llmId}`, payload);
    return res.data;
  },

  async deleteLlm(llmId: string): Promise<void> {
    await apiClient.delete(`/admin/llms/${llmId}`);
  },
};
