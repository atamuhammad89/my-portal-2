"use client";

import { Sliders, PhoneCall, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: Sliders,
    title: "Configure Agent & Prompts",
    description: "Choose your industry template or build custom prompts with specific business rules and FAQs.",
  },
  {
    number: "02",
    icon: PhoneCall,
    title: "Connect Phone Lines",
    description: "Assign dedicated local or toll-free phone numbers or forward your existing business number.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go Live & Automate",
    description: "Your AI agent handles inbound calls, books appointments, and logs full transcripts instantly.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">3-Step Onboarding</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-2 mb-4">
            How CallAutomate Works
          </h2>
          <p className="text-slate-600 text-lg">
            Set up your AI voice receptionist in less than 10 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}
              className="relative bg-slate-50 rounded-3xl p-8 border border-slate-200/80 hover:bg-white transition-all duration-300"
            >
              <motion.span
                initial={{ opacity: 0, scale: 1.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 + 0.3 }}
                className="text-5xl font-black text-slate-200 absolute top-6 right-6 font-mono"
              >
                {step.number}
              </motion.span>

              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20"
              >
                <step.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
