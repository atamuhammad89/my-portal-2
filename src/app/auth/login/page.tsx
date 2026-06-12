"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: login, isPending } = useLogin();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      {/* Subtle radial glow behind the card */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(0,240,255,0.06) 0%, transparent 70%)",
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
              textShadow: "0 0 20px rgba(0, 240, 255, 0.35)",
            }}
          >
            CallAutomate
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
          Use your workspace credentials to access your dashboard.
        </p>

        <div className="mt-6 space-y-4" onKeyDown={handleKeyDown}>
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
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.08)";
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
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isPending || !email || !password}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--brand-500)",
              color: "#060913",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 0 20px rgba(0,240,255,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!isPending && email && password) {
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0,240,255,0.4)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0,240,255,0.2)";
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
          <button
            type="button"
            onClick={() => {
              clearSession();
              setEmail("");
              setPassword("");
              setErrorMessage(null);
            }}
            className="block w-full text-center text-sm transition-colors"
            style={{ color: "var(--subtle-text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--muted-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--subtle-text)")}
          >
            Clear local session
          </button>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
