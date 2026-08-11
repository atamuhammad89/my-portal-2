import { apiClient } from "@/lib/api-client";
import {
  RetellCallResponse,
  CreatePhoneCallDto,
  CreateBatchCallDto,
  UpdateLiveCallDto,
  StopCallResponse,
} from "@/types/retell";

export const adminRetellCallsService = {
  async getCalls(params?: { agent_id?: string; call_type?: string }): Promise<RetellCallResponse[]> {
    const res = await apiClient.get<RetellCallResponse[]>("/retell/calls", { params });
    return res.data;
  },

  async getCallById(callId: string): Promise<RetellCallResponse> {
    const res = await apiClient.get<RetellCallResponse>(`/retell/calls/${callId}`);
    return res.data;
  },

  async createPhoneCall(payload: CreatePhoneCallDto): Promise<RetellCallResponse> {
    const res = await apiClient.post<RetellCallResponse>("/retell/phone-call", payload);
    return res.data;
  },

  async createBatchCall(payload: CreateBatchCallDto): Promise<{ batch_id: string; total_tasks: number }> {
    const res = await apiClient.post<{ batch_id: string; total_tasks: number }>("/retell/batch-calls", payload);
    return res.data;
  },

  async updateLiveCall(callId: string, payload: UpdateLiveCallDto): Promise<{ success: boolean }> {
    const res = await apiClient.patch<{ success: boolean }>(`/retell/calls/${callId}`, payload);
    return res.data;
  },

  async stopCall(callId: string): Promise<StopCallResponse> {
    const res = await apiClient.post<StopCallResponse>("/retell/calls", { action: "stop", call_id: callId });
    return res.data;
  },
};
