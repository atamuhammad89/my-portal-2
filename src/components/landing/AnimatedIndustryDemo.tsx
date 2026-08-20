"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle2, ShoppingCart, Sparkles, RefreshCw, Calendar, Check, Package, FileText, Activity } from "lucide-react";
import { IndustryData } from "@/data/industries";

interface AnimatedIndustryDemoProps {
  data: IndustryData;
}

interface DialogueLine {
  who: "caller" | "agent";
  text: string;
}

interface DemoItem {
  icon: string;
  name: string;
  qty: string;
  price: number;
}

interface ScenarioData {
  agentName: string;
  orderTag: string;
  panelTitle: string;
  confirmLabel: string;
  taxRate: number;
  currencySymbol: string;
  isPriceBased: boolean;
  lines: DialogueLine[];
  items: DemoItem[];
}

const scenarioConfig: Record<string, ScenarioData> = {
  restaurant: {
    agentName: "Rae · AI Order Desk",
    orderTag: "#TA-2291",
    panelTitle: "Live Kitchen Order",
    confirmLabel: "✓ Order Confirmed — Sent to Kitchen POS",
    taxRate: 0.08,
    currencySymbol: "$",
    isPriceBased: true,
    lines: [
      { who: "caller", text: "Hi, can I get a takeaway order please?" },
      { who: "agent", text: "Of course — what would you like today?" },
      { who: "caller", text: "One large pepperoni pizza and a garlic bread." },
      { who: "agent", text: "Got it — large pepperoni and garlic bread. Anything to drink?" },
      { who: "caller", text: "A Coke, please. That's all." },
      { who: "agent", text: "Perfect — placing your order directly into the kitchen queue now!" },
    ],
    items: [
      { icon: "🍕", name: "Large Pepperoni Pizza", qty: "x1", price: 14.50 },
      { icon: "🥖", name: "Garlic Bread", qty: "x1", price: 4.00 },
      { icon: "🥤", name: "Coke (500ml)", qty: "x1", price: 2.50 },
    ],
  },
  salon: {
    agentName: "Chloe · AI Salon Desk",
    orderTag: "#BOOK-8821",
    panelTitle: "Live Appointment Booking",
    confirmLabel: "✓ Appointment Booked & Deposit Sent",
    taxRate: 0.05,
    currencySymbol: "$",
    isPriceBased: true,
    lines: [
      { who: "caller", text: "Hi! Do you have an opening for a balayage with Sarah this Friday?" },
      { who: "agent", text: "Let me check Sarah's calendar... Yes! I have a 2:00 PM slot available." },
      { who: "caller", text: "Great! Can I also add a deep conditioning treatment?" },
      { who: "agent", text: "Added! Balayage + Haircut with Deep Conditioning treatment booked for Friday at 2 PM." },
      { who: "caller", text: "Awesome, thank you!" },
      { who: "agent", text: "All set! Confirmation and deposit link sent via SMS." },
    ],
    items: [
      { icon: "💇‍♀️", name: "Balayage & Haircut", qty: "Sarah", price: 150.00 },
      { icon: "✨", name: "Deep Conditioning", qty: "Add-on", price: 25.00 },
      { icon: "💅", name: "Gel Manicure Reserve", qty: "Add-on", price: 35.00 },
    ],
  },
  "real-estate": {
    agentName: "Sarah · AI Listing Desk",
    orderTag: "#VIEW-4092",
    panelTitle: "Live Lead & Viewing Record",
    confirmLabel: "✓ Viewing Confirmed & Added to CRM",
    taxRate: 0,
    currencySymbol: "",
    isPriceBased: false,
    lines: [
      { who: "caller", text: "Hi, I saw the sign for 123 Oak Street. Is it still available?" },
      { who: "agent", text: "Yes it is! Are you pre-approved for financing and looking to buy in the next 30 days?" },
      { who: "caller", text: "Yes, pre-approved for $650k and ready to buy." },
      { who: "agent", text: "Perfect! Would Saturday at 11:00 AM work for a private viewing with Agent Mark?" },
      { who: "caller", text: "Saturday 11 AM is perfect." },
      { who: "agent", text: "Viewing confirmed! Details & calendar invite sent to your phone." },
    ],
    items: [
      { icon: "🏠", name: "123 Oak St Private Tour", qty: "Sat 11 AM", price: 0 },
      { icon: "📋", name: "Pre-Approved Buyer Profile", qty: "Verified ($650k)", price: 0 },
      { icon: "🔑", name: "Open House VIP Access", qty: "Registered", price: 0 },
    ],
  },
  logistics: {
    agentName: "Alex · AI Dispatcher",
    orderTag: "#SHIP-9912",
    panelTitle: "Live Dispatch Manifest",
    confirmLabel: "✓ Manifest Updated & TMS Synced",
    taxRate: 0,
    currencySymbol: "",
    isPriceBased: false,
    lines: [
      { who: "caller", text: "Dispatch, this is Driver Tom. Checking in for Freight #4820 at Dock B." },
      { who: "agent", text: "Checking Samsara TMS... Driver Tom identified. Dock B Door #4 is assigned." },
      { who: "caller", text: "Got it. Can you update delivery ETA for Customer Acme Corp to 2:30 PM?" },
      { who: "agent", text: "ETA updated to 2:30 PM and automated SMS tracking sent to Acme Corp." },
      { who: "caller", text: "Thanks, heading in now!" },
      { who: "agent", text: "Manifest updated. Drive safely!" },
    ],
    items: [
      { icon: "📦", name: "Freight #4820 Status", qty: "Arrived", price: 0 },
      { icon: "🚪", name: "Dock Assignment", qty: "Door #4", price: 0 },
      { icon: "🚚", name: "Customer ETA Notification", qty: "2:30 PM", price: 0 },
    ],
  },
  healthcare: {
    agentName: "Maya · AI Care Receptionist",
    orderTag: "#MED-3301",
    panelTitle: "Live Patient Triage Intake",
    confirmLabel: "✓ Appointment & Refill Synced to EMR",
    taxRate: 0,
    currencySymbol: "",
    isPriceBased: false,
    lines: [
      { who: "caller", text: "Hello, I need an urgent consultation with Dr. Smith for flu symptoms." },
      { who: "agent", text: "I can help with that. Doctor Smith has an emergency slot today at 4:15 PM." },
      { who: "caller", text: "Please book it! Also, can I request a refill on my daily blood pressure meds?" },
      { who: "agent", text: "Identity verified. Refill request sent to CVS Pharmacy & appointment set for 4:15 PM." },
      { who: "caller", text: "Thank you so much!" },
      { who: "agent", text: "You're welcome! Check-in link sent via SMS." },
    ],
    items: [
      { icon: "🩺", name: "Urgent Consult - Dr. Smith", qty: "Today 4:15 PM", price: 0 },
      { icon: "💊", name: "Rx Refill Request", qty: "CVS Pharmacy", price: 0 },
      { icon: "📋", name: "HIPAA Pre-Visit Intake", qty: "Completed", price: 0 },
    ],
  },
  retail: {
    agentName: "Mia · AI Support Desk",
    orderTag: "#RET-7740",
    panelTitle: "Live Stock & Reserve Hold",
    confirmLabel: "✓ Item Reserved & Synced to POS",
    taxRate: 0.07,
    currencySymbol: "$",
    isPriceBased: true,
    lines: [
      { who: "caller", text: "Hi, do you have the Pro Runner Shoes in size 10 in stock?" },
      { who: "agent", text: "Checking Shopify POS... Yes! We have 2 pairs in store." },
      { who: "caller", text: "Can you hold one pair for me to pick up today?" },
      { who: "agent", text: "Hold placed for 24 hours under your phone number!" },
      { who: "caller", text: "Awesome! Also, I need to return a shirt from my last order." },
      { who: "agent", text: "Return QR code generated and emailed to you. See you soon!" },
    ],
    items: [
      { icon: "👟", name: "Pro Runner Shoes (Size 10)", qty: "x1", price: 120.00 },
      { icon: "🛍️", name: "24-Hr Store Pickup Hold", qty: "Reserved", price: 0 },
      { icon: "🔄", name: "Instant Return QR Label", qty: "Emailed", price: 0 },
    ],
  },
};

