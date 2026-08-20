"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Check,
  Loader2,
  ArrowRight,
  Phone,
  Zap,
  AlertCircle,
} from "lucide-react";
import type { RenewablePlan } from "@/services/renewal-service";

type RenewalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  plans: RenewablePlan[];
  plansLoading: boolean;
  plansError: string | null;
  loadingPlanId: string | null;
  error: string | null;
  onRenew: (plan: RenewablePlan) => void;
  currentPlanName?: string;
};

export function RenewalModal({
  isOpen,
  onClose,
  plans,
  plansLoading,
  plansError,
  loadingPlanId,
  error,
  onRenew,
  currentPlanName,
}: RenewalModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,9,19,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden border shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-7 py-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="text-xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Renew Your Subscription
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Choose a plan below. You&apos;ll be taken to secure checkout via Stripe.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6" style={{ maxHeight: "calc(92vh - 110px)" }}>
          {(error || plansError) && (
            <div
              className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm border"
              style={{ background: "var(--danger-bg)", borderColor: "rgba(244,63,94,0.2)", color: "var(--danger-fg)" }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error ?? plansError}</span>
            </div>
          )}

          {plansLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 animate-pulse border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="h-3 w-24 rounded bg-[var(--border)] mb-3" />
                  <div className="h-8 w-20 rounded bg-[var(--border)] mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-3 rounded bg-[var(--border)]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!plansLoading && plans.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.filter((p) => p.name !== "free_trial" && p.monthly_price > 0).map((plan) => {
                const isFeatured = plan.is_featured;
                const isCurrent = plan.name === currentPlanName;
                const isLoading = loadingPlanId === plan.id;
                const missingStripe = !plan.stripe_price_id;

                return (
                  <div
                    key={plan.id}
                    className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      border: isFeatured
                        ? "2px solid transparent"
                        : `1px solid ${isCurrent ? "var(--brand-500)" : "var(--border)"}`,
                      background: isFeatured
                        ? "linear-gradient(var(--surface-2), var(--surface-2)) padding-box, linear-gradient(135deg, var(--brand-500), var(--brand-400)) border-box"
                        : "var(--surface-2)",
                      boxShadow: isFeatured
                        ? "var(--brand-btn-shadow)"
                        : isCurrent
                          ? "var(--brand-btn-shadow)"
                          : "var(--shadow-sm)",
                    }}
                  >
                    {isFeatured && (
                      <div
                        className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-black text-[var(--brand-btn-text)]"
                        style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-400))" }}
                      >
                        <Zap className="h-3 w-3 fill-[var(--brand-btn-text)] text-[var(--brand-btn-text)]" /> Most Popular
                      </div>
                    )}

                    {isCurrent && !isFeatured && (
                      <div
                        className="flex items-center justify-center py-1.5 text-xs font-semibold"
                        style={{ background: "var(--brand-100)", color: "var(--brand-500)" }}
                      >
                        Current Plan
                      </div>
                    )}

                    <div className="flex flex-col flex-1 p-5">
                      <div className="mb-4">
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: isFeatured ? "var(--brand-500)" : "var(--muted-text)" }}
                        >
                          {plan.display_name}
                        </span>
                        <div className="mt-1 flex items-end gap-1">
                          <span
                            className="text-3xl font-extrabold text-[var(--foreground)]"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.03em" }}
                          >
                            ${plan.monthly_price.toFixed(0)}
                          </span>
                          <span className="mb-1 text-sm text-[var(--muted-text)]">/month</span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-3 rounded-xl p-3 mb-4"
                        style={{ background: isFeatured ? "var(--featured-bg-opacity)" : "var(--surface)" }}
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                          style={{ background: isFeatured ? "var(--brand-500)" : "var(--border)" }}
                        >
                          <Phone className="h-3.5 w-3.5" color={isFeatured ? "var(--brand-btn-text)" : "var(--muted-text)"} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--foreground)]">
                            {plan.total_minutes.toLocaleString()} minutes
                          </div>
                          <div className="text-xs text-[var(--muted-text)]">
                            ${plan.price_per_minute.toFixed(4)}/extra min
                          </div>
                        </div>
                      </div>

                      {plan.features.length > 0 && (
                        <ul className="flex flex-col gap-2.5 flex-1 mb-5">
                          {plan.features.map((text) => (
                            <li key={text} className="flex items-start gap-2.5">
                              <div
                                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                                style={{ background: isFeatured ? "var(--featured-bg-opacity)" : "var(--success-bg)" }}
                              >
                                <Check
                                  className="h-3 w-3"
                                  style={{ color: isFeatured ? "var(--brand-500)" : "var(--success-fg)" }}
                                  strokeWidth={2.5}
                                />
                              </div>
                              <span className="text-sm text-[var(--muted-text)]">{text}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={() => onRenew(plan)}
                        disabled={!!loadingPlanId || missingStripe}
                        title={missingStripe ? "Stripe price not configured for this plan" : undefined}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border"
                        style={isFeatured
                          ? {
                              background: "var(--brand-500)",
                              color: "var(--brand-btn-text)",
                              borderColor: "transparent",
                              boxShadow: "var(--brand-btn-shadow)",
                            }
                          : {
                              background: "var(--surface)",
                              color: "var(--brand-500)",
                              borderColor: "var(--border)",
                            }
                        }
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Redirecting…
                          </>
                        ) : missingStripe ? (
                          "Not available"
                        ) : (
                          <>
                            {isCurrent ? "Renew This Plan" : "Select & Pay"}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}