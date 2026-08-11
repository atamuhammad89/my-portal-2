"use client";

import React from "react";
import { PhoneMissed, Users, Clock, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export function LandingProblem() {
  const problems = [
    {
      icon: PhoneMissed,
      title: "Missed Revenue",
      desc: "67% of customers hang up if sent to voicemail. Every missed call is a lost opportunity.",
    },
    {
      icon: Users,
      title: "Staff Burnout",
      desc: "Your team spends hours on repetitive FAQs and scheduling instead of high-value tasks.",
    },
    {
      icon: Clock,
      title: "Limited Availability",
      desc: "Business hours limit your growth. Customers want answers at 9 PM, not 9 AM.",
    },
    {
      icon: HelpCircle,
      title: "Inconsistent Service",
      desc: "Manual training takes time. Human moods vary. AI delivers perfection every time.",
    },
  ];

  return (
    <section className="py-24 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">The Hidden Cost of Silence</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Traditional phone systems leak revenue. Modern businesses need modern voice automation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.12, ease: "easeOut" }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              className="h-full p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-white transition-all duration-300 group"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.12 + 0.2, type: "spring", stiffness: 200 }}
                className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              >
                <item.icon className="w-6 h-6 text-red-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
