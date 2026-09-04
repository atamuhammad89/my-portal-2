"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth-store";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";
import { AuthLayout } from "@/components/auth/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: login, isPending } = useLogin();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPostCheckout = searchParams.get("checkout") === "success";
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const response = await login({ email, password });
      const adminRoles = new Set(["super_admin", "admin", "operations", "support", "finance"]);
      const defaultDest = adminRoles.has(response.user?.role ?? "")
        ? "/admin/agents"
        : response.user?.role === "reseller"
        ? "/reseller"
        : "/dashboard";
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : defaultDest);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Login failed. Please verify your credentials."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

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

        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Welcome back! 👋</h1>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-text)" }}>
          Sign in to your account to continue automating conversations.
        </p>
      </div>

      {/* Post-checkout banner */}
      {isPostCheckout && (
        <div
          className="mb-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold flex items-center gap-2 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>Account created! Sign in with your new credentials.</span>
        </div>
      )}

      {/* Session expired banner */}
      {sessionExpired && (
        <div
          className="mb-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold flex items-center gap-2 shadow-sm border"
          style={{
            background: "var(--warning-bg)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            color: "var(--warning-fg)",
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--warning-fg)" }} />
          <span>Your session expired. Please sign in again.</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-3">
        <GoogleSignInButton label="Sign in with Google" onError={(err) => setErrorMessage(err)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
        <span
          className="absolute px-2 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: "var(--surface)", color: "var(--subtle-text)" }}
        >
          OR CONTINUE WITH EMAIL
        </span>
      </div>

      {/* Form controls */}
      <div className="space-y-2.5" onKeyDown={handleKeyDown}>
        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--muted-text)" }}>
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
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-all border"
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
          <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--muted-text)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full pl-8 pr-8 py-2 rounded-lg text-xs outline-none transition-all border"
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
          <div className="flex justify-end mt-0.5">
            <Link
              href="/auth/login"
              className="text-[10px] font-semibold hover:underline"
              style={{ color: "var(--brand-500)" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div
            className="p-2 rounded-lg text-xs font-semibold flex items-center gap-2 border"
            style={{
              background: "var(--danger-bg)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "var(--danger-fg)",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--danger-fg)" }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isPending || !email || !password}
          className="w-full py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 mt-0.5"
          style={{
            background: "var(--brand-500)",
            color: "var(--brand-btn-text)",
            boxShadow: "var(--brand-btn-shadow)",
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Continue →</span>
          )}
        </button>
      </div>

      {/* Footer navigation link */}
      <div className="mt-4 pt-2.5 border-t text-center" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/"
          className="text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
          style={{ color: "var(--subtle-text)" }}
        >
          ← Back to CallAutomate
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
