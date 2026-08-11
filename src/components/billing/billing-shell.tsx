// src/components/billing/billing-shell.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { SubscriptionExpiryBanner } from "@/components/billing/subscription-expiry-banner";
import { RenewalModal } from "@/components/billing/renewal-modal";
import { useRenewal } from "@/hooks/use-renewal";
import { formatDate } from "@/utils/format";
import { CreditCard, Clock, Calendar, Zap, RefreshCw, History, FileText, Download } from "lucide-react";
import { PendingBillsSection } from "@/components/billing/pending-bills-section";
import { downloadInvoicePdf, InvoiceData } from "@/utils/download-invoice-pdf";

type SubscriptionRecord = {
  id: string;
  status: string;
  planName: string;
  startedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  minutesUsed: number;
  totalMinutes: number | null;
  monthlyPrice: number;
};

type SubscriptionData = {
  subscription: (SubscriptionRecord & {
    pricePerMinute: number;
  }) | null;
  usageMinutes: number;
  history: SubscriptionRecord[];
};

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "expired") return "neutral";
  return "neutral";
}

function UsageBar({ used, total }: { used: number; total: number | null }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const isHigh = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[var(--muted-text)]">
        <span>{used} min used (CDR)</span>
        <span>{total ? `${total} min total` : "Unlimited"}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-rose-500" : "bg-[var(--brand-500)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {total && (
        <p className={`text-xs font-semibold ${isHigh ? "text-rose-400" : "text-[var(--subtle-text)]"}`}>
          {pct}% of plan used
        </p>
      )}
    </div>
  );
}

