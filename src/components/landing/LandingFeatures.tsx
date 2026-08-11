"use client";

import { Mic, Zap, Shield, Globe, Clock, BarChart3, Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Bot,
    title: "Human-grade Voice AI",
    description: "Sub-300ms latency voice response engine natural enough to handle complex conversations smoothly.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a customer call, reservation, or lead during peak hours, holidays, or weekends.",
  },
  {
    icon: Zap,
    title: "Instant CRM & Cal Sync",
    description: "Automatically sync booked appointments, caller details, and call outcomes directly to your tools.",
  },
  {
    icon: BarChart3,
    title: "Real-time Call Analytics",
    description: "Complete transcripts, sentiment scoring, call duration metrics, and automated follow-ups.",
  },
  {
    icon: Shield,
    title: "Enterprise Reliability",
    description: "Built on high-availability telecom infrastructure with 99.9% uptime SLA and encrypted logs.",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description: "Agents capable of speaking fluently across global languages and regional dialects.",
  },
];

const getCardDelay = (i: number) => i * 0.1;


export function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-slate-50/70 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Everything you need to automate phone operations
          </h2>
          <p className="text-slate-600 text-lg">
            Purpose-built voice AI technology for high-volume customer interactions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: getCardDelay(i), ease: "easeOut" }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)" }}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm transition-all duration-300"
            >
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6"
              >
                <f.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
