"use client";

import { X, Sparkles, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = "Your 30-Day Free Trial Has Expired",
  description = "Upgrade to a paid plan to unlock unlimited AI outbound calls, dedicated phone numbers, and full dashboard analytics.",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-slate-900 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Unlimited AI Voice Agent Minutes</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Custom Prompts & Knowledge Base Uploads</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Real-time Call Analytics & Transcripts</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>View Pricing Plans</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
          >
            Close preview
          </button>
        </div>
      </div>
    </div>
  );
}
