"use client";

import React from "react";
import { Star, Quote, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Dr. Elena Rostova",
    role: "Clinical Director",
    company: "Bright Health Dental",
    metric: "+310% Booking Efficiency",
    quote:
      "CallAutomate transformed our front desk operations. The AI receptionist handles over 400 patient booking calls per week with sub-300ms response times and zero missed calls during peak hours.",
    rating: 5,
  },
  {
    name: "Marcus Vance",
    role: "VP of Sales Operations",
    company: "Apex Real Estate Group",
    metric: "45 hrs Saved / Week",
    quote:
      "Our agents used to spend half their day qualifying phone leads. CallAutomate handles buyer qualification and syncs viewings directly into Salesforce instantly.",
    rating: 5,
  },
  {
    name: "Sophia Chen",
    role: "Founder & CEO",
    company: "Luxe Glow Salons",
    metric: "99.4% Call Resolution",
    quote:
      "After-hours appointment requests used to go straight to voicemail. With CallAutomate, 99.4% of callers lock in their appointments immediately without staff intervention.",
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center justify-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Verified Customer Case Studies
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Industry Leaders
          </h2>
          <p className="text-slate-600 text-lg mt-3">
            See how CallAutomate drives measurable operational efficiency and revenue growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}
              className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between hover:bg-white hover:border-indigo-200 transition-all duration-300 relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {item.metric}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <Quote className="w-8 h-8 text-indigo-200 mb-4 group-hover:text-indigo-400 transition-colors" />

                <p className="text-slate-700 text-sm leading-relaxed mb-6 font-sans italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.role} · <span className="font-medium text-slate-700">{item.company}</span></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
