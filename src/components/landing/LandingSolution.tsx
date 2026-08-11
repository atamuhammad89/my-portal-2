"use client";

import React from "react";
import { Phone, ArrowRight, Database, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function LandingSolution() {
  const flowSteps = [
    {
      icon: Phone,
      title: "Inbound Call",
      desc: "Customer calls your business number.",
      size: "w-24 h-24",
      bg: "bg-white border border-slate-200",
    },
    null, // arrow placeholder
    {
      icon: null,
      title: "CallAutomate AI Agent",
      desc: "Converses naturally, answers FAQs, and qualifies leads in real-time.",
      size: "w-32 h-32",
      bg: "bg-slate-900 border-4 border-white shadow-2xl",
      center: true,
    },
    null, // arrow placeholder
    {
      icon: null,
      title: "Action Taken",
      desc: "Appointment booked in CRM or ticket created.",
      size: "w-24 h-24",
      bg: "bg-white border border-slate-200",
      icons: [Calendar, Database],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">End-To-End Automation</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">The Intelligent Workflow</h2>
          <p className="text-slate-600 text-lg">Seamless integration from hello to booked appointment.</p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Step 1 — Inbound Call */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-xs group"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-lg relative transition-transform duration-300"
            >
              <Phone className="w-8 h-8 text-slate-700" />
            </motion.div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Inbound Call</h3>
            <p className="text-sm text-slate-600">Customer calls your business number.</p>
          </motion.div>

          {/* Arrow 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <ArrowRight className="hidden md:block w-8 h-8 text-slate-400 animate-pulse" />
          </motion.div>

          {/* Center — AI Agent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
            className="relative flex flex-col items-center text-center max-w-xs z-10"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0.2)", "0 0 0 20px rgba(99,102,241,0)", "0 0 0 0 rgba(99,102,241,0)"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-slate-900 border-4 border-white shadow-2xl flex items-center justify-center mb-8 relative"
            >
              <div className="bg-indigo-600 rounded-full p-5 shadow-lg">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
            </motion.div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">CallAutomate AI Agent</h3>
            <p className="text-sm text-slate-600">Converses naturally, answers FAQs, and qualifies leads in real-time.</p>
          </motion.div>

          {/* Arrow 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <ArrowRight className="hidden md:block w-8 h-8 text-slate-400 animate-pulse" />
          </motion.div>

          {/* Step 3 — Action Taken */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-xs group"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-lg transition-transform duration-300"
            >
              <div className="grid grid-cols-2 gap-2">
                <Calendar className="w-6 h-6 text-slate-700" />
                <Database className="w-6 h-6 text-slate-700" />
              </div>
            </motion.div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Action Taken</h3>
            <p className="text-sm text-slate-600">Appointment booked in CRM or ticket created.</p>
          </motion.div>
        </div>

        {/* Stats bar — slide up */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"
        >
          {[
            { label: "Response Time", val: "< 300ms" },
            { label: "Availability", val: "24/7/365" },
            { label: "Cost Savings", val: "Up to 80%" },
            { label: "Scalability", val: "Unlimited" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{stat.val}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
