"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Settings, Receipt, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/call-logs", label: "Call Logs",   icon: PhoneCall },
  { href: "/billing",   label: "Billing",     icon: Receipt },
  { href: "/settings",  label: "Settings",    icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:flex shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--sidebar-bg)", minHeight: "100vh", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo and Mobile Close */}
        <div className="flex h-16 items-center justify-between gap-2.5 px-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold border border-brand-cyan/35"
              style={{ background: "rgba(0, 240, 255, 0.1)", boxShadow: "0 0 10px rgba(0, 240, 255, 0.15)" }}
            >
              V
            </div>
            <span
              className="text-base font-bold text-white tracking-wider uppercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Voice<span className="text-[var(--brand-500)]">OS</span>
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--subtle-text)" }}>
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)} // Close sidebar on link click (mobile)
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 relative group",
                  active
                    ? "text-[var(--brand-500)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                style={active
                  ? { background: "var(--sidebar-active-bg)", borderLeft: "2px solid var(--brand-500)", borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px" }
                  : {}
                }
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-[var(--brand-500)]" : "text-slate-400 group-hover:text-white")} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" style={{ boxShadow: "0 0 6px var(--brand-500)" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer brand */}
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-xs" style={{ color: "var(--subtle-text)" }}>
            Powered by{" "}
            <span className="font-semibold" style={{ color: "var(--muted-text)" }}>
              CallAutomate
            </span>
          </p>
        </div>
      </aside>
    </>
  );
}