export function BillingShell() {
  const { data, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionData>("/billing/subscription");
      return res.data;
    },
  });

  const [activeTab, setActiveTab] = useState<"history" | "invoices">("invoices");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<{ invoices: any[] }>({
    queryKey: ["billing", "invoices"],
    queryFn: async () => {
      const res = await apiClient.get<{ invoices: any[] }>("/billing/invoices");
      return res.data;
    },
  });

  const handlePayInvoice = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    try {
      const res = await apiClient.post<{ url: string }>("/billing/checkout-invoice", { invoiceId });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert("Could not generate Stripe Checkout session.");
      }
    } catch (err: any) {
      alert(`Payment error: ${err.message || "Failed to start Stripe checkout."}`);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleDownloadInvoice = async (inv: any) => {
    try {
      const invoiceData: InvoiceData = {
        invoiceId: inv.id,
        userName: inv.billing_name,
        userEmail: inv.billing_email,
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

  const renewal = useRenewal();
  const currentPlanName = data?.subscription?.planName?.toLowerCase();

  // Guard: detect wrong-user renewal attempt from expiry email
  const loggedInUser = useAuthStore((s) => s.user);
  const [wrongUserWarning, setWrongUserWarning] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle Stripe payment success callback
  useEffect(() => {
    const payment = searchParams.get("payment");
    const invId = searchParams.get("invoice_id");
    const sessId = searchParams.get("session_id");

    if (payment === "success" && invId && sessId) {
      apiClient
        .post("/billing/confirm-invoice", { invoiceId: invId, sessionId: sessId })
        .then(() => {
          refetchInvoices();
          router.replace("/billing", { scroll: false });
        })
        .catch((e) => console.warn("Confirm invoice error", e));
    }
  }, [searchParams, router, refetchInvoices]);

  // Auto-open renewal modal when arriving from the expiry notification email
  useEffect(() => {
    if (searchParams.get("renew") === "true") {
      const intendedUid = searchParams.get("uid");

      if (intendedUid && loggedInUser && intendedUid !== loggedInUser.id) {
        setWrongUserWarning(
          `This renewal link belongs to a different account. Please log in with the correct account to renew, or close this message to continue as ${loggedInUser.email}.`
        );
        router.replace("/billing", { scroll: false });
        return;
      }

      renewal.open();
      router.replace("/billing", { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loggedInUser]);

  const unpaidInvoices = (invoicesData?.invoices ?? []).filter((inv: any) => inv.status !== "paid");
  const totalUnpaidAmount = unpaidInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0);

  const [sendingEmailAlert, setSendingEmailAlert] = useState(false);
  const [emailAlertSent, setEmailAlertSent] = useState(false);

  const handleSendEmailAlert = async () => {
    setSendingEmailAlert(true);
    try {
      await apiClient.post("/billing/send-unpaid-alert", {});
      setEmailAlertSent(true);
    } catch (err: any) {
      alert("Could not send email alert: " + (err.message || "Failed"));
    } finally {
      setSendingEmailAlert(false);
    }
  };

  // History rows that are NOT the current active subscription
  const pastSubscriptions = (data?.history ?? []).filter(
    (h) => h.id !== data?.subscription?.id
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="View your current plan, usage, and subscription history."
      />

      {/* ── Red Unpaid Bills Warning Banner ── */}
      {unpaidInvoices.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-500/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-red-600 text-white shrink-0 shadow-md shadow-red-600/30 mt-0.5">
              <CreditCard className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                Action Required: Unpaid Invoice ({unpaidInvoices.length})
              </h3>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 max-w-xl leading-relaxed">
                You have {unpaidInvoices.length} outstanding bill(s) totaling <span className="font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded-md border border-red-300 dark:border-red-800">${totalUnpaidAmount.toFixed(2)}</span>. Complete payment to keep your numbers and voice agents active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handlePayInvoice(unpaidInvoices[0].id)}
              disabled={!!payingInvoiceId}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
            >
              {payingInvoiceId === unpaidInvoices[0].id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              <span>Pay ${totalUnpaidAmount.toFixed(2)} with Stripe</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Wrong-user renewal warning ── */}
      {wrongUserWarning && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            borderColor: "rgba(245, 158, 11, 0.3)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0 mt-0.5 text-amber-400"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-400">Wrong account</p>
            <p className="text-sm text-amber-300/80 mt-0.5">{wrongUserWarning}</p>
          </div>
          <button
            onClick={() => setWrongUserWarning(null)}
            aria-label="Dismiss warning"
            className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message="Could not load billing information." />
      ) : !data?.subscription ? (
        <EmptyState
          title="No active subscription"
          message="You don't have an active subscription. Contact your administrator."
        />
      ) : (
        <>
          {/* ── Expiry / renewal banner ── */}
          <SubscriptionExpiryBanner
            status={data.subscription.status}
            endsAt={data.subscription.endsAt}
            onRenew={renewal.open}
          />

          {/* ── Pending overage bills ── */}
          <PendingBillsSection />

          {/* ── Current subscription cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Plan Card */}
            <div
              className="rounded-2xl p-5 space-y-3 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2 text-[var(--brand-500)]">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Plan</span>
              </div>
              <p className="text-xl font-bold text-[var(--foreground)]">{data.subscription.planName}</p>
              <p className="text-sm text-[var(--muted-text)]">
                ${data.subscription.monthlyPrice.toFixed(2)} / month
              </p>
              <StatusBadge
                text={data.subscription.status}
                variant={statusVariant(data.subscription.status)}
              />
              <button
                onClick={renewal.open}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand-500)] px-3 py-2 text-xs font-bold transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--brand-500)] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Renew / Change Plan
              </button>
            </div>

            {/* Usage Card */}
            <div
              className="rounded-2xl p-5 space-y-3 sm:col-span-2 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2 text-[var(--brand-500)]">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Minutes Usage</span>
              </div>
              <UsageBar
                used={data.usageMinutes}
                total={data.subscription.totalMinutes}
              />
              {data.subscription.pricePerMinute > 0 && (
                <p className="text-xs text-[var(--subtle-text)]">
                  ${data.subscription.pricePerMinute.toFixed(4)} / min overage rate
                </p>
              )}
            </div>

            {/* Dates Card */}
            <div
              className="rounded-2xl p-5 space-y-3 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2 text-[var(--brand-500)]">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Dates</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[var(--subtle-text)]">Started</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDate(data.subscription.startedAt)}
                  </p>
                </div>
                {data.subscription.endsAt && (
                  <div>
                    <p className="text-xs text-[var(--subtle-text)]">Renews / Ends</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {formatDate(data.subscription.endsAt)}
                    </p>
                  </div>
                )}
                {data.subscription.cancelledAt && (
                  <div>
                    <p className="text-xs text-[var(--subtle-text)]">Cancelled</p>
                    <p className="text-sm font-semibold text-rose-400">
                      {formatDate(data.subscription.cancelledAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary row */}
            <div
              className="rounded-2xl p-5 sm:col-span-2 xl:col-span-4 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2 text-[var(--brand-500)] mb-4">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-[var(--subtle-text)]">Plan</p>
                  <p className="font-semibold text-[var(--foreground)]">{data.subscription.planName}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--subtle-text)]">Status</p>
                  <StatusBadge
                    text={data.subscription.status}
                    variant={statusVariant(data.subscription.status)}
                  />
                </div>
                <div>
                  <p className="text-xs text-[var(--subtle-text)]">Minutes Used (CDR)</p>
                  <p className="font-semibold text-[var(--foreground)]">{data.usageMinutes} min</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--subtle-text)]">Plan Minutes</p>
                  <p className="font-semibold text-[var(--foreground)]">
                    {data.subscription.totalMinutes ?? "—"} min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Subscription History & Invoices Tabs ── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-4 px-6 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "invoices"
                    ? "text-[var(--brand-500)] border-b-2 border-[var(--brand-500)]"
                    : "text-[var(--muted-text)] hover:text-[var(--foreground)]"
                }`}
              >
                <FileText className="h-4 w-4" />
                Invoices
              </button>
              
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "text-[var(--brand-500)] border-b-2 border-[var(--brand-500)]"
                    : "text-[var(--muted-text)] hover:text-[var(--foreground)]"
                }`}
              >
                <History className="h-4 w-4" />
                Subscription History
              </button>
            </div>

            {/* Invoices Tab View */}
            {activeTab === "invoices" && (
              <div className="p-4 space-y-4">
                {invoicesLoading ? (
                  <LoadingSkeleton className="h-32 w-full" />
                ) : !invoicesData?.invoices || invoicesData.invoices.length === 0 ? (
                  <EmptyState title="No invoices found" message="You don't have any subscription invoices yet." />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            {["Invoice Number", "Plan Name", "Type", "Billing Period", "Amount", "Status", "Actions"].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {invoicesData.invoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="font-mono text-xs font-semibold text-[var(--foreground)]">{inv.invoice_number}</td>
                              <td className="font-semibold text-[var(--foreground)]">{inv.plan_name}</td>
                              <td className="capitalize text-xs text-[var(--subtle-text)]">{inv.type}</td>
                              <td className="text-xs">
                                {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                              </td>
                              <td className="font-semibold text-[var(--foreground)]">${parseFloat(inv.amount).toFixed(2)}</td>
                              <td>
                                <StatusBadge
                                  text={inv.status === "paid" ? "Paid" : inv.status === "pending" ? "Unpaid" : inv.status}
                                  variant={inv.status === "paid" ? "success" : inv.status === "pending" ? "warning" : "neutral"}
                                />
                              </td>
                              <td>
                                {inv.status === "paid" ? (
                                  <button
                                    onClick={() => handleDownloadInvoice(inv)}
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand-500)] px-2.5 py-1 text-xs font-bold transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Download PDF
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePayInvoice(inv.id)}
                                    disabled={payingInvoiceId === inv.id}
                                    className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] text-[var(--brand-btn-text)] px-3 py-1 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                                  >
                                    {payingInvoiceId === inv.id ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CreditCard className="h-3.5 w-3.5" />
                                    )}
                                    <span>{payingInvoiceId === inv.id ? "Redirecting..." : "Pay Now (Stripe)"}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-[var(--border)]">
                      {invoicesData.invoices.map((inv) => (
                        <div key={inv.id} className="py-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-[var(--foreground)]">{inv.invoice_number}</span>
                            <StatusBadge
                              text={inv.status === "paid" ? "Paid" : inv.status === "pending" ? "Unpaid" : inv.status}
                              variant={inv.status === "paid" ? "success" : inv.status === "pending" ? "warning" : "neutral"}
                            />
                          </div>
                          <div className="text-xs text-[var(--subtle-text)]">
                            <p className="font-semibold text-[var(--foreground)]">{inv.plan_name} ({inv.type})</p>
                            <p>{formatDate(inv.period_start)} → {formatDate(inv.period_end)}</p>
                            <p className="font-bold mt-1 text-[var(--foreground)]">${parseFloat(inv.amount).toFixed(2)}</p>
                          </div>
                          {inv.status === "paid" ? (
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand-500)] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--surface)] cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download PDF
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayInvoice(inv.id)}
                              disabled={payingInvoiceId === inv.id}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-500)] text-[var(--brand-btn-text)] px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              {payingInvoiceId === inv.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CreditCard className="h-3.5 w-3.5" />
                              )}
                              <span>{payingInvoiceId === inv.id ? "Redirecting..." : "Pay Now (Stripe)"}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Subscription History Tab View */}
            {activeTab === "history" && (
              <div className="p-4">
                {pastSubscriptions.length === 0 ? (
                  <EmptyState title="No history found" message="You don't have any subscription history records." />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            {["Plan", "Status", "Started", "Ended", "Minutes Used", "Price"].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pastSubscriptions.map((sub) => (
                            <tr key={sub.id}>
                              <td className="font-semibold text-[var(--foreground)]">{sub.planName}</td>
                              <td>
                                <StatusBadge text={sub.status} variant={statusVariant(sub.status)} />
                              </td>
                              <td>{formatDate(sub.startedAt)}</td>
                              <td>
                                {sub.cancelledAt
                                  ? formatDate(sub.cancelledAt)
                                  : sub.endsAt
                                    ? formatDate(sub.endsAt)
                                    : "—"}
                              </td>
                              <td>
                                {sub.minutesUsed} / {sub.totalMinutes ?? "∞"} min
                              </td>
                              <td>
                                ${sub.monthlyPrice.toFixed(2)}/mo
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-[var(--border)]">
                      {pastSubscriptions.map((sub) => (
                        <div key={sub.id} className="py-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--foreground)]">{sub.planName}</span>
                            <StatusBadge text={sub.status} variant={statusVariant(sub.status)} />
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--subtle-text)]">
                            <span>Started: {formatDate(sub.startedAt)}</span>
                            <span>
                              Ended:{" "}
                              {sub.cancelledAt
                                ? formatDate(sub.cancelledAt)
                                : sub.endsAt
                                  ? formatDate(sub.endsAt)
                                  : "—"}
                            </span>
                            <span>
                              Minutes: {sub.minutesUsed} / {sub.totalMinutes ?? "∞"}
                            </span>
                            <span>${sub.monthlyPrice.toFixed(2)}/mo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Renewal Modal ── */}
      <RenewalModal
        isOpen={renewal.isOpen}
        onClose={renewal.close}
        plans={renewal.plans}
        plansLoading={renewal.plansLoading}
        plansError={renewal.plansError}
        loadingPlanId={renewal.loadingPlanId}
        error={renewal.error}
        onRenew={renewal.handleRenew}
        currentPlanName={currentPlanName}
      />
    </div>
  );
}