const themeColorStyles: Record<string, {
  aurora1: string;
  aurora2: string;
  borderGlow: string;
  badgeBg: string;
  badgeText: string;
  avatarBg: string;
  accentText: string;
  agentBubbleBg: string;
  agentBubbleBorder: string;
  confirmBtnBg: string;
  waveGradient: [string, string];
  pillBg: string;
}> = {
  orange: {
    aurora1: "rgba(255, 106, 26, 0.35)",
    aurora2: "rgba(255, 179, 71, 0.2)",
    borderGlow: "border-orange-500/30 shadow-orange-500/10",
    badgeBg: "bg-orange-500/10 border-orange-500/30",
    badgeText: "text-orange-400",
    avatarBg: "from-orange-500 to-amber-500",
    accentText: "text-orange-400",
    agentBubbleBg: "bg-gradient-to-r from-orange-500/20 to-amber-500/10",
    agentBubbleBorder: "border-orange-500/40",
    confirmBtnBg: "from-orange-500 via-amber-500 to-orange-600",
    waveGradient: ["#FF8A47", "#FFB347"],
    pillBg: "from-orange-500 to-amber-500",
  },
  purple: {
    aurora1: "rgba(168, 85, 247, 0.35)",
    aurora2: "rgba(236, 72, 153, 0.2)",
    borderGlow: "border-purple-500/30 shadow-purple-500/10",
    badgeBg: "bg-purple-500/10 border-purple-500/30",
    badgeText: "text-purple-400",
    avatarBg: "from-purple-600 to-pink-500",
    accentText: "text-purple-400",
    agentBubbleBg: "bg-gradient-to-r from-purple-500/20 to-pink-500/10",
    agentBubbleBorder: "border-purple-500/40",
    confirmBtnBg: "from-purple-600 via-pink-500 to-purple-700",
    waveGradient: ["#C084FC", "#F472B6"],
    pillBg: "from-purple-600 to-pink-500",
  },
  blue: {
    aurora1: "rgba(59, 130, 246, 0.35)",
    aurora2: "rgba(6, 182, 212, 0.2)",
    borderGlow: "border-blue-500/30 shadow-blue-500/10",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    badgeText: "text-blue-400",
    avatarBg: "from-blue-600 to-cyan-500",
    accentText: "text-blue-400",
    agentBubbleBg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/10",
    agentBubbleBorder: "border-blue-500/40",
    confirmBtnBg: "from-blue-600 via-cyan-500 to-blue-700",
    waveGradient: ["#60A5FA", "#38BDF8"],
    pillBg: "from-blue-600 to-cyan-500",
  },
  cyan: {
    aurora1: "rgba(6, 182, 212, 0.35)",
    aurora2: "rgba(20, 184, 166, 0.2)",
    borderGlow: "border-cyan-500/30 shadow-cyan-500/10",
    badgeBg: "bg-cyan-500/10 border-cyan-500/30",
    badgeText: "text-cyan-400",
    avatarBg: "from-cyan-500 to-teal-500",
    accentText: "text-cyan-400",
    agentBubbleBg: "bg-gradient-to-r from-cyan-500/20 to-teal-500/10",
    agentBubbleBorder: "border-cyan-500/40",
    confirmBtnBg: "from-cyan-500 via-teal-500 to-cyan-600",
    waveGradient: ["#22D3EE", "#2DD4BF"],
    pillBg: "from-cyan-500 to-teal-500",
  },
  green: {
    aurora1: "rgba(16, 185, 129, 0.35)",
    aurora2: "rgba(52, 211, 153, 0.2)",
    borderGlow: "border-emerald-500/30 shadow-emerald-500/10",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30",
    badgeText: "text-emerald-400",
    avatarBg: "from-emerald-600 to-teal-500",
    accentText: "text-emerald-400",
    agentBubbleBg: "bg-gradient-to-r from-emerald-500/20 to-teal-500/10",
    agentBubbleBorder: "border-emerald-500/40",
    confirmBtnBg: "from-emerald-600 via-teal-500 to-emerald-700",
    waveGradient: ["#34D399", "#10B981"],
    pillBg: "from-emerald-600 to-teal-500",
  },
};

