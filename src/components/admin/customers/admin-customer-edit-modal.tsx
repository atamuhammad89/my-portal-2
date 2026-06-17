// src/components/admin/customers/admin-customer-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Eye, EyeOff, CheckCircle2, UserCog } from "lucide-react";
import { AdminCustomer } from "@/types/admin/customer";
import { apiClient } from "@/lib/api-client";

type Props = {
  customer: AdminCustomer;
  onClose: () => void;
};

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

export function AdminCustomerEditModal({ customer, onClose }: Props) {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(customer.fullName);
  const [email, setEmail] = useState(customer.email);
  const [isActive, setIsActive] = useState(customer.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFullName(customer.fullName);
    setEmail(customer.email);
    setIsActive(customer.isActive);
  }, [customer]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { fullName, email, isActive };
      if (newPassword) body.newPassword = newPassword;

      const res = await apiClient.patch(`/admin/customers/${customer.id}`, body);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setFieldError("");
      setNewPassword("");
      setConfirmPassword("");
      // Invalidate customers queries so the table refreshes
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setFieldError(err?.message ?? "Something went wrong.");
    },
  });

  function handleSubmit() {
    setFieldError("");
    if (!fullName.trim()) { setFieldError("Name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setFieldError("A valid email is required."); return; }
    if (newPassword) {
      if (newPassword.length < 8) { setFieldError("Password must be at least 8 characters."); return; }
      if (!/[A-Z]/.test(newPassword)) { setFieldError("Password must include at least one uppercase letter."); return; }
      if (!(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword))) {
        setFieldError("Password must include at least one number or special character.");
        return;
      }
      if (newPassword !== confirmPassword) { setFieldError("Passwords do not match."); return; }
    }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-[var(--brand-500)]">
            <UserCog className="h-4 w-4" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Edit Customer</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-500 outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-500 outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
            />
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 bg-[var(--surface-2)]">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Account Status</p>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">Enable or disable customer access</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? "bg-[var(--brand-500)]" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-6 bg-[var(--background)]" : "translate-x-1 bg-slate-400"
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--subtle-text)] font-medium">Password (leave blank to keep current)</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Min 8 chars, 1 uppercase, 1 number/special char"
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          {fieldError && (
            <p className="rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger-fg)]">
              {fieldError}
            </p>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-2 text-xs text-[var(--success-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              Customer updated successfully.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="rounded-xl bg-[var(--brand-500)] px-5 py-2 text-sm font-bold text-[var(--brand-btn-text)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition disabled:opacity-50 cursor-pointer"
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}