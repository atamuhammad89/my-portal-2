"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Phone,
  Calendar,
  CheckCircle2,
  Sparkles,
  Headset,
  Send,
  TrendingUp,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingHeroProps {
  onDemoClick: () => void;
}

interface ScenarioLine {
  who: "caller" | "agent";
  text: string;
  time: string;
}

interface Scenario {
  id: string;
  label: string;
  agent: string;
  intent: string;
  lines: ScenarioLine[];
  result: string;
  float: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "booking",
    label: "Appointment Booking",
    agent: "Ava · CallAutomate AI",
    intent: "Detected: appointment booking",
    float: "Booked: Thu 10am",
    lines: [
      { who: "caller", text: "Hi, do you have anything open Tuesday afternoon?", time: "2:28 PM" },
      { who: "agent", text: "Yes — 2:30 or 4pm both work. Want me to lock in 2:30?", time: "2:29 PM" },
      { who: "caller", text: "2:30 is perfect, thank you!", time: "2:29 PM" },
      { who: "agent", text: "Great! I've booked that for you. You'll receive a confirmation shortly.", time: "2:30 PM" },
    ],
    result: "Appointment booked for Tue, 2:30 PM",
  },
  {
    id: "support",
    label: "Customer Support",
    agent: "Nova · CallAutomate AI",
    intent: "Detected: customer support request",
    float: "Ticket #4821 filed",
    lines: [
      { who: "caller", text: "My dishwasher is leaking, can someone come out this week?", time: "9:14 AM" },
      { who: "agent", text: "I can get a technician out Thursday between 9 and 11am. Work for you?", time: "9:15 AM" },
      { who: "caller", text: "Thursday morning is great.", time: "9:15 AM" },
      { who: "agent", text: "You are set — ticket 4821 is open and the tech has your address.", time: "9:16 AM" },
    ],
    result: "Support ticket #4821 created",
  },
  {
    id: "outbound",
    label: "Outbound Sales",
    agent: "Rae · CallAutomate AI",
    intent: "Detected: outbound sales follow-up",
    float: "Booked: Thu 10am",
    lines: [
      { who: "agent", text: "Hi, this is Rae from CallAutomate — following up on the demo request.", time: "10:01 AM" },
      { who: "caller", text: "Yes! We are exploring options for our support line.", time: "10:02 AM" },
      { who: "agent", text: "Great — I can get you on a 15-minute call with our team Thursday at 10am.", time: "10:02 AM" },
      { who: "caller", text: "Thursday at 10 works for me.", time: "10:03 AM" },
    ],
    result: "Sales call booked for Thu, 10 AM",
  },
  {
    id: "afterhours",
    label: "After-Hours Call",
    agent: "Ava · CallAutomate AI",
    intent: "Detected: after-hours call",
    float: "Held: 8:00am slot",
    lines: [
      { who: "caller", text: "I know it is late — is anyone there tomorrow morning?", time: "9:42 PM" },
      { who: "agent", text: "We open at 8am. Want me to hold the first slot for you?", time: "9:43 PM" },
      { who: "caller", text: "Yes please, that would be great.", time: "9:43 PM" },
      { who: "agent", text: "Reserved. A human teammate will confirm first thing.", time: "9:44 PM" },
    ],
    result: "First slot held for 8:00 AM",
  },
];

