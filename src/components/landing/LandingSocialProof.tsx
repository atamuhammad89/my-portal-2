"use client";

import React from "react";
import { Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const trustBadges = [
  { name: "Bright Health Dental", logo: "🏥 Bright Health" },
  { name: "Apex Real Estate", logo: "🏙️ Apex Realty" },
  { name: "Luxe Glow Salons", logo: "✨ Luxe Glow" },
  { name: "OmniLogistics Co", logo: "📦 OmniLogistics" },
  { name: "Bella Italia Group", logo: "🍷 Bella Italia" },
];

export function LandingSocialProof() {
  return (
    <section className="py-10 bg-slate-900 text-white border-y border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left: Headline & Rating */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center -space-x-2 overflow-hidden shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900">
                1K+
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900">
                4.9★
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-xs font-bold text-slate-300 ml-1.5 font-mono">4.9 / 5.0</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Trusted by over <strong className="text-white font-bold">1,000+ businesses</strong> automating calls 24/7
              </p>
            </div>
          </div>

          {/* Right: Client Logo Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-85">
            {trustBadges.map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-bold text-slate-300 flex items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <span>{badge.logo}</span>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
