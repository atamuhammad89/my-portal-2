"use client";

import React from "react";
import { ArrowRight, Zap, CheckCircle2, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { IndustryData } from "@/data/industries";
import { AnimatedIndustryDemo } from "./AnimatedIndustryDemo";
import { SoftwareIntegrationsSection } from "./SoftwareIntegrationsSection";

interface IndustryPageProps {
  data: IndustryData;
  onDemoClick: () => void;
  onNavigate?: (view: string) => void;
}

export function IndustryPage({ data, onDemoClick, onNavigate }: IndustryPageProps) {
  const themeColors = {
    purple: { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50", gradient: "from-purple-600 to-pink-500", border: "border-purple-200" },
    blue: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", gradient: "from-blue-600 to-cyan-500", border: "border-blue-200" },
    green: { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", gradient: "from-emerald-600 to-teal-500", border: "border-emerald-200" },
    orange: { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-50", gradient: "from-orange-500 to-red-500", border: "border-orange-200" },
    cyan: { bg: "bg-cyan-600", text: "text-cyan-600", light: "bg-cyan-50", gradient: "from-cyan-500 to-blue-500", border: "border-cyan-200" }
  };

  const theme = themeColors[data.colorTheme as keyof typeof themeColors] || themeColors.purple;

  return (
    <div className="pt-24 w-full max-w-full overflow-x-hidden">
      {/* ── Hero Section ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.light} to-white -z-10 opacity-50`} />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 shadow-sm"
          >
            <data.icon className={`w-3.5 h-3.5 ${theme.text}`} />
            {data.name}
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, type: "spring", stiffness: 80, damping: 18 }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight break-words max-w-full px-2"
          >
            {data.hero.title} <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
              {data.hero.highlight}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 px-4"
          >
            {data.hero.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full px-4 sm:px-0 max-w-sm sm:max-w-none mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onDemoClick}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg cursor-pointer text-center"
            >
              Try Live Demo
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href="#booking"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all shadow-sm text-center"
            >
              Book Strategy Call
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ── Interactive Voice Flow Simulation ── */}
      <AnimatedIndustryDemo data={data} />

      {/* ── How It Works Flow ── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900">How It Works for {data.name}</h2>
            <p className="text-slate-500 mt-2">Seamless automation from call to resolution.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
              className="flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full md:w-64 h-full min-h-[220px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-16 h-16 ${theme.light} rounded-full flex items-center justify-center mb-4`}
              >
                <data.flow.step1.icon className={`w-8 h-8 ${theme.text}`} />
              </motion.div>
              <h3 className="font-bold text-slate-900">{data.flow.step1.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{data.flow.step1.desc}</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.15, type: "spring", stiffness: 100, damping: 15 }}
              className="flex flex-col items-center text-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl w-full md:w-64 transform md:-translate-y-4 h-full min-h-[240px]"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(99,102,241,0.3)",
                    "0 0 0 16px rgba(99,102,241,0)",
                    "0 0 0 0 rgba(99,102,241,0)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 relative"
              >
                <data.flow.step2.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="font-bold text-white">{data.flow.step2.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{data.flow.step2.desc}</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
              className="flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full md:w-64 h-full min-h-[220px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.35, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4"
              >
                <data.flow.step3.icon className="w-8 h-8 text-green-600" />
              </motion.div>
              <h3 className="font-bold text-slate-900">{data.flow.step3.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{data.flow.step3.desc}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── POS & Systems Integration Section with Auto-Sliding Marquee ── */}
      {data.posIntegrations && (
        <SoftwareIntegrationsSection
          data={data}
          onContactClick={() => onNavigate ? onNavigate("contact") : undefined}
        />
      )}

      {/* ── Use Cases ── */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-center mb-16"
          >
            Handles Real Industry Conversations
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.useCases.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}
                className="bg-white p-8 rounded-3xl border border-slate-200 transition-all duration-300"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 + 0.2, type: "spring", stiffness: 200 }}
                  className={`w-12 h-12 ${theme.light} rounded-xl flex items-center justify-center mb-6`}
                >
                  <card.icon className={`w-6 h-6 ${theme.text}`} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{card.title}</h3>
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.12 + 0.3 }}
                    className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                  >
                    <span className="text-xs font-bold text-slate-400 block mb-1">{card.trigger}</span>
                    <p className="text-sm font-medium text-slate-700">"{card.query}"</p>
                  </motion.div>
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.12 + 0.4 }}
                    >
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.12 + 0.45 }}
                    className={`${theme.light} p-3 rounded-lg border border-slate-100`}
                  >
                    <span className={`text-xs font-bold ${theme.text} block mb-1 opacity-70`}>AI Action:</span>
                    <p className={`text-sm ${theme.text} font-medium`}>{card.response}</p>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Stats ── */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold mb-12"
          >
            ROI You Can Measure
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {data.stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1, type: "spring", stiffness: 120 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="p-6 bg-white/5 rounded-2xl backdrop-blur border border-white/10"
              >
                <div className={`text-4xl md:text-5xl font-bold ${theme.text} mb-2 brightness-125`}>
                  {stat.val}<span className="text-2xl opacity-70">{stat.suffix}</span>
                </div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

