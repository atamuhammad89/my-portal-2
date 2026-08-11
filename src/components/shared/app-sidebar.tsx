"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Settings, Receipt, X, Building2, Phone, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { LogoutButton } from "@/components/shared/logout-button";
import { useAuthStore } from "@/store/auth-store";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/phone-numbers", label: "Phone Numbers", icon: Phone },
  { href: "/agents",        label: "Voice Agents",  icon: Bot },
  { href: "/call-logs",     label: "Call Logs",      icon: PhoneCall },
  { href: "/billing",       label: "Billing",        icon: Receipt },
  { href: "/settings",      label: "Settings",       icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);

  const { data: invoiceData } = useQuery<{ invoices: any[] }>({
    queryKey: ["sidebar", "unpaid-invoices"],
    queryFn: async () => {
      const res = await apiClient.get<{ invoices: any[] }>("/billing/invoices");
      return res.data;
    },
    staleTime: 30000,
  });

  const unpaidCount = (invoiceData?.invoices ?? []).filter((inv: any) => inv.status !== "paid").length;

  const isReseller = user?.role === "reseller";

  const activeNavItems = isReseller
    ? [
        { href: "/reseller", label: "Dashboard", icon: LayoutDashboard },
        { href: "/reseller/customers", label: "Customers", icon: Building2 },
        { href: "/reseller/call-logs", label: "Call Logs", icon: PhoneCall },
      ]
    : navItems;

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
        <div className="flex h-16 items-center justify-between gap-2.5 px-6 border-b border-sidebar-border" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-2.5">
            <CallAutomateLogoIcon className="w-7 h-7 shrink-0" size={28} />
            <span
              className="text-base font-extrabold text-[var(--sidebar-text-hover)] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Call<span className="text-[var(--brand-500)]">Automate</span>
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-sidebar-text hover:bg-sidebar-hover-bg hover:text-sidebar-text-hover lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-text)" }}>
            Menu
          </p>
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            // Normalize paths to ignore trailing slashes
            const normalizePath = (p: string) => p.replace(/\/$/, "") || "/";
            const normPath = normalizePath(pathname);
            const normHref = normalizePath(item.href);

            // Active if exact match or if it's the most specific (longest matching) parent route
            const active = normPath === normHref || (
              normPath.startsWith(normHref + "/") &&
              !activeNavItems.some((otherItem) => {
                const otherHref = normalizePath(otherItem.href);
                return otherHref !== normHref &&
                  otherHref.length > normHref.length &&
                  (normPath === otherHref || normPath.startsWith(otherHref + "/"));
              })
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)} // Close sidebar on link click (mobile)
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 relative group",
                  active
                    ? "text-sidebar-active"
                    : "text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-hover-bg"
                )}
                style={active
                  ? { background: "var(--sidebar-active-bg)" }
                  : {}
                }
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-sidebar-active" : "text-sidebar-text group-hover:text-sidebar-text-hover")} />
                <span>{item.label}</span>
                {item.href === "/billing" && unpaidCount > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
                    {unpaidCount}
                  </span>
                ) : active ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" style={{ boxShadow: "0 0 6px var(--brand-500)" }} />
                ) : null}
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
            <CallAutomateLogoIcon className="w-6 h-6 shrink-0" size={24} />
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
