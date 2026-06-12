// import axios from "axios";
// import { AxiosError } from "axios";
// import { env } from "@/config/env";
// import { ApiError, ApiErrorPayload } from "@/types/api";
// import { clearAuthSession } from "@/utils/auth-session";

// export const apiClient = axios.create({
//   baseURL: env.apiBaseUrl,
//   timeout: env.apiTimeoutMs
// });

// apiClient.interceptors.request.use((config) => {
//   const nextConfig = { ...config };

//   nextConfig.headers = {
//     ...nextConfig.headers,
//     [env.tenantHeaderKey]: env.tenantId
//   } as typeof nextConfig.headers;

//   if (typeof window !== "undefined") {
//     const token = window.localStorage.getItem(env.authTokenStorageKey);
//     if (token) {
//       nextConfig.headers.Authorization = `Bearer ${token}`;
//     }
//   }

//   return nextConfig;
// });

// apiClient.interceptors.response.use(
//   (response) => response,
//   (error: AxiosError<ApiErrorPayload>) => {
//     const status = error.response?.status;
//     const payload = error.response?.data;
//     const message = payload?.message ?? error.message ?? "Unexpected API error";
//     if (status === 401 && typeof window !== "undefined") {
//       clearAuthSession();
//     }

//     return Promise.reject(
//       new ApiError(message, {
//         status,
//         code: payload?.code
//       })
//     );
//   }
// );

import axios from "axios";
import { AxiosError } from "axios";
import { env } from "@/config/env";
import { ApiError, ApiErrorPayload } from "@/types/api";
import { clearAuthSession } from "@/utils/auth-session";

export const apiClient = axios.create({
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const nextConfig = { ...config };

  // Set baseURL lazily so env is read at request time, not module load time
  if (!nextConfig.baseURL) {
    nextConfig.baseURL = env.apiBaseUrl;
  }

  nextConfig.headers = {
    ...nextConfig.headers,
    [env.tenantHeaderKey]: env.tenantId,
  } as typeof nextConfig.headers;

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(env.authTokenStorageKey);
    if (token) {
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }
  }

  return nextConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message ?? error.message ?? "Unexpected API error";
    if (status === 401 && typeof window !== "undefined") {
      clearAuthSession();
    }
    return Promise.reject(
      new ApiError(message, { status, code: payload?.code })
    );
  }
);