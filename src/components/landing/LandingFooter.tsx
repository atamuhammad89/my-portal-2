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
            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/callautomate"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="Follow CallAutomate on LinkedIn"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/50 hover:shadow-lg hover:shadow-[#0A66C2]/10 transition-all group"
              >
                <svg className="w-4 h-4 fill-current text-slate-400 group-hover:text-[#0A66C2] transition-colors" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-1.3.7-1.92 1.63-1.92 1.08 0 1.37.79 1.37 1.92v4.93h2.54M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* Facebook link - replace href with your FB page URL when available */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Follow CallAutomate on Facebook (Add your link)"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:shadow-lg hover:shadow-[#1877F2]/10 transition-all group"
              >
                <svg className="w-4 h-4 fill-current text-slate-400 group-hover:text-[#1877F2] transition-colors" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.69c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.23 0-1.61.76-1.61 1.54V12h2.73l-.44 3h-2.29v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>

              {/* WhatsApp link */}
              <a
                href="https://wa.me/35361555222?text=Hi%20CallAutomate!%20I%20have%20a%20question%20about%20your%20AI%20Voice%20Receptionist."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat with CallAutomate on WhatsApp"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:shadow-lg hover:shadow-[#25D366]/10 transition-all group"
              >
                <svg className="w-4 h-4 fill-current text-slate-400 group-hover:text-[#25D366] transition-colors" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
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
              <a
                href="https://wa.me/35361555222?text=Hi%20CallAutomate!%20I%20have%20a%20question%20about%20your%20AI%20Voice%20Receptionist."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pt-1"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp Support</span>
              </a>
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
            <div className="h-3 w-[1px] bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/callautomate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#0A66C2] transition-colors"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-1.3.7-1.92 1.63-1.92 1.08 0 1.37.79 1.37 1.92v4.93h2.54M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#1877F2] transition-colors"
                aria-label="Facebook"
                title="Facebook (Add your link)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.69c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.23 0-1.61.76-1.61 1.54V12h2.73l-.44 3h-2.29v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/35361555222?text=Hi%20CallAutomate!%20I%20have%20a%20question%20about%20your%20AI%20Voice%20Receptionist."
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
                title="WhatsApp Support"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
