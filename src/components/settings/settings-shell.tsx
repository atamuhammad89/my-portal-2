// src/components/settings/settings-shell.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { KeyRound, Eye, EyeOff, CheckCircle2, User, Mail, Pencil, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

function PasswordInput({
  label, value, onChange, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 pr-10 text-sm text-[var(--foreground)] placeholder-slate-500 outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--foreground)] cursor-pointer"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function TextInput({
  label, value, onChange, placeholder, type = "text", rightLabel
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rightLabel?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-500 outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
      />
    </div>
  );
}

type TabId = "profile" | "password";

export function SettingsShell() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile tab state
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  // Password tab state
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // 1. Sync user profile on mount to get the latest database state (like email verification)
  useEffect(() => {
    apiClient.get("/user/profile")
      .then((res) => {
        const profile = res.data;
        if (profile && user) {
          const hasChanges = 
            profile.isEmailVerified !== user.isEmailVerified || 
            profile.fullName !== user.fullName || 
            profile.email !== user.email;

          if (hasChanges) {
            setSession({
              expiresAt: expiresAt || (Date.now() + 8 * 60 * 60 * 1000),
              user: {
                ...user,
                fullName: profile.fullName,
                email: profile.email,
                isEmailVerified: profile.isEmailVerified,
              },
            });
          }
        }
      })
      .catch((err) => console.error("Sync profile error:", err));
  }, []);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("/user/profile", { fullName, email });
      return res.data;
    },
    onSuccess: () => {
      setProfileSuccess(true);
      setProfileError("");
      // Update auth store so header/name reflects new info immediately
      if (user && isAuthenticated && expiresAt) {
        setSession({
          expiresAt,
          user: { 
            ...user, 
            fullName, 
            email, 
            // If email is changed, reset verification in local UI store state
            isEmailVerified: email === user.email ? user.isEmailVerified : false
          },
        });
      }
      setTimeout(() => setProfileSuccess(false), 4000);
    },
    onError: (err: any) => {
      setProfileError(err?.response?.data?.error ?? err?.message ?? "Something went wrong.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/user/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      return res.data;
    },
    onSuccess: () => {
      setPwSuccess(true);
      setPwError("");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setPwSuccess(false), 4000);
    },
    onError: (err: any) => {
      setPwError(err?.response?.data?.error ?? err?.message ?? "Something went wrong.");
    },
  });

  function handleProfileSubmit() {
    setProfileError("");
    setProfileSuccess(false);
    if (!fullName.trim()) {
      setProfileError("Name is required."); return;
    }
    if (!email.trim() || !email.includes("@")) {
      setProfileError("A valid email is required."); return;
    }
    profileMutation.mutate();
  }

  function handlePasswordSubmit() {
    setPwError("");
    setPwSuccess(false);
    if (!current || !next || !confirm) {
      setPwError("All fields are required."); return;
    }
    if (next.length < 8) {
      setPwError("New password must be at least 8 characters."); return;
    }
    if (!/[A-Z]/.test(next)) {
      setPwError("New password must include at least one uppercase letter."); return;
    }
    if (!(/[0-9]/.test(next) || /[^A-Za-z0-9]/.test(next))) {
      setPwError("New password must include at least one number or special character."); return;
    }
    if (next !== confirm) {
      setPwError("New passwords do not match."); return;
    }
    passwordMutation.mutate();
  }

  // Trigger dispatch of verification link email
  const handleSendVerificationEmail = async () => {
    setSendingEmail(true);
    setSendError("");
    setSendSuccess(false);
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification link.");
      }
      setSendSuccess(true);
    } catch (err: any) {
      setSendError(err.message || "Something went wrong.");
    } finally {
      setSendingEmail(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Edit Profile", icon: <User className="h-4 w-4" /> },
    { id: "password", label: "Change Password", icon: <KeyRound className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and account security."
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 max-w-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--surface-2)] text-[var(--brand-500)] shadow-sm"
                : "text-[var(--muted-text)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Edit Profile Panel */}
      {activeTab === "profile" && (
        <div
          className="max-w-md rounded-2xl p-6 space-y-5 border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 text-[var(--brand-500)]">
            <Pencil className="h-4 w-4" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Edit Profile</span>
          </div>

          <TextInput
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Your full name"
          />
          <TextInput
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            rightLabel={
              email.trim() ? (
                user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--success-fg)] bg-[var(--success-bg)] px-2 py-0.5 rounded-full border border-[var(--success-fg)]/25">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--danger-fg)] bg-[var(--danger-bg)] px-2 py-0.5 rounded-full border border-[var(--danger-fg)]/25">
                      Unverified
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(true)}
                      className="text-xs font-bold text-[var(--brand-500)] hover:underline cursor-pointer"
                    >
                      Verify Email
                    </button>
                  </div>
                )
              ) : null
            }
          />

          {profileError && (
            <p className="rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger-fg)]">
              {profileError}
            </p>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-2 text-xs text-[var(--success-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated successfully.
            </div>
          )}

          <button
            onClick={handleProfileSubmit}
            disabled={profileMutation.isPending}
            className="w-full rounded-xl bg-[var(--brand-500)] px-4 py-2.5 text-sm font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {profileMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Change Password Panel */}
      {activeTab === "password" && (
        <div
          className="max-w-md rounded-2xl p-6 space-y-5 border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 text-[var(--brand-500)]">
            <KeyRound className="h-4 w-4" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Change Password</span>
          </div>

          <PasswordInput label="Current Password" value={current} onChange={setCurrent} />
          <PasswordInput label="New Password" value={next} onChange={setNext} placeholder="Min 8 chars, 1 uppercase, 1 number/special char" />
          <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} />

          {pwError && (
            <p className="rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger-fg)]">
              {pwError}
            </p>
          )}

          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-2 text-xs text-[var(--success-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              Password updated successfully.
            </div>
          )}

          <button
            onClick={handlePasswordSubmit}
            disabled={passwordMutation.isPending}
            className="w-full rounded-xl bg-[var(--brand-500)] px-4 py-2.5 text-sm font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {passwordMutation.isPending ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}

      {/* Verification Modal overlay */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(6,9,19,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-bold text-[var(--foreground)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Verify Your Email Address
              </h3>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSendError("");
                  setSendSuccess(false);
                }}
                className="rounded-lg p-1.5 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-text)] leading-relaxed">
                To confirm account ownership and enable notifications, click below to receive a secure validation link on your registered address:
                <strong className="block text-[var(--foreground)] mt-2 font-mono text-xs">{email}</strong>
              </p>

              {sendSuccess ? (
                <div
                  className="rounded-xl border p-4 space-y-2"
                  style={{
                    background: "var(--success-bg)",
                    borderColor: "rgba(52,211,153,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--success-fg)]">
                    <CheckCircle2 className="h-4.5 w-4.5" /> Verification Link Sent!
                  </div>
                  <p className="text-xs text-[var(--subtle-text)] leading-relaxed">
                    Check your inbox and spam folders. Click the link within the email to verify your account.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleSendVerificationEmail}
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-3 text-sm font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-btn-text)]" />
                      Dispatching email…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Verification Email
                    </>
                  )}
                </button>
              )}

              {sendError && (
                <p className="rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-2.5 text-xs text-[var(--danger-fg)]">
                  {sendError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
