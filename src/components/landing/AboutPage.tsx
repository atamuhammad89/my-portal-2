"use client";

import React from "react";
import { Sparkles, Shield, Zap, Heart } from "lucide-react";

export function AboutPage() {
  return (
    <div className="pt-24 pb-20 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Story</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Building the AI Voice Platform for Modern Business
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-16">
          CallAutomate was founded to solve a simple yet massive problem: businesses losing millions of dollars and thousands of hours due to missed calls and overcrowded phone lines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Speed & Precision</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sub-300ms real-time audio latency ensures natural, fluid conversations indistinguishable from human agents.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise Security</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              SOC-2 compliant architecture with strict data encryption standards protecting caller privacy.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Customer First</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dedicated engineering and telecom SLA support to help your team scale without friction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
