"use client";

import React, { useState } from "react";
import { ChevronDown, ShieldCheck, Building2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    icon: ShieldCheck,
    question: "How secure is my data?",
    answer:
      "Security is foundational to CallAutomate. All call audio, transcripts, and customer data are encrypted in transit via TLS 1.3 and at rest using AES-256 encryption. We adhere to enterprise-grade compliance standards, strict multi-tenant data isolation, and robust access controls to ensure your sensitive business data is completely secure.",
  },
  {
    icon: Building2,
    question: "What industries benefit most from CallAutomate?",
    answer:
      "CallAutomate is built for high-volume service and sales environments. Industries that benefit most include Healthcare & Clinics (patient scheduling), Real Estate & Property Management (inbound lead qualification), Salons & Spas (booking management), Logistics & Dispatch (delivery tracking), Restaurants (reservation calls), and Professional Services (after-hours phone support).",
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-slate-50/50 relative border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center justify-center gap-1.5 mb-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-slate-600 text-lg mt-3">
            Learn more about data security, platform capabilities, and industry applications.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-lg hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <faq.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 mt-1 pl-[4.5rem]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
