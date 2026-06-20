"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { useAdminBillingQuery } from "@/hooks/admin/use-admin-billing-query";
import { AdminUserBilling } from "@/services/admin/adminBillingService";
import { formatDate } from "@/utils/format";
import { AdminPendingBillsSection } from "@/components/admin/billing/admin-pending-bills-section";

function minutesPercent(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function subStatusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "canceled") return "danger";
  if (status === "past_due") return "warning";
  return "neutral";
}

function BillingCard({ user }: { user: AdminUserBilling }) {
  const sub = user.subscription;
  const pct = sub ? minutesPercent(sub.minutesUsed, sub.totalMinutes) : 0;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[var(--card-hover-shadow)]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--brand-500)",
      }}
    >
      {/* User info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.fullName}</p>
          <p className="text-xs text-[var(--subtle-text)] truncate">{user.email}</p>
          <span className="mt-2 inline-block text-[10px] uppercase tracking-wide font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 rounded px-1.5 py-0.5">
            {user.role}
          </span>
        </div>
        <StatusBadge
          text={user.isActive ? "Active" : "Inactive"}
          variant={user.isActive ? "success" : "neutral"}
        />
      </div>

      {/* CDR Usage — always shown */}
      <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-[var(--border)] bg-[var(--surface-2)]">
        <span className="text-xs font-semibold text-[var(--muted-text)]">CDR Usage (All-time)</span>
        <span className="text-sm font-bold text-brand-cyan">{user.usageMinutes} min</span>
      </div>

      {sub ? (
        <>
          {/* Plan + subscription status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-text)]">Plan</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{sub.planName}</p>
            </div>
            <StatusBadge text={sub.status} variant={subStatusVariant(sub.status)} />
          </div>

          {/* Minutes usage bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--muted-text)]">
              <span>Plan Minutes Used</span>
              <span className="font-semibold text-[var(--muted-text)]">
                {sub.minutesUsed} / {sub.totalMinutes} min ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 90
                    ? "bg-rose-500"
                    : pct >= 70
                    ? "bg-amber-400"
                    : "bg-brand-cyan"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-2 rounded-xl p-3 border border-[var(--border)] bg-[var(--surface-2)]">
            <div>
              <p className="text-xs text-[var(--muted-text)]">Monthly Price</p>
              <p className="text-sm font-bold text-[var(--foreground)]">${sub.monthlyPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-text)]">Per Minute</p>
              <p className="text-sm font-bold text-brand-teal">${sub.pricePerMinute.toFixed(6)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Started: </span>
              {formatDate(sub.startedAt)}
            </div>
            {sub.endsAt && (
              <div>
                <span className="text-slate-500">Ends: </span>
                {formatDate(sub.endsAt)}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl px-4 py-3 text-sm text-slate-400 text-center border border-[var(--border)] bg-[var(--surface-2)]">
          No active subscription
        </div>
      )}
    </div>
  );
}

export function AdminBillingShell() {
  const { data: users = [], isLoading, error } = useAdminBillingQuery();
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPermissionGuard allow={["billing"]}>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Subscription and billing overview for all customers."
        />

        {/* ── Pending overage bills ── */}
        <AdminPendingBillsSection />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-96 w-full" />
        ) : error ? (
          <ErrorState message="Could not load billing data." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers found" message="Try adjusting your search." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((user) => (
              <BillingCard key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
}