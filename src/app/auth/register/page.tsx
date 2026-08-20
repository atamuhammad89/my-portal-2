"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, User, Mail, Lock, AlertCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";
import { AuthLayout } from "@/components/auth/AuthLayout";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter.";
  if (!(/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw))) {
    return "Include at least one number or special character.";
  }
  return null;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") ?? "";
  const planId = searchParams.get("plan_id") ?? "";
  const planName = searchParams.get("plan_name") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isFreeTrial =
    searchParams.get("plan") === "free_trial" || planName === "free_trial" || planId === "free_trial";

  useEffect(() => {
    if (!sessionId && !isFreeTrial) router.replace("/pricing");
  }, [sessionId, isFreeTrial, router]);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) return setErrorMsg("Full name is required.");
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
          full_name: trimmedName,
          email: trimmedEmail,
          password,
          plan_id: planId,
          plan_name: planName,
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

  if (!sessionId && !isFreeTrial) return null;

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-5">
          <div
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border"
            style={{
              background: "var(--success-bg)",
              borderColor: "rgba(52, 211, 153, 0.3)",
            }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: "var(--success-fg)" }} />
          </div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>
            Account Created! 🎉
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-text)" }}>
            Redirecting you to sign in…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Brand logo header inside card */}
      <div className="flex flex-col items-center text-center mb-3">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <CallAutomateLogoIcon className="w-6 h-6 shrink-0" size={24} />
          <span className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Call<span className="text-[var(--brand-500)]">Automate</span>
          </span>
        </div>

        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Create your account 🚀</h1>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-text)" }}>
          Start your 30-Day Free Trial today. No credit card required.
        </p>
      </div>

      {/* Plan confirmation banner */}
      {isFreeTrial && (
        <div
          className="mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>
            🎁 <strong>30-Day Free Trial ($0, no card needed)</strong>.
          </span>
        </div>
      )}

      {planName && !isFreeTrial && (
        <div
          className="mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>
            Payment successful! Joining on <strong>{capitalize(planName)}</strong>.
          </span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-3">
        <GoogleSignInButton label="Sign up with Google" onError={(err) => setErrorMsg(err)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
        <span
          className="absolute px-2 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: "var(--surface)", color: "var(--subtle-text)" }}
        >
          OR SIGN UP WITH EMAIL
        </span>
      </div>

      {/* Form controls */}
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        {/* Full Name */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Full Name
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Email
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              style={{ color: "var(--subtle-text)" }}
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div
            className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border"
            style={{
              background: "var(--danger-bg)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "var(--danger-fg)",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--danger-fg)" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !fullName || !email || !password}
          className="w-full py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 mt-1"
          style={{
            background: "var(--brand-500)",
            color: "var(--brand-btn-text)",
            boxShadow: "var(--brand-btn-shadow)",
          }}
          onMouseEnter={(e) => {
            if (!submitting) {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create account →</span>
          )}
        </button>
      </div>

      {/* Footer navigation link */}
      <div className="mt-3 pt-2.5 border-t text-center space-y-0.5" style={{ borderColor: "var(--border)" }}>
        <div>
          <Link
            href="/auth/login"
            className="text-[11px] font-bold hover:underline"
            style={{ color: "var(--brand-500)" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
        <div>
          <Link
            href="/"
            className="text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
            style={{ color: "var(--subtle-text)" }}
          >
            ← Back to CallAutomate
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
