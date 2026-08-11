"use client";

import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useQueryClient } from "@tanstack/react-query";

export function LogoutButton() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    // 1. Clear client-side session (localStorage + voiceos_auth_token cookie)
    clearSession();
    queryClient.clear();

    // 2. Clear the HttpOnly "token" cookie — JS can't touch it directly,
    //    so we ask the server to expire it. Fire-and-forget: even if this
    //    fails the user is effectively logged out client-side.
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // non-critical — proceed regardless
    }

    router.replace("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer hover:shadow-sm"
      style={{
        border: "1px solid var(--danger-border)",
        color: "var(--danger-fg)",
        background: "var(--danger-bg)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--danger-hover-bg)";
        e.currentTarget.style.borderColor = "var(--danger-hover-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--danger-bg)";
        e.currentTarget.style.borderColor = "var(--danger-border)";
      }}
    >
      <Power className="h-3.5 w-3.5" />
      <span>Sign out</span>
    </button>
  );
}