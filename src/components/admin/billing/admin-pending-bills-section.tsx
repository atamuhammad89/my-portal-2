// src/components/admin/billing/admin-pending-bills-section.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, CheckCircle2, Clock, Download,
  FileText, Search, TrendingUp, XCircle, AlertCircle, Mail, Loader2,
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { apiClient } from "@/lib/api-client";
import { downloadInvoicePdf } from "@/utils/download-invoice-pdf";
import { ToastNotification, ToastMessage } from "@/components/shared/toast-notification";

function useInvoiceAction(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "mark_paid" | "waive_off") => {
      const res = await apiClient.patch(`/admin/billing/pending-bills/${invoiceId}`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "pending-bills"] });
    },
  });
}


type PendingBill = {
  invoiceId: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "past_due";
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  planName: string;
  invoiceStatus: "pending" | "paid" | "waived";
  periodStart: string;
  periodEnd: string | null;
  allocatedMinutes: number;
  usedMinutes: number;
  overageMinutes: number;
  pricePerMinute: number;
  overageAmount: number;
  monthlyPrice: number;
  generatedAt: string;
};

type PendingBillsResponse = {
  pendingBills: PendingBill[];
};

// ── Invoice Card ──────────────────────────────────────────────────────────────

function InvoiceCard({ bill, onShowToast }: { bill: PendingBill; onShowToast: (toast: ToastMessage) => void }) {
  const { mutate: doAction, isPending } = useInvoiceAction(bill.invoiceId);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendAlert = async () => {
    setSendingEmail(true);
    try {
      await apiClient.post("/billing/send-unpaid-alert", { userId: bill.userId });
      onShowToast({
        id: Date.now().toString(),
        type: "success",
        title: "Email Alert Sent",
        message: `Urgent unpaid bill notification sent to ${bill.userEmail}`,
      });
    } catch (err: any) {
      onShowToast({
        id: Date.now().toString(),
        type: "error",
        title: "Email Alert Failed",
        message: err.message || "Failed to send email alert.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const isActive = bill.subscriptionStatus === "active";
  const usagePct = bill.allocatedMinutes > 0
    ? Math.min(100, Math.round((bill.usedMinutes / bill.allocatedMinutes) * 100))
    : 100;

  const handleDownload = () => {
    downloadInvoicePdf({
      invoiceId: bill.invoiceId,
      userName: bill.userName,
      userEmail: bill.userEmail,
      userRole: bill.userRole,
      userId: bill.userId,
      planName: bill.planName,
      periodStart: bill.periodStart,
      periodEnd: bill.periodEnd,
      allocatedMinutes: bill.allocatedMinutes,
      usedMinutes: bill.usedMinutes,
      overageMinutes: bill.overageMinutes,
      pricePerMinute: bill.pricePerMinute,
      amount: bill.overageAmount,
      type: "overage",
      invoiceNumber: `INV-OV-${bill.invoiceId.slice(-8).toUpperCase()}`,
      generatedAt: bill.generatedAt,
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--surface)",
        border: `1px solid ${isActive ? "rgba(234,179,8,0.25)" : "rgba(239,68,68,0.2)"}`,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: isActive ? "rgba(234,179,8,0.05)" : "rgba(239,68,68,0.04)",
          borderBottom: `1px solid ${isActive ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.12)"}`,
        }}
      >
        {/* Customer info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white uppercase"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            {bill.userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{bill.userName}</p>
            <p className="text-xs text-[var(--muted-text)] truncate">{bill.userEmail}</p>
          </div>
        </div>

        {/* Status + amount */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {isActive ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
              Live
            </span>
          ) : (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-text)]">
              {bill.subscriptionStatus}
            </span>
          )}
          <span className="text-lg font-bold text-rose-500 dark:text-rose-400">
            ${bill.overageAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Plan + period row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--subtle-text)] uppercase tracking-wider font-semibold">Plan</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{bill.planName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--subtle-text)] uppercase tracking-wider font-semibold">Period</p>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              {formatDate(bill.periodStart)}
            </p>
            <p className="text-xs text-[var(--subtle-text)]">
              → {bill.periodEnd ? formatDate(bill.periodEnd) : "present"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--subtle-text)] uppercase tracking-wider font-semibold">Invoice</p>
            <p className="font-mono text-xs text-[var(--muted-text)] mt-0.5">
              #{bill.invoiceId.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-text)]">
              {bill.usedMinutes} <span className="text-[var(--subtle-text)]">/</span> {bill.allocatedMinutes} min used
            </span>
            <span className="font-semibold text-rose-500 dark:text-rose-400">
              +{bill.overageMinutes} min overage
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
            <div
              className="h-full rounded-full bg-rose-500"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--subtle-text)]">
            {bill.overageMinutes} min × ${bill.pricePerMinute.toFixed(4)}/min
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--muted-text)] transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--brand-500)] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>

          {/* Send Alert */}
          <button
            disabled={sendingEmail}
            onClick={handleSendAlert}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Alert
          </button>

          {/* Mark Paid */}
          <button
            disabled={isPending}
            onClick={() => doAction("mark_paid")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white hover:border-emerald-500 disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Paid
          </button>

          {/* Waive Off */}
          <button
            disabled={isPending}
            onClick={() => doAction("waive_off")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--muted-text)] transition-all hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 disabled:opacity-40 cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            Waive
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function AdminPendingBillsSection() {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { data, isLoading, error } = useQuery<PendingBillsResponse>({
    queryKey: ["admin", "billing", "pending-bills"],
    queryFn: async () => {
      const res = await apiClient.get<PendingBillsResponse>("/admin/billing/pending-bills");
      return res.data;
    },
  });

  const allBills = data?.pendingBills ?? [];
  const bills = allBills.filter(
    (b) =>
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.planName.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = bills.reduce((sum, b) => sum + b.overageAmount, 0);
  const activeCount = allBills.filter((b) => b.subscriptionStatus === "active").length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-52 w-full animate-pulse rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (!isLoading && allBills.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* ── Header bar ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-5 py-4"
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        {/* Title + meta */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
            <FileText className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">Pending Overage Bills</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-xs text-rose-600 dark:text-rose-400">
                {allBills.length} invoice{allBills.length !== 1 ? "s" : ""}
              </span>
              {activeCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <TrendingUp className="h-3 w-3" />
                  {activeCount} live overage{activeCount !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                ${totalDue.toFixed(2)} total due
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or plan…"
            className="w-full rounded-xl border pl-9 pr-3 py-2 text-xs text-[var(--foreground)] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          />
        </div>
      </div>

      {/* ── Live overage warning ── */}
      {activeCount > 0 && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs text-amber-400"
          style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)" }}
        >
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>{activeCount}</strong> customer{activeCount !== 1 ? "s have" : " has"} an{" "}
            <strong>active subscription</strong> and {activeCount !== 1 ? "are" : "is"} still exceeding
            their minute limit — overage is accumulating in real-time.
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-rose-400"
             style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="h-4 w-4" />
          Could not load pending bills.
        </div>
      )}

      {/* ── No search results ── */}
      {!error && bills.length === 0 && search && (
        <div className="rounded-xl px-5 py-6 text-center text-sm text-slate-500"
             style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          No invoices match &ldquo;{search}&rdquo;
        </div>
      )}

      {/* ── Invoice cards grid ── */}
      {!error && bills.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bills.map((bill) => (
              <InvoiceCard key={bill.invoiceId} bill={bill} onShowToast={(t) => setToast(t)} />
            ))}
          </div>

          {/* ── Total footer ── */}
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-3.5"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {bills.length} pending invoice{bills.length !== 1 ? "s" : ""}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Due</p>
              <p className="text-xl font-bold text-rose-400">${totalDue.toFixed(2)}</p>
            </div>
          </div>
        </>
      )}

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}