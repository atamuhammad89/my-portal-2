import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { authService, LoginInput } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

export function useLogin() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginInput) => authService.login(payload),
    onSuccess: (response) => {
      setSession({
        user: response.user,
        tenant: response.tenant,
        expiresAt: response.expiresAt
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
  });
}
