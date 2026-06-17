// src/components/admin/customers/admin-customer-change-password.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export function AdminCustomerChangePassword({ userId, userName }: { userId: string; userName: string }) {
  const [newPw, setNewPw] = useState("");
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/admin/users/${userId}/change-password`, {
        newPassword: newPw,
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setNewPw("");
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err: any) => {
      setFieldError(err?.response?.data?.error ?? "Failed to update password.");
    },
  });

  function handleSubmit() {
    setFieldError("");
    setSuccess(false);
    if (!newPw) {
      setFieldError("Password is required."); return;
    }
    if (newPw.length < 8) {
      setFieldError("Password must be at least 8 characters."); return;
    }
    if (!/[A-Z]/.test(newPw)) {
      setFieldError("Password must include at least one uppercase letter."); return;
    }
    if (!(/[0-9]/.test(newPw) || /[^A-Za-z0-9]/.test(newPw))) {
      setFieldError("Password must include at least one number or special character."); return;
    }
    mutation.mutate();
  }

  return (
    <section
      className="rounded-2xl bg-white p-5 space-y-4"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-center gap-2 text-indigo-600">
        <KeyRound className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Reset Password for {userName}</h3>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          New Password
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 number/special char"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {fieldError && (
        <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600 max-w-sm">
          {fieldError}
        </p>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 max-w-sm">
          <CheckCircle2 className="h-4 w-4" />
          Password updated successfully.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? "Updating…" : "Set New Password"}
      </button>
    </section>
  );
}