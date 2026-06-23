"use client";

import { useState } from "react";
import { Search, Download, FileText, Users, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
import { downloadInvoicePdf, InvoiceData } from "@/utils/download-invoice-pdf";

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
  const [viewMode, setViewMode] = useState<"users" | "invoices">("users");

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ invoices: any[] }>({
    queryKey: ["admin", "billing", "invoices"],
    queryFn: async () => {
      const res = await apiClient.get<{ invoices: any[] }>("/admin/billing/invoices");
      return res.data;
    },
    enabled: viewMode === "invoices",
  });

  const handleDownloadInvoice = async (inv: any) => {
    try {
      const invoiceData: InvoiceData = {
        invoiceId: inv.id,
        userName: inv.users?.full_name ?? inv.billing_name,
        userEmail: inv.users?.email ?? inv.billing_email,
        userId: inv.user_id,
        planName: inv.plan_name,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        amount: parseFloat(inv.amount),
        type: inv.type,
        invoiceNumber: inv.invoice_number,
        generatedAt: inv.created_at,
      };
      await downloadInvoicePdf(invoiceData);
    } catch (err) {
      console.error("Failed to download PDF", err);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = (invoicesData?.invoices ?? []).filter((inv: any) => {
    const searchLower = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(searchLower) ||
      inv.plan_name.toLowerCase().includes(searchLower) ||
      (inv.users?.full_name ?? inv.billing_name).toLowerCase().includes(searchLower) ||
      (inv.users?.email ?? inv.billing_email).toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminPermissionGuard allow={["billing"]}>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Subscription and billing overview for all customers."
        />

        {/* ── Pending overage bills ── */}
        <AdminPendingBillsSection />

        {/* Toggle View Buttons + Search */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 max-w-sm">
            <button
              onClick={() => { setViewMode("users"); setSearch(""); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "users"
                  ? "bg-[var(--surface-2)] text-[var(--brand-500)] shadow-sm"
                  : "text-[var(--muted-text)] hover:text-[var(--foreground)]"
              }`}
            >
              <Users className="h-4 w-4" />
              Customers
            </button>
            <button
              onClick={() => { setViewMode("invoices"); setSearch(""); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "invoices"
                  ? "bg-[var(--surface-2)] text-[var(--brand-500)] shadow-sm"
                  : "text-[var(--muted-text)] hover:text-[var(--foreground)]"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Invoices
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={viewMode === "users" ? "Search by name or email…" : "Search invoices…"}
              className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Dynamic View Body */}
        {viewMode === "users" ? (
          isLoading ? (
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
          )
        ) : (
          invoicesLoading ? (
            <LoadingSkeleton className="h-96 w-full" />
          ) : !invoicesData?.invoices || filteredInvoices.length === 0 ? (
            <EmptyState title="No invoices found" message="Try adjusting your search or backfilling invoices." />
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      {["Invoice Number", "Customer Name", "Customer Email", "Plan Name", "Type", "Billing Period", "Amount", "Status", "Actions"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-mono text-xs font-semibold text-[var(--foreground)]">{inv.invoice_number}</td>
                        <td className="font-semibold text-[var(--foreground)]">{inv.users?.full_name ?? inv.billing_name}</td>
                        <td className="text-xs">{inv.users?.email ?? inv.billing_email}</td>
                        <td className="font-semibold text-[var(--foreground)]">{inv.plan_name}</td>
                        <td className="capitalize text-xs text-[var(--subtle-text)]">{inv.type}</td>
                        <td className="text-xs">
                          {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                        </td>
                        <td className="font-semibold text-[var(--foreground)]">${parseFloat(inv.amount).toFixed(2)}</td>
                        <td>
                          <StatusBadge text={inv.status} variant="success" />
                        </td>
                        <td>
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand-500)] px-2.5 py-1 text-xs font-bold transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </AdminPermissionGuard>
  );
}