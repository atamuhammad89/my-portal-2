"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12"
        >
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footer-c-gradient" x1="256" y1="50" x2="256" y2="462" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#A855F7" />
                    <stop offset="0.5" stopColor="#4F46E5" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="footer-robot-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#0891B2" />
                  </linearGradient>
                </defs>
                <path d="M385 130C345 85 290 60 230 60C120 60 35 150 35 260C35 370 120 460 230 460C300 460 365 425 410 375" stroke="url(#footer-c-gradient)" strokeWidth="82" strokeLinecap="round" fill="none" />
                <path d="M325 190C305 160 270 145 230 145C165 145 110 195 110 260C110 325 165 375 230 375C270 375 305 360 325 330" fill="#000000" />
                <g transform="translate(148, 160) scale(0.92)">
                  <path d="M35 125C35 45 185 45 185 125" stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
                  <rect x="30" y="85" width="160" height="135" rx="45" fill="url(#footer-robot-cyan)" stroke="#1e293b" strokeWidth="8" />
                  <rect x="48" y="105" width="124" height="95" rx="28" fill="white" />
                  <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" fill="none">
                    <path d="M78 142C82 138 92 138 96 142" />
                    <path d="M124 142C128 138 138 138 142 142" />
                    <path d="M95 175C105 185 135 185 145 175" />
                  </g>
                </g>
              </svg>
              <span className="text-xl font-bold text-white tracking-tight">CallAutomate</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Voice AI Receptionist & Call Automation Infrastructure.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              <li><a href="#live-demo" className="hover:text-white transition-colors">Live Interactive Demo</a></li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Account & Portal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Create Account (30-Day Trial)</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Client Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Contact</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>support@callautomate.ai</span>
              </div>
              <p className="pt-2 text-[11px]">24/7 Monitoring & Telecom SLA Support</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4"
        >
          <p>© {new Date().getFullYear()} CallAutomate AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Settings</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
