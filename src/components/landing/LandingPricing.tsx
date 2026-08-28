"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Zap, ArrowRight, Phone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { motion } from "framer-motion";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string;
  stripe_price_id: string | null;
  features: string[];
  is_featured: boolean;
}

export function LandingPricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [trialMessage, setTrialMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans, error }) => {
        if (error) setFetchError(error);
        else setPlans(plans ?? []);
      })
      .catch(() => setFetchError("Could not load pricing plans."))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleFreeTrialClick = async (plan: Plan) => {
    setTrialMessage(null);
    if (!isAuthenticated) {
      // Redirect unauthenticated user to register/login page with free_trial intent
      window.location.href = "/auth/register?plan=free_trial";
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const res = await fetch("/api/subscriptions/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTrialMessage({
          type: "error",
          text: data.error || "You are not eligible for a free trial.",
        });
      } else {
        setTrialMessage({
          type: "success",
          text: "30-Day Free Trial activated! Redirecting to your dashboard...",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (err) {
      console.error("Free Trial activation error:", err);
      setTrialMessage({
        type: "error",
        text: "Something went wrong activating your trial. Please try again.",
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleCheckout = async (plan: Plan) => {
    setTrialMessage(null);
    if (plan.name === "free_trial" || plan.monthly_price === 0) {
      return handleFreeTrialClick(plan);
    }

    if (!plan.stripe_price_id) {
      setTrialMessage({
        type: "error",
        text: `Stripe checkout for "${plan.display_name}" is not configured yet. Redirecting to registration...`,
      });
      setTimeout(() => {
        window.location.href = "/auth/register";
      }, 1500);
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planId: plan.id,
          planName: plan.name,
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setLoadingPlanId(null);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Simple Transparent Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 break-words">
            Flexible plans for every business
          </h2>
          <p className="text-slate-400 text-lg">
            Includes 30-Day Free Trial ($0, no card needed). Upgrade, downgrade, or cancel anytime.
          </p>
        </motion.div>

        {trialMessage && (
          <div
            className={`max-w-xl mx-auto mb-8 p-4 rounded-2xl text-center text-sm font-semibold border ${
              trialMessage.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {trialMessage.text}
          </div>
        )}

        {fetchError && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center text-sm font-semibold">
            {fetchError}
          </div>
        )}

        {loadingPlans && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {!loadingPlans && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {plans.map((plan, idx) => {
              const featured = plan.is_featured;
              const isFreeTrial = plan.name === "free_trial" || plan.monthly_price === 0;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 60, scale: 0.92 }}
                  whileInView={{ opacity: 1, y: 0, scale: featured ? 1.03 : 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -8,
                    scale: featured ? 1.06 : 1.03,
                    transition: { duration: 0.25 },
                  }}
                  className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                    isFreeTrial
                      ? "bg-gradient-to-b from-indigo-950/40 to-slate-950/90 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10"
                      : featured
                      ? "bg-slate-800 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20"
                      : "bg-slate-950/80 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {featured && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg"
                    >
                      Most Popular
                    </motion.div>
                  )}

                  {isFreeTrial && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      30 Days Free • No Card Needed
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">{plan.display_name}</h3>
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-6 leading-relaxed min-h-[36px]">
                      {plan.description || "Automate your customer phone calls with voice AI."}
                    </p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.12 + 0.3, type: "spring", stiffness: 150 }}
                      className="flex items-baseline gap-1 mb-6"
                    >
                      <span className="text-4xl font-black text-white tracking-tight">
                        ${plan.monthly_price}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">
                        {isFreeTrial ? "/ 30 days" : "/month"}
                      </span>
                    </motion.div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 mb-6 flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {plan.total_minutes.toLocaleString()} included minutes
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isFreeTrial ? "Zero commitment required" : `$${plan.price_per_minute.toFixed(4)}/extra min`}
                        </div>
                      </div>
                    </div>

                    {plan.features.length > 0 && (
                      <ul className="space-y-2.5 mb-8">
                        {plan.features.map((feat, fidx) => (
                          <motion.li
                            key={fidx}
                            initial={{ opacity: 0, x: -15 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: idx * 0.1 + fidx * 0.06 + 0.4 }}
                            className="flex items-center gap-2 text-xs text-slate-300"
                          >
                            <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{feat}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlanId === plan.id}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isFreeTrial
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                        : featured
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {loadingPlanId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isFreeTrial ? "Start Free Trial (0 Card)" : "Get Started"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
