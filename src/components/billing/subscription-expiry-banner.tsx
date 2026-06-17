// src/components/billing/subscription-expiry-banner.tsx
"use client";

import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";

type SubscriptionExpiryBannerProps = {
  status: string;
  endsAt: string | null;
  onRenew: () => void;
};

function getDaysUntilExpiry(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SubscriptionExpiryBanner({
  status,
  endsAt,
  onRenew,
}: SubscriptionExpiryBannerProps) {
  const daysLeft = getDaysUntilExpiry(endsAt);

  // Show "expired" banner when status is cancelled / past_due or days <= 0
  const isExpired =
    status === "cancelled" ||
    status === "past_due" ||
    (daysLeft !== null && daysLeft <= 0);

  // Show "expiring soon" banner when 3 or fewer days remain (and not already expired)
  const isExpiringSoon =
    !isExpired && daysLeft !== null && daysLeft <= 3 && daysLeft > 0;

  if (!isExpired && !isExpiringSoon) return null;

  if (isExpired) {
    return (
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl px-5 py-4 border"
        style={{
          background: "var(--danger-bg)",
          borderColor: "rgba(244, 63, 94, 0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--danger-bg)]"
          >
            <XCircle className="h-5 w-5 text-[var(--danger-fg)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--danger-fg)]">Subscription Expired</p>
            <p className="text-sm text-[var(--muted-text)] mt-0.5">
              Your subscription has ended. Renew now to restore full access to your dashboard.
            </p>
          </div>
        </div>
        <button
          onClick={onRenew}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--brand-btn-text)] transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
          style={{ background: "var(--danger-fg)" }}
        >
          <RefreshCw className="h-4 w-4" />
          Renew Subscription
        </button>
      </div>
    );
  }

  // Expiring soon
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl px-5 py-4 border"
      style={{
        background: "var(--warning-bg)",
        borderColor: "rgba(245, 158, 11, 0.2)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--warning-bg)]"
        >
          <AlertTriangle className="h-5 w-5 text-[var(--warning-fg)]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--warning-fg)]">
            Subscription Expiring in {daysLeft} {daysLeft === 1 ? "Day" : "Days"}
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-0.5">
            Renew before{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {endsAt ? new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
            </span>{" "}
            to avoid any service interruption.
          </p>
        </div>
      </div>
      <button
        onClick={onRenew}
        className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--brand-btn-text)] transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
        style={{ background: "var(--warning-fg)" }}
      >
        <RefreshCw className="h-4 w-4" />
        Renew Now
      </button>
    </div>
  );
}
