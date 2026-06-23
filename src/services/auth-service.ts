import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";
import { clearAuthSession } from "@/utils/auth-session";

export type AuthUser = User;

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
  tenant?: Tenant;
};

/**
 * Calls the Next.js API route POST /api/auth/login.
 * The route verifies the email+password against the Supabase `users` table
 * and returns a signed JWT on success.
 */
export const authService = {
  async login(payload: LoginInput): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Login failed.");
    }

    return data as LoginResponse;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    // User is already persisted in localStorage/Zustand after login.
    return null;
  },

  logout() {
    clearAuthSession();
  },
};
