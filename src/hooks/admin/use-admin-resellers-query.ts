import { useQuery } from "@tanstack/react-query";
import { adminResellersService } from "@/services/admin/adminResellersService";

export function useAdminResellersQuery() {
  return useQuery({
    queryKey: ["admin", "resellers"],
    queryFn: () => adminResellersService.getResellers(),
  });
}
