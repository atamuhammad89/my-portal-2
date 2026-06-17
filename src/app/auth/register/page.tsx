"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8)         return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw))     return "Include at least one uppercase letter.";
  if (!(/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw))) {
    return "Include at least one number or special character.";
  }
  return null;
}

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") ?? "";
  const planId    = searchParams.get("plan_id")    ?? "";
  const planName  = searchParams.get("plan_name")  ?? "";

  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  useEffect(() => {
    if (!sessionId) router.replace("/pricing");
  }, [sessionId, router]);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const trimmedName  = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName)  return setErrorMsg("Full name is required.");
    if (!trimmedEmail) return setErrorMsg("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      return setErrorMsg("Enter a valid email address.");

    const pwError = validatePassword(password);
    if (pwError) return setErrorMsg(pwError);

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:         trimmedName,
          email:             trimmedEmail,
          password,
          plan_id:           planId,
          plan_name:         planName,
          stripe_session_id: sessionId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Webhook returned ${res.status}.`);
      }

      setSuccess(true);
      setTimeout(() => router.replace("/auth/login?checkout=success"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) handleSubmit();
  };

  const inputStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid var(--brand-500)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-100)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid var(--border)";
    e.currentTarget.style.boxShadow = "none";
  };

  if (!sessionId) return null;

  if (success) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <section
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--success-bg)", border: "1px solid rgba(52,211,153,0.3)" }}
          >
            <CheckCircle className="h-7 w-7" style={{ color: "var(--success-fg)" }} />
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}
          >
            Account created!
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-text)" }}>
            Redirecting you to sign in…
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "var(--hero-glow-2)",
        }}
      />

      <section
        className="relative z-10 w-full max-w-md rounded-2xl p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Brand header */}
        <div className="mb-8 text-center">
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "var(--brand-500)",
              textShadow: "var(--brand-glow-text)",
            }}
          >
            CallAutomate
          </span>
        </div>

        {/* Plan confirmation banner */}
        {planName && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{
              background: "var(--success-bg)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "var(--success-fg)",
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Payment successful! You&apos;re on the{" "}
              <strong>{capitalize(planName)}</strong> plan.
            </span>
          </div>
        )}

        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}
        >
          Create your account
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-text)" }}>
          Set up your credentials to access your dashboard.
        </p>

        <div className="mt-6 space-y-4" onKeyDown={handleKeyDown}>
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
              Full name
            </label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--subtle-text)" }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--subtle-text)" }}>
              Min 8 characters, one uppercase letter and one number or special character.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(251, 113, 133, 0.3)",
                color: "var(--danger-fg)",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !fullName || !email || !password}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: "var(--brand-500)",
              color: "var(--brand-btn-text)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "var(--brand-btn-shadow)",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating account…" : "Create account →"}
          </button>
        </div>

        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
          <Link
            href="/pricing"
            className="block text-center text-sm transition-colors"
            style={{ color: "var(--subtle-text)" }}
          >
            ← Back to pricing
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
