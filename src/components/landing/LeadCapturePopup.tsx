"use client";

import React, { useState } from "react";
import { X, User, Mail, Sparkles, Loader2, AlertCircle, MousePointer2 } from "lucide-react";

interface LeadCapturePopupProps {
  onSuccess: (data: { name: string; email: string; interestType: string }) => void;
  onCancel: () => void;
}

export function LeadCapturePopup({ onSuccess, onCancel }: LeadCapturePopupProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    interestType: "", // 'Buying' | 'Testing'
    agreeData: false,
    agreeMarketing: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) return false;

    const parts = trimmedEmail.split("@");
    if (parts.length !== 2) return false;
    const domainParts = parts[1].split(".");
    if (domainParts.length < 2) return false;

    const mainDomain = domainParts[0];
    if (mainDomain.length > 45) return false;
    const repetitionRegex = /(.{2,})\1{3,}/;
    if (repetitionRegex.test(mainDomain)) return false;

    return true;
  };

  const isEmailInvalid = emailTouched && formData.email.length > 0 && !isValidEmail(formData.email);

  const isFormValid =
    formData.name.trim().length >= 2 &&
    isValidEmail(formData.email) &&
    formData.interestType !== "" &&
    formData.agreeData === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isValidEmail(formData.email)) {
      setError("Please re-enter a valid email address.");
      return;
    }

    if (!isFormValid) {
      setError("Please fill all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Post to lead collection endpoint or Google Script
      await fetch(
        "https://script.google.com/macros/s/AKfycbw9fXDVZPTPiSOMXiNDtJeDaWlaul1VTE94qkZtOKj1KNzyaHZ8MjiOlm_Tz723uufhVg/exec",
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            interestType: formData.interestType,
            message: `[Live Demo Access] Interest: ${formData.interestType}`,
            dataConsent: formData.agreeData,
            marketingConsent: formData.agreeMarketing,
            source: "Live Demo Popup",
          }),
          mode: "no-cors",
        }
      );

      onSuccess(formData);
    } catch (err) {
      console.error("Lead capture error:", err);
      // Even if network fails, allow demo access after capture attempt
      onSuccess(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-200">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Unlock Live Demo</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enter your info to start demo</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, name: e.target.value }));
                    if (error) setError(null);
                  }}
                  className="w-full px-5 py-4 pl-11 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-medium text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onBlur={() => setEmailTouched(true)}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, email: e.target.value }));
                    if (error) setError(null);
                  }}
                  className={`w-full px-5 py-4 pl-11 rounded-2xl bg-slate-50 border ${
                    isEmailInvalid ? "border-red-500 ring-2 ring-red-50" : "border-slate-200"
                  } focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-medium text-sm`}
                  placeholder="name@company.com"
                />
              </div>
              {isEmailInvalid && (
                <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Invalid email format. Please re-enter a valid email address.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Primary Interest *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, interestType: "Buying" }))}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all ${
                    formData.interestType === "Buying"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${formData.interestType === "Buying" ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>I'm Buying</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, interestType: "Testing" }))}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all ${
                    formData.interestType === "Testing"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <MousePointer2 className={`w-4 h-4 ${formData.interestType === "Testing" ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>Just Testing</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.agreeData}
                  onChange={(e) => setFormData((f) => ({ ...f, agreeData: e.target.checked }))}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                  I consent to data processing *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.agreeMarketing}
                  onChange={(e) => setFormData((f) => ({ ...f, agreeMarketing: e.target.checked }))}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                  I'd like to receive news and updates
                </span>
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs border border-red-100 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                ) : (
                  <span className="uppercase tracking-wider text-xs font-black">Access Live Demo</span>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 rounded-2xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Cancel and return
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
