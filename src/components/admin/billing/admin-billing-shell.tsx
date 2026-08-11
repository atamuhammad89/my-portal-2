"use client";

import { useState } from "react";
import { Search, Download, FileText, Users, Receipt, Mail, Loader2, Filter, Calendar } from "lucide-react";
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
import { ToastNotification, ToastMessage } from "@/components/shared/toast-notification";

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

  const [sendingAlertUserId, setSendingAlertUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleSendEmailAlert = async (userId: string, email: string) => {
    setSendingAlertUserId(userId);
    try {
      await apiClient.post("/billing/send-unpaid-alert", { userId });
      setToast({
        id: Date.now().toString(),
        type: "success",
        title: "Email Alert Sent",
        message: `Urgent unpaid bill notification sent to ${email}`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Email Alert Failed",
        message: err.message || "Could not dispatch email alert.",
      });
    } finally {
      setSendingAlertUserId(null);
    }
  };

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

  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7days" | "30days" | "this_month" | "last_month">("all");

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = (invoicesData?.invoices ?? []).filter((inv: any) => {
    // 1. Text Search Filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchLower) ||
      inv.plan_name.toLowerCase().includes(searchLower) ||
      (inv.users?.full_name ?? inv.billing_name ?? "").toLowerCase().includes(searchLower) ||
      (inv.users?.email ?? inv.billing_email ?? "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Paid / Unpaid Status Filter
    if (statusFilter === "paid" && inv.status !== "paid") return false;
    if (statusFilter === "unpaid" && inv.status === "paid") return false;

    // 3. Date / Month / Days Filter
    if (dateFilter !== "all") {
      const invDate = new Date(inv.created_at || inv.period_start || Date.now());
      const now = new Date();

      if (dateFilter === "7days") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (invDate < sevenDaysAgo) return false;
      } else if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (invDate < thirtyDaysAgo) return false;
      } else if (dateFilter === "this_month") {
        if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (dateFilter === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (
          invDate.getMonth() !== lastMonth.getMonth() ||
          invDate.getFullYear() !== lastMonth.getFullYear()
        ) {
          return false;
        }
      }
    }

    return true;
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

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter (Paid / Unpaid) */}
            {viewMode === "invoices" && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="rounded-xl border pl-8 pr-8 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 appearance-none cursor-pointer"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid Only</option>
                  <option value="unpaid">Unpaid Only</option>
                </select>
              </div>
            )}

            {/* Date / Month / Days Filter */}
            {viewMode === "invoices" && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={dateFilter}
                  onChange={(e: any) => setDateFilter(e.target.value)}
                  className="rounded-xl border pl-8 pr-8 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 appearance-none cursor-pointer"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={viewMode === "users" ? "Search by name or email…" : "Search invoices…"}
                className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
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
              className="rounded-2xl border overflow-hidden shadow-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b bg-[var(--surface-2)]/60 text-[11px] font-black uppercase tracking-wider text-[var(--muted-text)]" style={{ borderColor: "var(--border)" }}>
                      <th className="py-3.5 px-4 whitespace-nowrap">Invoice #</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Customer</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Item / Plan</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Type</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Billing Period</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-xs">
                    {filteredInvoices.map((inv) => {
                      const customerName = inv.users?.full_name ?? inv.billing_name ?? "Customer";
                      const customerEmail = inv.users?.email ?? inv.billing_email ?? "";
                      const formattedStart = inv.period_start
                        ? new Date(inv.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—";
                      const formattedEnd = inv.period_end
                        ? new Date(inv.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "";
                      const cleanType = (inv.type || "phone_number").replace(/_/g, " ");

                      return (
                        <tr key={inv.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                          {/* Invoice Number */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-[var(--brand-500)] bg-[var(--brand-500)]/10 px-2.5 py-1 rounded-lg border border-[var(--brand-500)]/20">
                              {inv.invoice_number}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-4">
                            <div className="min-w-[140px]">
                              <p className="font-bold text-sm text-[var(--foreground)] truncate">{customerName}</p>
                              <p className="text-[11px] text-[var(--muted-text)] truncate">{customerEmail}</p>
                            </div>
                          </td>

                          {/* Item / Plan */}
                          <td className="py-4 px-4">
                            <p className="font-bold text-xs text-[var(--foreground)] truncate max-w-[220px]">{inv.plan_name}</p>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {cleanType}
                            </span>
                          </td>

                          {/* Billing Period */}
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-[var(--muted-text)]">
                            {formattedStart} {formattedEnd ? `→ ${formattedEnd}` : ""}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-sm font-extrabold text-[var(--foreground)]">
                              ${parseFloat(inv.amount || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <StatusBadge
                              text={inv.status === "paid" ? "Paid" : inv.status === "pending" ? "Unpaid" : inv.status}
                              variant={inv.status === "paid" ? "success" : inv.status === "pending" ? "warning" : "neutral"}
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadInvoice(inv)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-3 py-1.5 text-xs font-bold transition-all hover:border-[var(--brand-500)] hover:text-[var(--brand-500)] cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </button>
                              {inv.status !== "paid" && (
                                <button
                                  onClick={() => handleSendEmailAlert(inv.user_id, customerEmail)}
                                  disabled={sendingAlertUserId === inv.user_id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400 px-3 py-1.5 text-xs font-bold transition-all hover:bg-rose-600 hover:text-white disabled:opacity-50 cursor-pointer"
                                >
                                  {sendingAlertUserId === inv.user_id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Mail className="h-3.5 w-3.5" />
                                  )}
                                  <span>Send Alert</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </AdminPermissionGuard>
  );
}