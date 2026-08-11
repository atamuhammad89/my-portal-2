"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authenticateWithGoogle } from "@/lib/google-auth";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function processAuthCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session?.user) {
          throw new Error(error?.message || "Failed to retrieve Google authentication session.");
        }

        const authUser = data.session.user;
        const email = authUser.email;
        const fullName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          email?.split("@")[0] ||
          "Google User";

        if (!email) {
          throw new Error("No email address returned from Google OAuth.");
        }

        // Sync with backend portal database and create 30-Day Free Trial
        const backendResult = await authenticateWithGoogle({
          email,
          full_name: fullName,
          google_id: authUser.id,
          avatar_url: authUser.user_metadata?.avatar_url,
        });

        if (backendResult.user) {
          setSession({
            user: backendResult.user,
            expiresAt: backendResult.expiresAt,
          });
          router.replace("/dashboard");
        } else {
          throw new Error("Backend session initialization failed.");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "An error occurred during Google Sign-In.");
      }
    }

    processAuthCallback();
  }, [router, setSession]);

  if (errorMsg) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
        <div className="w-full max-w-md rounded-2xl p-8 bg-[var(--surface)] border border-[var(--border)] text-center shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-2">Authentication Error</h2>
          <p className="text-sm text-[var(--muted-text)] mb-6">{errorMsg}</p>
          <button
            onClick={() => router.replace("/auth/login")}
            className="px-6 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-sm font-semibold"
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-500)]" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Completing Google Sign-In…</h2>
        <p className="text-sm text-[var(--muted-text)]">Setting up your account and 30-Day Free Trial</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
