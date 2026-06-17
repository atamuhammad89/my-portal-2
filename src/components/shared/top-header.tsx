"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
        background: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--header-shadow)"
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
        <ThemeToggle />

        {/* User profile with avatar */}
        {user && (
          <div className="flex items-center gap-2 px-1.5 py-1 rounded-xl transition hover:bg-[var(--surface-2)]">
            <div className="h-8.5 w-8.5 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--brand-100)] flex items-center justify-center text-xs font-bold text-[var(--brand-500)] shadow-sm">
              {initials}
            </div>
            <div className="hidden flex-col md:flex text-left">
              <span className="text-xs font-bold text-[var(--foreground)] leading-tight">
                {user.fullName ?? user.email}
              </span>
              <span className="text-[10px] font-semibold text-[var(--muted-text)] uppercase tracking-wider">
                Customer
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
