"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth-store";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";

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
      const adminRoles = new Set(["super_admin", "operations", "support", "finance"]);
      const defaultDest = adminRoles.has(response.user?.role ?? "")
        ? "/admin/overview"
        : response.user?.role === "reseller"
        ? "/reseller"
        : "/dashboard";
      const next = searchParams.get("next");
      router.replace(next ?? defaultDest);
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
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Subtle radial glow behind the card */}
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
        <div className="mb-8 text-center flex items-center justify-center gap-3">
          <CallAutomateLogoIcon className="w-9 h-9 shrink-0" size={36} />
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "var(--foreground)",
            }}
          >
            Call<span className="text-[var(--brand-500)]">Automate</span>
          </span>
        </div>

        {/* Post-checkout banner */}
        {isPostCheckout && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{
              background: "var(--success-bg)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "var(--success-fg)",
            }}
          >
            <span>✅</span>
            <span>Account created! Sign in with your new credentials to get started.</span>
          </div>
        )}

        {/* Session expired banner */}
        {sessionExpired && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--warning-bg)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              color: "var(--warning-fg)",
            }}
          >
            Your session expired. Please sign in again.
          </div>
        )}

        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-text)" }}>
          Use your workspace credentials or Google account to sign in.
        </p>

        <div className="mt-6 space-y-4">
          <GoogleSignInButton label="Sign in with Google" onError={(err) => setErrorMessage(err)} />

          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[var(--border)]" />
            <span className="absolute px-3 text-xs uppercase bg-[var(--surface)] text-[var(--subtle-text)] tracking-wider">
              Or continue with email
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-4" onKeyDown={handleKeyDown}>
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
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

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
                autoComplete="current-password"
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid var(--brand-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-100)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid var(--border)";
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
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isPending || !email || !password}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--brand-500)",
              color: "var(--brand-btn-text)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "var(--brand-btn-shadow)",
            }}
            onMouseEnter={(e) => {
              if (!isPending && email && password) {
                e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isPending ? "Signing in…" : "Continue →"}
          </button>

          {errorMessage && (
            <p
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(251, 113, 133, 0.3)",
                color: "var(--danger-fg)",
              }}
            >
              {errorMessage}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
          <Link
            href="/"
            className="block text-center text-sm transition-colors"
            style={{ color: "var(--subtle-text)" }}
          >
            ← Back to CallAutomate
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
