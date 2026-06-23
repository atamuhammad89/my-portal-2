import { create } from "zustand";
import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";
import {
  PersistedAuthSession,
  clearAuthSession,
  getDefaultSessionExpiry,
  persistAuthSession,
  readPersistedAuthSession
} from "@/utils/auth-session";

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  tenant: Tenant | null;
  expiresAt: number | null;
  hydrated: boolean;
  setSession: (session: {
    user: User;
    tenant?: Tenant;
    expiresAt?: number;
  }) => void;
  hydrateFromStorage: () => void;
  clearSession: () => void;
  isSessionExpired: () => boolean;
};

function toPersistedSession(state: AuthState): PersistedAuthSession | null {
  if (!state.isAuthenticated || !state.user || !state.expiresAt) {
    return null;
  }
  return {
    user: state.user,
    tenant: state.tenant ?? undefined,
    expiresAt: state.expiresAt
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  tenant: null,
  expiresAt: null,
  hydrated: false,
  setSession: ({ user, tenant, expiresAt }) => {
    const nextExpiresAt = expiresAt ?? getDefaultSessionExpiry();
    set({
      isAuthenticated: true,
      user,
      tenant: tenant ?? null,
      expiresAt: nextExpiresAt,
      hydrated: true
    });
    const persisted = toPersistedSession(get());
    if (persisted) {
      persistAuthSession(persisted);
    }
  },
  hydrateFromStorage: () => {
    const session = readPersistedAuthSession();
    if (!session) {
      set({ hydrated: true, isAuthenticated: false });
      return;
    }
    set({
      isAuthenticated: true,
      user: session.user,
      tenant: session.tenant ?? null,
      expiresAt: session.expiresAt,
      hydrated: true
    });
  },
  clearSession: () => {
    clearAuthSession();
    set({
      isAuthenticated: false,
      user: null,
      tenant: null,
      expiresAt: null,
      hydrated: true
    });
  },
  isSessionExpired: () => {
    const expiresAt = get().expiresAt;
    if (!expiresAt) {
      return true;
    }
    return Date.now() >= expiresAt;
  }
}));
