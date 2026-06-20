import { useQuery } from "@tanstack/react-query";
import { resellerService, ResellerCallLogsParams } from "@/services/resellerService";

export function useResellerOverviewQuery() {
  return useQuery({
    queryKey: ["reseller", "overview"],
    queryFn: () => resellerService.getOverview(),
  });
}

export function useResellerCustomersQuery() {
  return useQuery({
    queryKey: ["reseller", "customers"],
    queryFn: () => resellerService.getCustomers(),
  });
}

export function useResellerCallLogsQuery(params: ResellerCallLogsParams) {
  return useQuery({
    queryKey: ["reseller", "call-logs", params],
    queryFn: () => resellerService.getCallLogs(params),
  });
}
