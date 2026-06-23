"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

const protectedPrefixes = ["/dashboard", "/agents", "/call-logs", "/recordings", "/billing", "/settings", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // Never redirect while on any /auth/* page — the register page lands here
    // after Stripe checkout and must not be hijacked by session checks.
    if (pathname.startsWith("/auth/")) {
      return;
    }

    if (isAuthenticated && isSessionExpired()) {
      clearSession();
      router.replace("/auth/login?reason=session_expired");
      return;
    }

    if (!isAuthenticated && isProtectedPath(pathname)) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, clearSession, hydrated, isSessionExpired, pathname, router]);

  return <>{children}</>;
}