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
        <div className="flex h-16 items-center justify-between gap-2.5 px-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold border border-brand-cyan/35 flex-shrink-0"
              style={{ background: "rgba(0, 240, 255, 0.1)", boxShadow: "0 0 10px rgba(0, 240, 255, 0.15)" }}
            >
              <ShieldCheck className="h-4 w-4 text-[var(--brand-500)]" />
            </div>
            <span
              className="text-base font-bold text-white tracking-wider uppercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Admin<span className="text-[var(--brand-500)]">Panel</span>
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setAdminSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p
            className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--subtle-text)" }}
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
                    active ? "text-[var(--brand-500)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                  style={
                    active
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