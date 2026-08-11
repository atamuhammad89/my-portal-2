"use client";

import React from "react";
import { motion } from "framer-motion";

export function BookingCalendar() {
  return (
    <section id="booking" className="py-24 relative bg-slate-50/60 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Direct Scheduling</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Book Your Strategy Call</h2>
          <p className="text-slate-600 text-lg">Schedule a consultation with our automation experts.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden min-h-[750px] w-full p-4 md:p-8"
        >
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
            <iframe
              src="https://yumnahhasan.youcanbook.me/"
              style={{ width: "100%", height: "900px", border: "none" }}
              title="Book a Strategy Call"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
