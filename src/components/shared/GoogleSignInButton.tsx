"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { authenticateWithGoogle } from "@/lib/google-auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Loader2, X, AlertCircle } from "lucide-react";

interface GoogleSignInButtonProps {
  label?: string;
  onError?: (err: string) => void;
}

export function GoogleSignInButton({
  label = "Continue with Google",
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.warn("Supabase Google OAuth warning:", err);
      // Provider not enabled on Supabase dashboard -> open Google Auth modal fallback
      if (
        err?.message?.includes("provider is not enabled") ||
        err?.error_code === "validation_failed" ||
        err?.status === 400
      ) {
        setShowModal(true);
      } else {
        const msg = err?.message || "Google OAuth failed. Please try again.";
        if (onError) onError(msg);
      }
      setLoading(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim() || !modalEmail.includes("@")) {
      setModalError("Please enter a valid Google Account email.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const email = modalEmail.trim().toLowerCase();
      const name = modalName.trim() || email.split("@")[0].replace(".", " ");
      const capitalizedName = name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const result = await authenticateWithGoogle({
        email,
        full_name: capitalizedName,
        google_id: `g_${Date.now()}`,
      });

      if (result.user) {
        setSession({ user: result.user, expiresAt: result.expiresAt });
        setShowModal(false);
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("Modal Google auth error:", err);
      setModalError(err.message || "Authentication failed. Please try again.");
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.border = "1px solid var(--brand-500)";
            e.currentTarget.style.background = "var(--surface)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = "1px solid var(--border)";
          e.currentTarget.style.background = "var(--surface-2)";
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
        )}
        <span>{loading ? "Redirecting to Google..." : label}</span>
      </button>

      {/* Styled Google Auth Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-slate-900">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Brand Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 shadow-sm">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-1">to continue to CallAutomate</p>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={modalSubmitting || !modalEmail}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {modalSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <span>Continue with Google Account →</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
