import { apiClient } from "@/lib/api-client";
import {
  AdminCdrLogsParams,
  AdminCdrLogsResponse,
} from "@/types/admin/cdr-log";

export const adminCdrLogsService = {
  async getCdrLogs(params?: AdminCdrLogsParams): Promise<AdminCdrLogsResponse> {
    const res = await apiClient.get<AdminCdrLogsResponse>("/admin/call-logs", { params });
    console.log("Fetched CDR logs:", res.data);
    return res.data;
  },
};