export function AnimatedIndustryDemo({ data }: AnimatedIndustryDemoProps) {
  const scenarioKey = data.id in scenarioConfig ? data.id : "restaurant";
  const scenario = scenarioConfig[scenarioKey];
  const theme = themeColorStyles[data.colorTheme] || themeColorStyles.purple;

  const [visibleLinesCount, setVisibleLinesCount] = useState(0);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const bars = 22;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.06;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const gap = w / bars;
      for (let i = 0; i < bars; i++) {
        const seed = Math.sin(t * 1.5 + i * 0.5) * 0.5 + Math.sin(t * 0.8 + i * 1.2) * 0.3 + (Math.random() - 0.5) * 0.1;
        const amp = Math.max(0.08, Math.abs(seed));
        const barH = amp * h * 0.8;
        const x = i * gap + gap * 0.2;
        const bw = gap * 0.6;

        const grad = ctx.createLinearGradient(0, h / 2 - barH / 2, 0, h / 2 + barH / 2);
        grad.addColorStop(0, theme.waveGradient[0]);
        grad.addColorStop(1, theme.waveGradient[1]);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, h / 2 - barH / 2, bw, barH, bw / 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  // Call timer counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scenario playback loop
  useEffect(() => {
    setVisibleLinesCount(0);
    setVisibleItemsCount(0);
    setIsConfirmed(false);
    setSeconds(0);

    const lineTimers: NodeJS.Timeout[] = [];

    // Show dialogue bubbles sequentially
    scenario.lines.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setVisibleLinesCount(idx + 1);
      }, (idx + 1) * 1100);
      lineTimers.push(timer);
    });

    // Reveal items into cart when caller mentions them
    const itemTimers: NodeJS.Timeout[] = [];
    scenario.items.forEach((_, idx) => {
      const delay = (idx + 1) * 2200;
      const timer = setTimeout(() => {
        setVisibleItemsCount(idx + 1);
      }, delay);
      itemTimers.push(timer);
    });

    // Confirm order at the end
    const totalLinesDelay = (scenario.lines.length + 1) * 1100 + 400;
    const confirmTimer = setTimeout(() => {
      setIsConfirmed(true);
    }, totalLinesDelay);

    // Loop scenario after short hold
    const resetTimer = setTimeout(() => {
      setVisibleLinesCount(0);
      setVisibleItemsCount(0);
      setIsConfirmed(false);
      setSeconds(0);
    }, totalLinesDelay + 4500);

    return () => {
      lineTimers.forEach(clearTimeout);
      itemTimers.forEach(clearTimeout);
      clearTimeout(confirmTimer);
      clearTimeout(resetTimer);
    };
  }, [scenarioKey, scenario]);

  const currentItems = useMemo(() => {
    return scenario.items.slice(0, visibleItemsCount);
  }, [scenario.items, visibleItemsCount]);

  const subtotal = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + item.price, 0);
  }, [currentItems]);

  const tax = subtotal * scenario.taxRate;
  const total = subtotal + tax;

  const formatTimer = (s: number) => {
    const min = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
      {/* Dynamic Aurora Field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-35 top-[-100px] left-[-100px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${theme.aurora1} 0%, transparent 70%)` }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full blur-[120px] opacity-25 bottom-[-100px] right-[-100px]"
          style={{ background: `radial-gradient(circle, ${theme.aurora2} 0%, transparent 70%)` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${theme.badgeBg} border text-xs font-bold uppercase tracking-wider mb-4 ${theme.badgeText}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Voice Flow Simulation</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Real-Time {data.name} Voice Automation
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Watch our AI voice receptionist handle real calls, extract structured data, and sync with your backend in real time.
          </p>
        </div>

        {/* ── Two-Panel Simulation Layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* ── LEFT PANEL: Phone Call Simulation ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`bg-slate-900/90 border ${theme.borderGlow} rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden min-h-[500px] flex flex-col justify-between`}
          >
            <div>
              {/* Phone Header / Caller Status */}
              <div className="text-center mb-6 pb-6 border-b border-slate-800">
                <div className="relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-xl overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${theme.avatarBg}`} />
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-30" />
                  <Phone className="w-7 h-7 text-white relative z-10" />
                </div>
                <h3 className="font-extrabold text-base text-white tracking-tight">{scenario.agentName}</h3>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                  <span>connected — {formatTimer(seconds)}</span>
                </div>
              </div>

              {/* Waveform visualizer */}
              <div className="h-12 w-full mb-6">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>

              {/* Scrolling Dialogue Transcript */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {scenario.lines.slice(0, visibleLinesCount).map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[88%] ${
                        line.who === "caller"
                          ? "bg-slate-800/80 border border-slate-700/60 text-slate-200 self-start rounded-tl-none"
                          : `${theme.agentBubbleBg} border ${theme.agentBubbleBorder} text-white font-medium self-end ml-auto rounded-tr-none shadow-md`
                      }`}
                    >
                      <span className="block font-mono text-[9px] uppercase tracking-wider opacity-60 mb-1">
                        {line.who === "caller" ? "Caller" : scenario.agentName.split(" ")[0]}
                      </span>
                      <p>{line.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT PANEL: Live Cart / Appointment / CRM Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`bg-slate-900/90 border ${theme.borderGlow} rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[500px]`}
          >
            <div>
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${theme.badgeBg} ${theme.badgeText}`}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{scenario.panelTitle}</h3>
                    <p className="font-mono text-[11px] text-slate-400">{scenario.orderTag}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${
                  isConfirmed
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  {isConfirmed ? "Confirmed" : "Building"}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 min-h-[200px] mb-6">
                {currentItems.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                    <Activity className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
                    <span>Listening to call... items will appear live</span>
                  </div>
                ) : (
                  <AnimatePresence>
                    {currentItems.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.45, type: "spring" }}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{item.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{item.qty}</p>
                          </div>
                        </div>
                        {scenario.isPriceBased && item.price > 0 && (
                          <span className={`font-mono text-xs font-bold ${theme.accentText}`}>
                            {scenario.currencySymbol}{item.price.toFixed(2)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Panel Summary & Confirmation Action */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              {scenario.isPriceBased && (
                <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{scenario.currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax & Fees</span>
                    <span>{scenario.currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                    <span>Total</span>
                    <span className={theme.accentText}>{scenario.currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Confirmation Action Button */}
              <motion.div
                animate={isConfirmed ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-all ${
                  isConfirmed
                    ? `bg-gradient-to-r ${theme.confirmBtnBg} text-white shadow-xl`
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isConfirmed ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>{scenario.confirmLabel}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    <span>Waiting for call completion...</span>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
