"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";
import { Globe, Plane } from "lucide-react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
}

// ── SVG Country Flag Components for Cross-Platform Compatibility ──
function CanadaFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-[3px] shadow-sm shrink-0 overflow-hidden" viewBox="0 0 600 300">
      <rect width="600" height="300" fill="#FF0000" />
      <rect x="150" width="300" height="300" fill="#FFFFFF" />
      <path
        d="M300 40l12 38 25-18-6 29 30 4-21 20 23 23-32-4 4 38-34-20-34 20 4-38-32 4 23-23-21-20 30-4-6-29 25 18z"
        fill="#FF0000"
      />
    </svg>
  );
}

function UKFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-[3px] shadow-sm shrink-0 overflow-hidden" viewBox="0 0 60 30">
      <clipPath id="uk-clip-auth">
        <rect width="60" height="30" rx="2" />
      </clipPath>
      <g clipPath="url(#uk-clip-auth)">
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#00247D" strokeWidth="30" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" strokeWidth="4" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#CF142B" strokeWidth="6" />
      </g>
    </svg>
  );
}

const EU_STAR_POSITIONS = [
  { x: 0, y: -150 },
  { x: 75, y: -129.9 },
  { x: 129.9, y: -75 },
  { x: 150, y: 0 },
  { x: 129.9, y: 75 },
  { x: 75, y: 129.9 },
  { x: 0, y: 150 },
  { x: -75, y: 129.9 },
  { x: -129.9, y: 75 },
  { x: -150, y: 0 },
  { x: -129.9, y: -75 },
  { x: -75, y: -129.9 },
];

function EUFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-[3px] shadow-sm shrink-0 overflow-hidden" viewBox="0 0 810 540">
      <rect width="810" height="540" fill="#003399" />
      <g fill="#FFCC00" transform="translate(405,270)">
        {EU_STAR_POSITIONS.map((pos, i) => (
          <polygon
            key={i}
            transform={`translate(${pos.x},${pos.y}) scale(22)`}
            points="0,-1 0.588,0.809 -0.951,-0.309 0.951,-0.309 -0.588,0.809"
          />
        ))}
      </g>
    </svg>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen w-full relative overflow-hidden flex flex-col justify-between p-2 sm:p-3 md:p-4 selection:bg-indigo-500/20 transition-colors duration-200"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* ── Background Mesh & Wave Gradient ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft pastel aurora blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-3xl" />

        {/* Decorative Wave Curves */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[220px] opacity-15"
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,160 C320,300 420,0 720,120 C1020,240 1120,80 1440,190 L1440,320 L0,320 Z"
            fill="currentColor"
            className="text-purple-500"
          />
        </svg>
      </div>

      {/* ── Top Header Navigation Bar ── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 py-1.5 shrink-0 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <CallAutomateLogoIcon className="w-7 h-7 shrink-0 transition-transform group-hover:scale-105" size={28} />
          <span className="text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Call<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">Automate</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main Dual-Column Content (Single Page Viewport) ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 py-1 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center max-h-full">

          {/* ── LEFT COLUMN: Global Reach Showcase & Graphics ── */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-3 lg:space-y-3.5 pr-0 lg:pr-2">
            
            {/* Title & Subtitle */}
            <div className="space-y-1.5 max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-[1.15]"
                style={{ color: "var(--foreground)" }}
              >
                Intelligent Voice Automation Across the{" "}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Globe
                  <svg
                    className="absolute -bottom-1 left-0 w-full text-purple-500/80"
                    viewBox="0 0 120 12"
                    fill="none"
                  >
                    <path
                      d="M3 9C40 2 80 2 117 9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-xs lg:text-xs xl:text-sm leading-relaxed"
                style={{ color: "var(--muted-text)" }}
              >
                Powering conversations and automation for businesses in{" "}
                <span className="font-bold text-red-400 inline-flex items-baseline gap-1">Canada</span>,{" "}
                <span className="font-bold text-blue-400 inline-flex items-baseline gap-1">Europe</span>, and the{" "}
                <span className="font-bold text-purple-400 inline-flex items-baseline gap-1">UK</span>.
              </motion.p>
            </div>

            {/* ── Central Globe Vector Graphic (Shifted Right) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-full max-w-md h-[210px] xl:h-[240px] mx-auto lg:ml-auto lg:mr-4 xl:mr-8 flex items-center justify-center lg:translate-x-6"
            >
              {/* Globe Outer Glow */}
              <div className="absolute w-[190px] h-[190px] rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-xl animate-pulse" />

              {/* 3D Translucent Globe Vector SVG */}
              <div
                className="relative w-[180px] h-[180px] rounded-full border shadow-xl flex items-center justify-center overflow-hidden transition-colors duration-200"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Globe Latitude / Longitude Mesh Lines */}
                <svg className="absolute inset-0 w-full h-full text-indigo-400/30" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="89" fill="none" stroke="currentColor" strokeWidth="1" />
                  <ellipse cx="90" cy="90" rx="89" ry="44" fill="none" stroke="currentColor" strokeWidth="1" />
                  <ellipse cx="90" cy="90" rx="44" ry="89" fill="none" stroke="currentColor" strokeWidth="1" />
                  <line x1="0" y1="90" x2="180" y2="90" stroke="currentColor" strokeWidth="1" />
                  <line x1="90" y1="0" x2="90" y2="180" stroke="currentColor" strokeWidth="1" />
                </svg>

                {/* World Map Dotted Pattern Overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(#4F46E5 1px, transparent 1px)`,
                    backgroundSize: "9px 9px",
                  }}
                />
              </div>

              {/* Flight Arc Trajectories & Nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 350 240">
                <path
                  d="M 50,75 Q 130,30 220,130"
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M 110,150 Q 190,110 260,95"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                <circle cx="50" cy="75" r="3.5" fill="#EF4444" className="animate-ping opacity-75" />
                <circle cx="50" cy="75" r="3" fill="#EF4444" />
                
                <circle cx="110" cy="150" r="3.5" fill="#3B82F6" className="animate-ping opacity-75" />
                <circle cx="110" cy="150" r="3" fill="#3B82F6" />

                <circle cx="260" cy="95" r="3.5" fill="#8B5CF6" className="animate-ping opacity-75" />
                <circle cx="260" cy="95" r="3" fill="#8B5CF6" />
              </svg>

              {/* Floating Paper Airplane Icon */}
              <div className="absolute top-[50px] right-[90px] z-20 text-indigo-400 animate-bounce">
                <Plane className="w-4 h-4 -rotate-45 drop-shadow" />
              </div>

              {/* ── FLOATING COUNTRY PILL CARDS WITH REAL SVG FLAGS ── */}

              {/* 🇨🇦 Canada Card */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                whileHover={{ scale: 1.05 }}
                className="absolute top-[25px] left-[-10px] sm:left-[0px] z-30 backdrop-blur-xl border rounded-xl p-1.5 pr-3 shadow-lg flex items-center gap-2 transition-colors duration-200"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <CanadaFlag />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold leading-none" style={{ color: "var(--foreground)" }}>Canada</h4>
                  <p className="text-[8px] mt-0.5 font-medium" style={{ color: "var(--muted-text)" }}>North America</p>
                </div>
              </motion.div>

              {/* 🇬🇧 United Kingdom Card */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                whileHover={{ scale: 1.05 }}
                className="absolute top-[75px] right-[-10px] sm:right-[0px] z-30 backdrop-blur-xl border rounded-xl p-1.5 pr-3 shadow-lg flex items-center gap-2 transition-colors duration-200"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <UKFlag />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold leading-none" style={{ color: "var(--foreground)" }}>United Kingdom</h4>
                  <p className="text-[8px] mt-0.5 font-medium" style={{ color: "var(--muted-text)" }}>Building Connections</p>
                </div>
              </motion.div>

              {/* 🇪🇺 Europe Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                whileHover={{ scale: 1.05 }}
                className="absolute bottom-[5px] left-[30px] sm:left-[40px] z-30 backdrop-blur-xl border rounded-xl p-1.5 pr-3 shadow-lg flex items-center gap-2 transition-colors duration-200"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <EUFlag />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold leading-none" style={{ color: "var(--foreground)" }}>Europe</h4>
                  <p className="text-[8px] mt-0.5 font-medium" style={{ color: "var(--muted-text)" }}>Connecting Businesses</p>
                </div>
              </motion.div>

            </motion.div>

            {/* ── Bottom Feature Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="max-w-sm backdrop-blur-xl border rounded-xl p-2.5 px-3 shadow-md flex items-center gap-2.5 transition-colors duration-200"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold" style={{ color: "var(--foreground)" }}>Global Reach. Local Impact.</h4>
                <p className="text-[9px] leading-tight" style={{ color: "var(--muted-text)" }}>
                  Delivering smarter customer experiences wherever your business is.
                </p>
              </div>
            </motion.div>

          </div>

          {/* ── RIGHT COLUMN: Auth Card Form (No Bottom Clipping) ── */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end min-h-0 max-h-full">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full max-w-md rounded-[1.75rem] p-5 sm:p-6 shadow-2xl border relative z-20 max-h-[82vh] sm:max-h-[85vh] overflow-y-auto transition-colors duration-200"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {children}
            </motion.div>
          </div>

        </div>
      </main>

      {/* ── Footer copyright line ── */}
      <footer className="relative z-10 w-full text-center py-1 text-[10px] shrink-0" style={{ color: "var(--subtle-text)" }}>
        © {new Date().getFullYear()} CallAutomate AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
