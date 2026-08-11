import { apiClient } from "@/lib/api-client";
import {
  RetellTestDefinitionResponse,
  CreateTestDefinitionDto,
  RunBatchTestDto,
  BatchTestResultResponse,
} from "@/types/retell";

export const adminRetellTestsService = {
  async getTests(): Promise<RetellTestDefinitionResponse[]> {
    const res = await apiClient.get<RetellTestDefinitionResponse[]>("/admin/tests");
    return res.data;
  },

  async getTestById(testId: string): Promise<RetellTestDefinitionResponse> {
    const res = await apiClient.get<RetellTestDefinitionResponse>(`/admin/tests/${testId}`);
    return res.data;
  },

  async createTestDefinition(payload: CreateTestDefinitionDto): Promise<RetellTestDefinitionResponse> {
    const res = await apiClient.post<RetellTestDefinitionResponse>("/admin/tests", payload);
    return res.data;
  },

  async runBatchTests(payload: RunBatchTestDto): Promise<BatchTestResultResponse> {
    const res = await apiClient.post<BatchTestResultResponse>("/admin/tests", payload);
    return res.data;
  },
};
