"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, Check, Zap, ArrowRight, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

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

export default function PricingPage() {
  const [plans, setPlans]               = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans, error }) => {
        if (error) setFetchError(error);
        else setPlans(plans ?? []);
      })
      .catch(() => setFetchError("Could not load plans. Please refresh."))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCheckout = async (plan: Plan) => {
    if (!plan.stripe_price_id) {
      alert(`Stripe price ID for "${plan.display_name}" is not configured yet. Please contact support.`);
      return;
    }
    setLoadingPlan(plan.id);
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
      console.error(err);
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--pricing-bg-gradient)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--header-nav-bg)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 2rem",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}>
            <Phone size={16} color="var(--brand-btn-text)" />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 18,
            color: "var(--brand-500)",
            textShadow: "var(--brand-glow-text)",
          }}>
            CallAutomate
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <Link href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--brand-500)",
            color: "var(--brand-btn-text)",
            padding: "9px 20px",
            borderRadius: 10,
            fontSize: 14, fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "var(--shadow-sm)",
            transition: "box-shadow 0.2s",
          }}>
            <LogIn size={15} />
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", paddingTop: "120px", paddingBottom: "90px", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "var(--hero-glow-1)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 40, left: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "var(--hero-glow-3)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 0, right: "8%",
          width: 250, height: 250, borderRadius: "50%",
          background: "var(--hero-glow-3)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--brand-100)",
            border: "1px solid var(--brand-200)",
            borderRadius: 100,
            padding: "6px 16px",
            marginBottom: 28,
          }}>
            <Zap size={13} color="var(--brand-500)" fill="var(--brand-500)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-500)" }}>
              AI-Powered Call Automation
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            color: "var(--foreground)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}>
            The right plan for{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--brand-500) 0%, var(--brand-400) 100%)",
              WebkitBackgroundClip: "text",
              color: "var(--brand-500)",
              WebkitTextFillColor: "transparent",
              filter: "var(--brand-glow-filter)",
            }}>
              every team
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "var(--muted-text)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 16px" }}>
            Start automating calls in minutes. Scale as you grow. No hidden fees, no surprises.
          </p>

          <p style={{ fontSize: 14, color: "var(--subtle-text)", marginTop: 16 }}>
            Already subscribed?{" "}
            <Link href="/auth/login" style={{ color: "var(--brand-500)", fontWeight: 600, textDecoration: "none" }}>
              Sign in to your dashboard →
            </Link>
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ maxWidth: 700, margin: "0 auto 56px", padding: "0 1.5rem" }}>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "20px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          boxShadow: "var(--shadow-md)",
        }}>
          {[
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 300ms", label: "Avg response time" },
            { value: "10k+", label: "Calls automated/day" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22, fontWeight: 800,
                color: "var(--brand-500)",
                letterSpacing: "-0.02em",
                textShadow: "var(--stat-glow)",
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "var(--subtle-text)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <div style={{ maxWidth: 480, margin: "0 auto 32px", padding: "0 1.5rem" }}>
          <div style={{
            background: "var(--danger-bg)",
            border: "1px solid rgba(251,113,133,0.3)",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14, color: "var(--danger-fg)", textAlign: "center",
          }}>
            {fetchError}
          </div>
        </div>
      )}

      {/* Skeleton */}
      {loadingPlans && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24, maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem 80px",
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "var(--surface)", borderRadius: 24,
              padding: 28, border: "1px solid var(--border)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              <div style={{ height: 14, background: "var(--surface-2)", borderRadius: 8, width: "40%", marginBottom: 16 }} />
              <div style={{ height: 36, background: "var(--surface-2)", borderRadius: 8, width: "55%", marginBottom: 24 }} />
              {[1, 2, 3, 4].map((j) => (
                <div key={j} style={{ height: 12, background: "var(--surface-2)", borderRadius: 8, marginBottom: 10 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Plan cards */}
      {!loadingPlans && plans.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: 24,
          maxWidth: 1020,
          margin: "0 auto",
          padding: "0 1.5rem 80px",
          alignItems: "start",
        }}>
          {plans.map((plan) => {
            const featured = plan.is_featured;
            const hovered = hoveredPlan === plan.id;
            const missingStripe = !plan.stripe_price_id;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  position: "relative",
                  borderRadius: 24,
                  padding: featured ? "2px" : 0,
                  background: featured
                    ? "linear-gradient(135deg, var(--brand-500), var(--brand-400), var(--brand-500))"
                    : "transparent",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  transform: hovered ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: hovered
                    ? featured
                      ? "var(--shadow-lg)"
                      : "0 20px 60px rgba(15,23,42,0.08)"
                    : featured
                      ? "var(--shadow-md)"
                      : "var(--shadow-sm)",
                }}
              >
                {featured && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, var(--brand-500), var(--brand-400))",
                    color: "var(--brand-btn-text)",
                    fontSize: 12, fontWeight: 700,
                    padding: "5px 16px",
                    borderRadius: 100,
                    display: "flex", alignItems: "center", gap: 5,
                    whiteSpace: "nowrap",
                    boxShadow: "var(--shadow-sm)",
                    zIndex: 10,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    <Zap size={11} fill="var(--brand-btn-text)" color="var(--brand-btn-text)" /> Most Popular
                  </div>
                )}

                <div style={{
                  background: featured ? "var(--surface-2)" : "var(--surface)",
                  borderRadius: featured ? 22 : 24,
                  border: featured ? "none" : "1px solid var(--border)",
                  padding: "32px 28px",
                  display: "flex", flexDirection: "column", gap: 0,
                  height: "100%",
                }}>
                  {/* Name & description */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: featured ? "var(--featured-bg-opacity)" : "var(--surface-2)",
                      border: featured ? "1px solid var(--featured-border-opacity)" : "1px solid var(--border)",
                      borderRadius: 8, padding: "4px 10px", marginBottom: 12,
                    }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                        color: featured ? "var(--brand-500)" : "var(--muted-text)",
                        textTransform: "uppercase",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        {plan.display_name}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--muted-text)", lineHeight: 1.5, margin: 0 }}>
                      {plan.description || "Automate your calls and scale your business."}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 24 }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 52, fontWeight: 800,
                      color: featured ? "var(--brand-500)" : "var(--foreground)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      textShadow: featured ? "var(--featured-glow)" : "none",
                    }}>
                      ${plan.monthly_price.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--subtle-text)", paddingBottom: 8 }}>/month</span>
                  </div>

                  {/* Minutes */}
                  <div style={{
                    background: featured ? "var(--brand-50)" : "var(--surface-2)",
                    border: `1px solid ${featured ? "var(--brand-200)" : "var(--border)"}`,
                    borderRadius: 12, padding: "12px 16px", marginBottom: 24,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: featured ? "var(--brand-500)" : "var(--surface)",
                      border: featured ? "none" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Phone size={15} color={featured ? "var(--brand-btn-text)" : "var(--muted-text)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
                        {plan.total_minutes.toLocaleString()} minutes
                      </div>
                      <div style={{ fontSize: 12, color: "var(--subtle-text)" }}>
                        ${plan.price_per_minute.toFixed(4)}/extra min
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />

                  {/* Features */}
                  {plan.features.length > 0 && (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 28 }}>
                      {plan.features.map((text) => (
                        <li key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            background: featured ? "var(--featured-bg-opacity)" : "var(--success-bg)",
                            border: featured ? "1px solid var(--featured-border-opacity)" : "1px solid rgba(52,211,153,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Check size={13} color={featured ? "var(--brand-500)" : "var(--success-fg)"} strokeWidth={2.5} />
                          </div>
                          <span style={{ fontSize: 14, color: "var(--muted-text)" }}>{text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlan === plan.id || missingStripe}
                    title={missingStripe ? "Stripe price not configured for this plan" : undefined}
                    style={{
                      width: "100%",
                      padding: "14px 24px",
                      borderRadius: 12,
                      border: "none",
                      cursor: (loadingPlan === plan.id || missingStripe) ? "not-allowed" : "pointer",
                      opacity: (loadingPlan === plan.id || missingStripe) ? 0.5 : 1,
                      fontSize: 15, fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s ease",
                      background: featured
                        ? "var(--brand-500)"
                        : "var(--surface-2)",
                      color: featured ? "var(--brand-btn-text)" : "var(--foreground)",
                      boxShadow: featured
                        ? "var(--shadow-sm)"
                        : "none",
                    } as React.CSSProperties}
                  >
                    {loadingPlan === plan.id ? (
                      "Redirecting…"
                    ) : missingStripe ? (
                      "Not available"
                    ) : (
                      <>
                        Get Started
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-light)",
        background: "var(--footer-bg)",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Phone size={12} color="var(--brand-btn-text)" />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 14,
            color: "var(--brand-500)",
            textShadow: "var(--footer-glow)",
          }}>
            CallAutomate
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--subtle-text)", margin: 0 }}>
          © {new Date().getFullYear()} CallAutomate. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes floatGlow {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}