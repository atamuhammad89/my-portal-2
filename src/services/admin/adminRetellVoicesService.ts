import { apiClient } from "@/lib/api-client";
import { RetellVoiceResponse, CloneVoiceDto, SearchVoiceDto } from "@/types/retell";

export const adminRetellVoicesService = {
  async getVoices(query?: string): Promise<RetellVoiceResponse[]> {
    const res = await apiClient.get<RetellVoiceResponse[]>("/admin/voices", { params: { query } });
    return res.data;
  },

  async cloneVoice(payload: CloneVoiceDto): Promise<RetellVoiceResponse> {
    const res = await apiClient.post<RetellVoiceResponse>("/admin/voices", payload);
    return res.data;
  },

  async searchVoices(query: SearchVoiceDto): Promise<RetellVoiceResponse[]> {
    const res = await apiClient.get<RetellVoiceResponse[]>("/admin/voices", { params: query });
    return res.data;
  },
};
