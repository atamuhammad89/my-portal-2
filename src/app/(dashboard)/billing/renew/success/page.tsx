// src/app/(dashboard)/billing/renew/success/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function RenewSuccessContent() {
  const router = useSearchParams();
  const nav = useRouter();

  const sessionId = router.get("session_id") ?? "";
  const planId = router.get("plan_id") ?? "";
  const planName = router.get("plan_name") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !planId) {
      nav.replace("/billing");
      return;
    }

    fetch("/api/billing/renew/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // planId is intentionally omitted — server reads it from Stripe session metadata
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Renewal failed.");
        setStatus("success");
        setTimeout(() => nav.replace("/billing"), 3000);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [sessionId, planId, nav]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-10 text-center space-y-5"
        style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
            <h2 className="text-xl font-semibold text-slate-900">Activating your subscription…</h2>
            <p className="text-sm text-slate-400">This will only take a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="text-2xl font-bold text-slate-900">Subscription Renewed!</h2>
            <p className="text-sm text-slate-500">
              You&apos;re now on the{" "}
              <span className="font-semibold capitalize">{decodeURIComponent(planName)}</span> plan.
            </p>
            <p className="text-xs text-slate-400">Redirecting you to billing…</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-rose-600">{errorMsg}</p>
            <button
              onClick={() => nav.replace("/billing")}
              className="mt-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition"
            >
              Back to Billing
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function RenewSuccessPage() {
  return (
    <Suspense>
      <RenewSuccessContent />
    </Suspense>
  );
}
