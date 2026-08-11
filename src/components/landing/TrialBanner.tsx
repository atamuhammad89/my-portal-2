"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Clock, Zap } from "lucide-react";

export function TrialBanner({ onUpgradeClick }: { onUpgradeClick?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Fetch subscription state from /api/billing/subscription or calculate
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => {
        if (data.subscription?.ends_at) {
          const endsAt = new Date(data.subscription.ends_at).getTime();
          const now = Date.now();
          const diffMs = endsAt - now;
          const remaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          setDaysRemaining(remaining);
          setIsExpired(remaining <= 0 || data.subscription.status === "expired");
        } else {
          // Default 30-day trial calculation from user creation
          setDaysRemaining(30);
        }
      })
      .catch(() => {
        setDaysRemaining(30);
      });
  }, [user, isAuthenticated]);

  if (!isAuthenticated || daysRemaining === null) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm">
      {isExpired ? (
        <button
          onClick={onUpgradeClick}
          className="flex items-center gap-1.5 text-red-500 bg-red-50 hover:bg-red-100 border-red-200 px-3 py-1 rounded-full animate-pulse cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Trial Expired - Upgrade Now</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
          <span>Free Trial: {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left</span>
        </div>
      )}
    </div>
  );
}
