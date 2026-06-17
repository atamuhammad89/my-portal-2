// src/components/billing/billing-shell.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { SubscriptionExpiryBanner } from "@/components/billing/subscription-expiry-banner";
import { RenewalModal } from "@/components/billing/renewal-modal";
import { useRenewal } from "@/hooks/use-renewal";
import { formatDate } from "@/utils/format";
import { CreditCard, Clock, Calendar, Zap, RefreshCw, History } from "lucide-react";
import { PendingBillsSection } from "@/components/billing/pending-bills-section";

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
  if (status === "cancelled") return "danger";
  if (status === "past_due") return "warning";
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

  const renewal = useRenewal();
  const currentPlanName = data?.subscription?.planName?.toLowerCase();

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

          {/* ── Subscription History ── */}
          {pastSubscriptions.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center gap-2 px-6 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <History className="h-4 w-4 text-[var(--brand-500)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-500)]">
                  Subscription History
                </span>
                <span
                  className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted-text)]"
                >
                  {pastSubscriptions.length} previous {pastSubscriptions.length === 1 ? "record" : "records"}
                </span>
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      {["Plan", "Status", "Started", "Ended", "Minutes Used", "Price"].map((h) => (
                        <th key={h}>
                          {h}
                        </th>
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
              <div className="sm:hidden divide-y" style={{ borderColor: "var(--border-light)" }}>
                {pastSubscriptions.map((sub) => (
                  <div key={sub.id} className="px-5 py-4 space-y-2">
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
            </div>
          )}
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