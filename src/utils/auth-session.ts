import { env } from "@/config/env";
import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";

const SESSION_EXP_KEY = "auth_expires_at";
const USER_KEY = "auth_user";
const TENANT_KEY = "auth_tenant";

export type PersistedAuthSession = {
  expiresAt: number;
  user: User;
  tenant?: Tenant;
};

export function persistAuthSession(session: PersistedAuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  // Do NOT store the sensitive JWT in localStorage to prevent XSS theft.
  // The JWT token is securely stored in an HttpOnly cookie set by the server.
  window.localStorage.setItem(SESSION_EXP_KEY, String(session.expiresAt));
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));

  if (session.tenant) {
    window.localStorage.setItem(TENANT_KEY, JSON.stringify(session.tenant));
  } else {
    window.localStorage.removeItem(TENANT_KEY);
  }

  const maxAgeSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  const isSecure = window.location.protocol === "https:";
  const secureFlag = isSecure ? "; secure" : "";
  
  // Set the thin non-HttpOnly presence cookie for UI state tracking
  document.cookie = `${env.authCookieName}=1; path=/; max-age=${maxAgeSeconds}; samesite=lax${secureFlag}`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_EXP_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TENANT_KEY);

  // Clear presence cookie
  document.cookie = `${env.authCookieName}=; path=/; max-age=0; samesite=lax`;
  
  // Clean up any remaining legacy voiceos_user_role cookie
  document.cookie = `voiceos_user_role=; path=/; max-age=0; samesite=lax`;
}

export function readPersistedAuthSession(): PersistedAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Check local storage session items

  const expiresAtRaw = window.localStorage.getItem(SESSION_EXP_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);
  const tenantRaw = window.localStorage.getItem(TENANT_KEY);

  if (!expiresAtRaw || !userRaw) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw) as User;
    const tenant = tenantRaw ? (JSON.parse(tenantRaw) as Tenant) : undefined;
    
    return { expiresAt, user, tenant };
  } catch {
    return null;
  }
}

export function getDefaultSessionExpiry() {
  return Date.now() + env.authSessionDurationHours * 60 * 60 * 1000;
}
