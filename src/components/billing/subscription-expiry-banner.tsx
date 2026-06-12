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
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10"
          >
            <XCircle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-400">Subscription Expired</p>
            <p className="text-sm text-slate-300 mt-0.5">
              Your subscription has ended. Renew now to restore full access to your dashboard.
            </p>
          </div>
        </div>
        <button
          onClick={onRenew}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white hover:from-transparent hover:to-transparent hover:text-black hover:border-white border border-transparent active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(244,63,94,0.2)]"
          style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
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
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10"
        >
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400">
            Subscription Expiring in {daysLeft} {daysLeft === 1 ? "Day" : "Days"}
          </p>
          <p className="text-sm text-slate-300 mt-0.5">
            Renew before{" "}
            <span className="font-semibold text-white">
              {endsAt ? new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
            </span>{" "}
            to avoid any service interruption.
          </p>
        </div>
      </div>
      <button
        onClick={onRenew}
        className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-black transition-all hover:bg-white hover:from-transparent hover:to-transparent hover:text-black hover:border-white border border-transparent active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
      >
        <RefreshCw className="h-4 w-4" />
        Renew Now
      </button>
    </div>
  );
}
