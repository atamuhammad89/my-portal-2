"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Receipt,
  ShieldCheck,
  Bot,
  X,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminRole } from "@/hooks/admin/use-admin-role";
import { AdminNavPermission } from "@/types/admin/roles";
import { useUIStore } from "@/store/ui-store";
import { LogoutButton } from "@/components/shared/logout-button";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission: AdminNavPermission;
};

const adminNavItems: AdminNavItem[] = [
  { href: "/admin/overview",      label: "Overview",      icon: LayoutDashboard, permission: "overview" },
  { href: "/admin/customers",     label: "Customers",     icon: Building2,       permission: "customers" },
  { href: "/admin/call-logs",     label: "Call Logs",     icon: PhoneCall,       permission: "call_logs" },
  { href: "/admin/plans",         label: "Plans",         icon: Layers,          permission: "plans" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard,      permission: "subscriptions" },
  { href: "/admin/billing",       label: "Billing",       icon: Receipt,         permission: "billing" },
  { href: "/admin/agents",        label: "Agent Access",  icon: Bot,             permission: "agents" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAdminRole();
  const adminSidebarOpen = useUIStore((s) => s.adminSidebarOpen);
  const setAdminSidebarOpen = useUIStore((s) => s.setAdminSidebarOpen);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {adminSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          onClick={() => setAdminSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:flex shrink-0",
          adminSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--sidebar-bg)", minHeight: "100vh", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between gap-2.5 px-6 border-b border-sidebar-border" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)"
              }}
            >
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-base font-bold text-[var(--sidebar-text-hover)] tracking-wider uppercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Admin<span className="text-[var(--brand-500)]">Panel</span>
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setAdminSidebarOpen(false)}
            className="rounded-lg p-1 text-sidebar-text hover:bg-sidebar-hover-bg hover:text-sidebar-text-hover lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p
            className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--sidebar-text)" }}
          >
            Management
          </p>
          {adminNavItems
            .filter((item) => hasPermission(item.permission))
            .map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAdminSidebarOpen(false)} // Close sidebar on link click (mobile)
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 relative group",
                    active ? "text-sidebar-active" : "text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-hover-bg"
                  )}
                  style={
                    active
                      ? { background: "var(--sidebar-active-bg)" }
                      : {}
                  }
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-sidebar-active" : "text-sidebar-text group-hover:text-sidebar-text-hover")} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" style={{ boxShadow: "0 0 6px var(--brand-500)" }} />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border relative overflow-hidden" style={{ borderColor: "var(--sidebar-border)" }}>
          {/* Subtle headset/charts SVG background illustration on the bottom corner */}
          <div className="absolute right-0 bottom-0 opacity-[0.06] pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <path d="M20,90 Q50,30 80,90" strokeWidth="4" />
              <circle cx="50" cy="50" r="25" strokeWidth="4" />
              <rect x="40" y="45" width="20" height="30" rx="4" fill="currentColor" />
            </svg>
          </div>

          <div className="mb-4 pb-4 border-b border-sidebar-border relative z-10" style={{ borderColor: "var(--sidebar-border)" }}>
            <LogoutButton />
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-500)] text-white text-xs font-bold shadow-sm">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--sidebar-text)] font-sans">Powered by</p>
              <p className="text-xs font-bold text-[var(--sidebar-text-hover)] truncate font-sans">CallAutomate</p>
            </div>
            <svg className="h-4 w-4 text-[var(--brand-500)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}