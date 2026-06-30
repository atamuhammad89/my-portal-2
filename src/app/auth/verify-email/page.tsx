// src/app/auth/verify-email/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

function VerifyEmailContent() {
  const router = useSearchParams();
  const nav = useRouter();
  const token = router.get("token") ?? "";

  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Guard against React 18 StrictMode double-invoking effects in development
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setErrorMsg("Missing verification token.");
      setStatus("error");
      return;
    }

    // Call API to confirm the token
    fetch("/api/auth/verify-email/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to verify email.");
        }
        
        // Update local auth session in Zustand if user is logged in
        if (user && expiresAt) {
          setSession({
            expiresAt,
            user: { ...user, isEmailVerified: true }
          });
        }
        
        setStatus("success");
        setTimeout(() => nav.replace("/settings"), 3000);
      })
      .catch((err) => {
        console.error("Verification failed:", err);
        setErrorMsg(err.message || "Failed to confirm email verification.");
        setStatus("error");
      });
  }, [token, nav, user, expiresAt, setSession]);

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--pricing-bg-gradient)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-10 text-center space-y-6 border shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: "var(--brand-500)",
              textShadow: "var(--brand-glow-text)",
            }}
          >
            CallAutomate
          </span>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--brand-500)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Verifying email address…</h2>
            <p className="text-xs text-[var(--muted-text)]">Securing your profile state, please wait.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Email Verified!</h2>
            <p className="text-sm text-[var(--muted-text)] leading-relaxed">
              Your email has been verified. You can now access all account functionalities securely.
            </p>
            <p className="text-xs text-indigo-400 font-semibold animate-pulse-slow">
              Redirecting you to settings…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-14 w-14 text-rose-500" />
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Verification Failed</h2>
            <p className="text-sm text-rose-400 leading-relaxed bg-[var(--danger-bg)] border border-[var(--danger-border)] p-3 rounded-xl">
              {errorMsg}
            </p>
            <button
              onClick={() => nav.replace("/settings")}
              className="w-full flex items-center justify-center rounded-xl bg-[var(--brand-500)] px-4 py-3 text-sm font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer shadow-sm"
            >
              Back to Settings
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center p-6" style={{ background: "var(--pricing-bg-gradient)" }}>
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-500)]" />
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
