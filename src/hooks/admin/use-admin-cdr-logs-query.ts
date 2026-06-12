import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminCdrLogsService } from "@/services/admin/adminCdrLogsService";
import { AdminCdrLog, AdminCdrCustomer, AdminCdrLogsParams } from "@/types/admin/cdr-log";

// Re-export types so consumers can import from here if they prefer
export type { AdminCdrLog, AdminCdrCustomer, AdminCdrLogsParams };

export function useAdminCdrLogsQuery(params: AdminCdrLogsParams) {
  return useQuery({
    queryKey: ["admin", "cdr-logs", params],
    queryFn: () => adminCdrLogsService.getCdrLogs(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
