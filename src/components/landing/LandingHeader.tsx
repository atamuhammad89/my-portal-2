"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  ArrowRight,
  Utensils,
  Scissors,
  Building2,
  Truck,
  Stethoscope,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { TrialBanner } from "./TrialBanner";

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg hover:scale-105 transition-transform duration-300">
    <defs>
      <linearGradient id="c-gradient-final" x1="256" y1="50" x2="256" y2="462" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#A855F7" />
        <stop offset="0.5" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="robot-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <path 
      d="M385 130C345 85 290 60 230 60C120 60 35 150 35 260C35 370 120 460 230 460C300 460 365 425 410 375" 
      stroke="url(#c-gradient-final)" 
      strokeWidth="82" 
      strokeLinecap="round" 
      fill="none"
    />
    <path 
      d="M325 190C305 160 270 145 230 145C165 145 110 195 110 260C110 325 165 375 230 375C270 375 305 360 325 330" 
      fill="#000000" 
    />
    <g transform="translate(148, 160) scale(0.92)">
      <path d="M35 125C35 45 185 45 185 125" stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
      <rect x="30" y="85" width="160" height="135" rx="45" fill="url(#robot-cyan)" stroke="#1e293b" strokeWidth="8" />
      <rect x="48" y="105" width="124" height="95" rx="28" fill="white" />
      <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M78 142C82 138 92 138 96 142" />
        <path d="M124 142C128 138 138 138 142 142" />
        <path d="M95 175C105 185 135 185 145 175" />
      </g>
    </g>
  </svg>
);

interface LandingHeaderProps {
  onNavigate: (view: string) => void;
  onUpgradeClick?: () => void;
}

const industriesList = [
  { id: "industry-restaurant", label: "Restaurants & Takeaways", icon: Utensils },
  { id: "industry-salon", label: "Salons & Spas", icon: Scissors },
  { id: "industry-real-estate", label: "Real Estate", icon: Building2 },
  { id: "industry-logistics", label: "Logistics", icon: Truck },
  { id: "industry-healthcare", label: "Healthcare", icon: Stethoscope },
  { id: "industry-retail", label: "Retail", icon: ShoppingBag },
];

export function LandingHeader({ onNavigate, onUpgradeClick }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-3 px-4 sm:px-6 transition-all duration-300 pointer-events-none">
      {/* Top Navbar Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-[1360px] mx-auto pointer-events-auto"
      >
        <div
          className={`flex items-center justify-between h-16 px-4 sm:px-6 rounded-full transition-all duration-300 ${
            scrolled
              ? "bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_rgba(0,0,0,0.08),0_0_20px_rgba(255,255,255,0.9)_inset]"
              : "bg-white/70 backdrop-blur-lg border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
          }`}
        >
          {/* Logo */}
          <div onClick={() => handleNavClick("home")} className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0">
            <Logo />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">
              CallAutomate
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <button onClick={() => handleNavClick("features")} className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
              Features <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Industries Dropdown with seamless hover bridge */}
            <div
              className="relative group"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer py-2">
                Industries <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              <div className={`absolute top-full left-0 pt-2 w-60 transition-all duration-200 origin-top-left ${dropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"}`}>
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100/90 py-2">
                  {industriesList.map((ind) => {
                    const Icon = ind.icon;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => handleNavClick(ind.id)}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-semibold flex items-center gap-2.5 cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{ind.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={() => handleNavClick("how-it-works")} className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors cursor-pointer">
              How it Works
            </button>
            <button onClick={() => handleNavClick("pricing")} className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors cursor-pointer">
              Pricing
            </button>
            <button onClick={() => handleNavClick("contact")} className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors cursor-pointer">
              Contact Us
            </button>
          </div>

          {/* Right Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <TrialBanner onUpgradeClick={onUpgradeClick} />

            <button
              onClick={() => handleNavClick("booking")}
              className="group relative bg-[#0B0E1A] hover:bg-[#1B2036] text-white pl-5 pr-2 py-1.5 rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(124,92,252,0.4),0_0_10px_rgba(34,211,238,0.3)] hover:scale-[1.02] flex items-center gap-3 cursor-pointer"
            >
              <span>Book a Demo</span>
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-900 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-600" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer & Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden pointer-events-auto"
            />

            {/* Mobile Glass Card Container */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-50 md:hidden mt-2 pointer-events-auto max-w-[1360px] mx-auto"
            >
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl p-5 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3">
                <button
                  onClick={() => handleNavClick("features")}
                  className="w-full text-left text-slate-800 font-bold py-2.5 px-4 hover:bg-slate-100/80 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Features
                </button>

                {/* Industries Accordion */}
                <div className="space-y-1">
                  <button
                    onClick={() => setMobileIndustriesOpen(!mobileIndustriesOpen)}
                    className="w-full flex items-center justify-between text-slate-800 font-bold py-2.5 px-4 hover:bg-slate-100/80 rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-2">Industries</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileIndustriesOpen ? "rotate-180 text-indigo-600" : "text-slate-400"}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileIndustriesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3 pr-1 space-y-1"
                      >
                        {industriesList.map((ind) => {
                          const Icon = ind.icon;
                          return (
                            <button
                              key={ind.id}
                              onClick={() => handleNavClick(ind.id)}
                              className="w-full flex items-center justify-between text-left py-2 px-3.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl font-semibold transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                                {ind.label}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => handleNavClick("how-it-works")}
                  className="w-full text-left text-slate-800 font-bold py-2.5 px-4 hover:bg-slate-100/80 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  How it Works
                </button>

                <button
                  onClick={() => handleNavClick("pricing")}
                  className="w-full text-left text-slate-800 font-bold py-2.5 px-4 hover:bg-slate-100/80 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Pricing
                </button>

                <button
                  onClick={() => handleNavClick("contact")}
                  className="w-full text-left text-slate-800 font-bold py-2.5 px-4 hover:bg-slate-100/80 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Contact Us
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleNavClick("booking")}
                    className="w-full bg-[#0B0E1A] hover:bg-[#1B2036] text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <span>Book a Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {isAuthenticated && user ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <LayoutDashboard className="w-4 h-4 text-white" />
                      <span>Go to Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <LogIn className="w-4 h-4 text-slate-600" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

