import { apiClient } from "@/lib/api-client";
import {
  RetellKnowledgeBaseResponse,
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AttachKbDto,
  SearchKbDto,
} from "@/types/retell";

export const adminRetellKnowledgeBaseService = {
  async getKnowledgeBases(): Promise<RetellKnowledgeBaseResponse[]> {
    const res = await apiClient.get<RetellKnowledgeBaseResponse[]>("/admin/knowledge-base");
    return res.data;
  },

  async getKnowledgeBaseById(kbId: string): Promise<RetellKnowledgeBaseResponse> {
    const res = await apiClient.get<RetellKnowledgeBaseResponse>(`/admin/knowledge-base/${kbId}`);
    return res.data;
  },

  async createKnowledgeBase(payload: CreateKnowledgeBaseDto): Promise<RetellKnowledgeBaseResponse> {
    const res = await apiClient.post<RetellKnowledgeBaseResponse>("/admin/knowledge-base", payload);
    return res.data;
  },

  async updateKnowledgeBase(kbId: string, payload: UpdateKnowledgeBaseDto): Promise<RetellKnowledgeBaseResponse> {
    const res = await apiClient.patch<RetellKnowledgeBaseResponse>(`/admin/knowledge-base/${kbId}`, payload);
    return res.data;
  },

  async deleteKnowledgeBase(kbId: string): Promise<void> {
    await apiClient.delete(`/admin/knowledge-base/${kbId}`);
  },

  async attachKnowledgeBase(payload: AttachKbDto): Promise<any> {
    const res = await apiClient.post("/admin/knowledge-base/attach", payload);
    return res.data;
  },

  async detachKnowledgeBase(payload: AttachKbDto): Promise<any> {
    const res = await apiClient.post("/admin/knowledge-base/detach", payload);
    return res.data;
  },

  async searchKnowledgeBase(kbId: string, query: string): Promise<{ results: string[] }> {
    const res = await apiClient.post<{ results: string[] }>("/admin/knowledge-base/search", {
      knowledge_base_id: kbId,
      query,
    });
    return res.data;
  },
};
