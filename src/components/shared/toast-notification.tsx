"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastMessage = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function ToastNotification({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-md w-full animate-bounce-short pointer-events-auto">
      <div
        className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3.5 backdrop-blur-md transition-all duration-300 ${
          isSuccess
            ? "bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/10"
            : isError
            ? "bg-slate-900/95 border-rose-500/40 text-white shadow-rose-500/10"
            : "bg-slate-900/95 border-cyan-500/40 text-white shadow-cyan-500/10"
        }`}
      >
        {/* Icon */}
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isSuccess
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : isError
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>

        {/* Text Body */}
        <div className="flex-1 min-w-0 pr-2">
          <h4
            className={`text-xs font-black uppercase tracking-wider ${
              isSuccess ? "text-emerald-400" : isError ? "text-rose-400" : "text-cyan-400"
            }`}
          >
            {toast.title}
          </h4>
          <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