export function LandingHero({ onDemoClick }: LandingHeroProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [callTimerSecs, setCallTimerSecs] = useState(15);
  const [showResult, setShowResult] = useState(false);

  const currentScenario = SCENARIOS[activeScenarioIdx];

  // Canvas background ambient blobs
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const blobs = [
      { x: w * 0.15, y: h * 0.25, r: 280, color: "rgba(47, 111, 237, 0.08)", vx: 0.4, vy: 0.4 },
      { x: w * 0.82, y: h * 0.45, r: 350, color: "rgba(124, 92, 252, 0.14)", vx: -0.4, vy: -0.4 },
      { x: w * 0.65, y: h * 0.75, r: 280, color: "rgba(34, 211, 238, 0.10)", vx: 0.3, vy: -0.3 },
    ];

    let time = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      blobs.forEach((blob) => {
        blob.x += Math.sin(time + blob.vx) * 0.4;
        blob.y += Math.cos(time + blob.vy) * 0.4;

        const r = blob.r + Math.sin(time * 2 + blob.vx) * 18;
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Audio Waveform Canvas animation inside phone mockup screen
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const bars = 26;

    const drawWave = () => {
      t += 0.06;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 260);
      const h = (canvas.height = 36);

      ctx.clearRect(0, 0, w, h);
      const gap = w / bars;

      for (let i = 0; i < bars; i++) {
        const seed = Math.sin(t * 1.6 + i * 0.5) * 0.5 + Math.sin(t * 0.7 + i * 1.3) * 0.3;
        const amp = Math.max(0.12, Math.abs(seed));
        const barH = amp * h * 0.8;
        const x = i * gap + gap * 0.2;
        const bw = gap * 0.55;

        const grad = ctx.createLinearGradient(0, h / 2 - barH / 2, 0, h / 2 + barH / 2);
        grad.addColorStop(0, "#4C8CFF");
        grad.addColorStop(1, "#22D3EE");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, h / 2 - barH / 2, bw, barH, bw / 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(drawWave);
    };

    animId = requestAnimationFrame(drawWave);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Automated Phone Scenario Line-by-Line Player
  useEffect(() => {
    setVisibleLineCount(1);
    setShowResult(false);
    setCallTimerSecs(15);

    const lineTimer = setInterval(() => {
      setVisibleLineCount((prev) => {
        if (prev < currentScenario.lines.length) {
          return prev + 1;
        } else {
          setShowResult(true);
          clearInterval(lineTimer);
          return prev;
        }
      });
    }, 1600);

    const clockTimer = setInterval(() => {
      setCallTimerSecs((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(lineTimer);
      clearInterval(clockTimer);
    };
  }, [activeScenarioIdx, currentScenario]);

  // Auto loop through scenarios every 12 seconds
  useEffect(() => {
    const scenarioLoop = setInterval(() => {
      setActiveScenarioIdx((prev) => (prev + 1) % SCENARIOS.length);
    }, 12000);

    return () => clearInterval(scenarioLoop);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden pt-24 pb-14 bg-[#FBFCFE]">
      {/* Dynamic background canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

      {/* Ambient Dotted Matrix Background Grid (Bottom Left) */}
      <div className="absolute bottom-6 left-8 w-64 h-48 bg-[radial-gradient(#CBD5E1_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-40 pointer-events-none -z-10" />

      {/* SVG Concentric Arc Wave Lines emanating behind phone */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none -z-10 opacity-30">
        <svg viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="350" cy="350" r="150" stroke="#2F6FED" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="350" cy="350" r="230" stroke="#22D3EE" strokeWidth="1" />
          <circle cx="350" cy="350" r="310" stroke="#7C5CFC" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="350" cy="350" r="390" stroke="#2F6FED" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* 1400px Split Container */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ── LEFT COLUMN: Marketing Messaging (~55%) ── */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Enterprise Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 mb-4 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
              <span className="font-mono text-[11px] font-bold text-[#2F6FED] uppercase tracking-widest">
                ENTERPRISE VOICE AUTOMATION PLATFORM
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 90, damping: 18 }}
              className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#0B0E1A] mb-4 leading-[1.1] break-words"
            >
              Automate calls with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2F6FED] via-[#22D3EE] to-[#7C5CFC]">
                CallAutomate AI
              </span>
            </motion.h1>

            {/* Description Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="text-base sm:text-lg text-[#5B6478] mb-6 max-w-xl leading-relaxed font-sans"
            >
              Deploy intelligent voice agents that handle{" "}
              <button
                onClick={onDemoClick}
                className="text-[#0B0E1A] font-bold underline decoration-[#2F6FED]/50 decoration-2 underline-offset-4 hover:text-[#2F6FED] transition-colors cursor-pointer"
              >
                bookings
              </button>
              ,{" "}
              <button
                onClick={onDemoClick}
                className="text-[#0B0E1A] font-bold underline decoration-[#2F6FED]/50 decoration-2 underline-offset-4 hover:text-[#2F6FED] transition-colors cursor-pointer"
              >
                customer support
              </button>
              , and{" "}
              <button
                onClick={onDemoClick}
                className="text-[#0B0E1A] font-bold underline decoration-[#2F6FED]/50 decoration-2 underline-offset-4 hover:text-[#2F6FED] transition-colors cursor-pointer"
              >
                outbound sales
              </button>{" "}
              24/7 — indistinguishable from human agents.
            </motion.p>

            {/* CTAs Row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3.5 mb-8"
            >
              {/* Try Live Demo Button with Equalizer Wave Icon */}
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDemoClick}
                className="group relative inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-white bg-[#0B0E1A] rounded-full overflow-hidden transition-all hover:bg-[#1B2036] shadow-xl hover:shadow-2xl cursor-pointer"
              >
                <div className="flex items-center gap-1 mr-2.5">
                  <span className="w-0.5 h-3 bg-[#22D3EE] rounded-full animate-pulse" />
                  <span className="w-0.5 h-4 bg-[#4C8CFF] rounded-full animate-pulse delay-75" />
                  <span className="w-0.5 h-2.5 bg-[#7C5CFC] rounded-full animate-pulse delay-150" />
                </div>
                <span>Try Live Demo</span>
                <Phone className="w-4 h-4 ml-2 text-[#22D3EE] fill-[#22D3EE]" />
              </motion.button>

              {/* Explore Pricing Button */}
              <motion.a
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                href="#pricing"
                className="group inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-[#0B0E1A] bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
              >
                <span>Explore Pricing Plans</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </motion.div>
              
            {/* ── Category Switcher Container Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="w-full bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 max-w-full lg:max-w-[850px]"
            >
              {/* Option 1: Appointment Booking */}
              <button
                onClick={() => setActiveScenarioIdx(0)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeScenarioIdx === 0
                    ? "bg-[#0B0E1A] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${activeScenarioIdx === 0 ? "text-[#22D3EE]" : "text-[#2F6FED]"}`} />
                <span className="whitespace-nowrap">Appointment Booking</span>
              </button>

              {/* Option 2: Customer Support */}
              <button
                onClick={() => setActiveScenarioIdx(1)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeScenarioIdx === 1
                    ? "bg-[#0B0E1A] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Headset className={`w-4 h-4 shrink-0 ${activeScenarioIdx === 1 ? "text-[#22D3EE]" : "text-[#7C5CFC]"}`} />
                <span className="whitespace-nowrap">Customer Support</span>
              </button>

              {/* Option 3: Outbound Sales */}
              <button
                onClick={() => setActiveScenarioIdx(2)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeScenarioIdx === 2
                    ? "bg-[#0B0E1A] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Send className={`w-4 h-4 shrink-0 ${activeScenarioIdx === 2 ? "text-[#22D3EE]" : "text-[#2F6FED]"}`} />
                <span className="whitespace-nowrap">Outbound Sales</span>
              </button>

              {/* Option 4: After-Hours Call */}
              <button
                onClick={() => setActiveScenarioIdx(3)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeScenarioIdx === 3
                    ? "bg-[#0B0E1A] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${activeScenarioIdx === 3 ? "text-[#22D3EE]" : "text-[#22D3EE]"}`} />
                <span className="whitespace-nowrap">After-Hours Call</span>
              </button>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Neon AI Voice Phone Mockup (~45%) ── */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start lg:pl-6 relative py-4">
            
            {/* Background Equalizer Floating Bars to the Left of Phone */}
            <div className="hidden sm:flex items-center gap-1.5 absolute -left-12 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none -z-10">
              <span className="w-1.5 h-16 bg-[#2F6FED] rounded-full animate-pulse" />
              <span className="w-1.5 h-24 bg-[#22D3EE] rounded-full animate-pulse delay-100" />
              <span className="w-1.5 h-12 bg-[#7C5CFC] rounded-full animate-pulse delay-200" />
              <span className="w-1.5 h-20 bg-[#2F6FED] rounded-full animate-pulse delay-300" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[275px] sm:max-w-[290px] my-auto"
            >
              {/* Vibrant Neon Purple & Blue Backdrop Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(124,92,252,0.35),rgba(47,111,237,0.25),rgba(34,211,238,0.15),transparent_70%)] blur-2xl pointer-events-none -z-10" />

              {/* Dotted Circuit Line connecting Badge 1 */}
              <div className="absolute -top-3 left-10 w-px h-6 bg-gradient-to-b from-[#22D3EE] to-transparent border-l border-dashed border-[#22D3EE]/60 pointer-events-none" />

              {/* Floating Pill 1 (Upper Left Side of Phone) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
                className="absolute -top-5 left-0 sm:-left-8 z-30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200/90 shadow-xl flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold font-mono text-[#0B0E1A] whitespace-nowrap max-w-[85vw] sm:max-w-none truncate"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2F6FED] shrink-0" />
                <span className="truncate">{currentScenario.float}</span>
              </motion.div>

              {/* Floating Pill 2 (Lower Right Side of Phone) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7, type: "spring" }}
                className="absolute top-1/2 -translate-y-1/2 right-0 sm:-right-12 z-30 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xl flex items-center gap-2 text-xs font-bold font-sans text-[#0B0E1A] whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#7C5CFC] shrink-0" />
                <div>
                  <div className="font-extrabold text-[11px] sm:text-[12px] leading-none">Synced to CRM</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal mt-0.5">Salesforce</div>
                </div>
              </motion.div>

              {/* Hardware Phone Shell with Neon Border */}
              <div className="w-full bg-gradient-to-b from-[#12172C] via-[#0A0E22] to-[#04060E] border-2 border-indigo-500/40 rounded-[36px] sm:rounded-[40px] p-2.5 shadow-[0_0_50px_rgba(124,92,252,0.35),0_0_20px_rgba(34,211,238,0.25),0_30px_70px_-15px_rgba(15,25,60,0.5)] relative text-left">
                {/* Speaker Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/80 rounded-full z-20" />

                {/* Inner Phone Screen */}
                <div className="bg-[radial-gradient(120%_100%_at_50%_0%,#151C3B,#080B18_75%)] rounded-[28px] sm:rounded-[32px] pt-6 pb-4 px-3.5 min-h-[440px] sm:min-h-[465px] flex flex-col justify-between text-slate-100 overflow-hidden relative border border-white/10">
                  
                  {/* Caller Avatar & Name Header */}
                  <div className="text-center pt-0.5">
                    <div className="relative w-12 h-12 rounded-full mx-auto mb-1.5 bg-gradient-to-br from-[#4C8CFF] to-[#22D3EE] flex items-center justify-center shadow-lg">
                      <span className="absolute inset-0 rounded-full border border-[#22D3EE] animate-ping opacity-30" />
                      <Phone className="w-5 h-5 text-[#081020]" />
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-[#F3F6FF]">{currentScenario.agent}</div>
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ADE80]" />
                      <span>connected — {formatTimer(callTimerSecs)}</span>
                    </div>
                  </div>

                  {/* Intent Chip Badge */}
                  <div className="my-1 py-0.5 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300 flex items-center justify-center gap-1.5 w-fit mx-auto">
                    <Sparkles className="w-3 h-3 text-[#22D3EE] shrink-0" />
                    <span>{currentScenario.intent}</span>
                  </div>

                  {/* Real-time Audio Waveform Canvas */}
                  <div className="w-full h-8 my-0.5">
                    <canvas ref={waveCanvasRef} className="w-full h-full block" />
                  </div>

                  {/* Transcript Chat Bubbles with Timestamps */}
                  <div className="flex-1 flex flex-col gap-2 my-1 overflow-y-auto max-h-[220px] px-0.5">
                    {currentScenario.lines.slice(0, visibleLineCount).map((line, lidx) => (
                      <motion.div
                        key={lidx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`max-w-[88%] p-2.5 rounded-xl text-[11px] leading-snug border ${
                          line.who === "caller"
                            ? "self-start bg-white/5 border-white/10 text-slate-200 rounded-bl-xs"
                            : "self-end bg-gradient-to-r from-[#2F6FED]/40 to-[#22D3EE]/20 border-[#4C8CFF]/40 text-white rounded-br-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <b className="font-mono text-[8px] uppercase tracking-wider opacity-60 font-normal">
                            {line.who === "caller" ? "CALLER" : "AI AGENT"}
                          </b>
                          <span className="text-[8px] font-mono opacity-40">{line.time}</span>
                        </div>
                        <span>{line.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Result Banner */}
                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="mt-1 py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-sans flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{currentScenario.result}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
