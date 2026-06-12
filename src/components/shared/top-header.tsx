"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/shared/logout-button";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

type TopHeaderProps = { title: string };

export function TopHeader({ title }: TopHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center justify-between px-4 lg:px-6"
      style={{
        background: "rgba(6, 9, 19, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 0 rgba(0,240,255,0.05)"
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg border p-2 text-slate-400 lg:hidden cursor-pointer hover:bg-white/5 transition-colors"
          style={{ borderColor: "var(--border)" }}
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1
          className="text-base font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}
        >
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden md:flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white border border-brand-cyan/20"
              style={{ background: "rgba(0, 240, 255, 0.15)", boxShadow: "0 0 8px rgba(0, 240, 255, 0.1)" }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
              {user.fullName ?? user.email}
            </span>
          </div>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
