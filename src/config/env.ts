// const readEnv = (key: string, fallback?: string) => {
//   const value = process.env[key];
//   console.log(`[env] ${key} =`, value ?? "undefined");
//   if (value && value.trim().length > 0) return value;
//   if (fallback !== undefined) return fallback;
//   throw new Error(`Missing required env variable: ${key}`);
// };

// export const env = {
//   apiBaseUrl: readEnv("NEXT_PUBLIC_API_BASE_URL",""),
//   apiTimeoutMs: Number(readEnv("NEXT_PUBLIC_API_TIMEOUT_MS", "10000")),
//   enableMockFallback: readEnv("NEXT_PUBLIC_ENABLE_MOCK_FALLBACK", "true") === "true",
//   tenantHeaderKey: readEnv("NEXT_PUBLIC_TENANT_HEADER_KEY", "x-tenant-id"),
//   tenantId: readEnv("NEXT_PUBLIC_TENANT_ID", "demo-tenant"),
//   authTokenStorageKey: readEnv("NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY", "access_token"),
//   authCookieName: readEnv("NEXT_PUBLIC_AUTH_COOKIE_NAME", "voiceos_auth_token"),
//   authSessionDurationHours: Number(readEnv("NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS", "8"))
// };

const readEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env variable: ${key}`);
};

export const env = {
  get apiBaseUrl() { return readEnv("NEXT_PUBLIC_API_BASE_URL", "/api"); },
  get apiTimeoutMs() { return Number(readEnv("NEXT_PUBLIC_API_TIMEOUT_MS", "10000")); },
  get enableMockFallback() { return readEnv("NEXT_PUBLIC_ENABLE_MOCK_FALLBACK", "true") === "true"; },
  get tenantHeaderKey() { return readEnv("NEXT_PUBLIC_TENANT_HEADER_KEY", "x-tenant-id"); },
  get tenantId() { return readEnv("NEXT_PUBLIC_TENANT_ID", "demo-tenant"); },
  get authTokenStorageKey() { return readEnv("NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY", "access_token"); },
  get authCookieName() { return readEnv("NEXT_PUBLIC_AUTH_COOKIE_NAME", "voiceos_auth_token"); },
  get authSessionDurationHours() { return Number(readEnv("NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS", "8")); },
};