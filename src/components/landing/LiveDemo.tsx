"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Phone, PhoneOff, Loader2, Wrench, Utensils, Stethoscope, Scissors, Building2, Truck, Sparkles, CheckCircle2, ShoppingBag } from "lucide-react";
import { LeadCapturePopup } from "./LeadCapturePopup";

interface Scenario {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  greeting: string;
  agentId?: string;
}

const scenarios: Scenario[] = [
  {
    id: "restaurant",
    name: "Restaurant Reservation & Orders",
    icon: Utensils,
    description: "Table bookings, takeout ordering, menu allergies & hours.",
    greeting: "Buona sera! Welcome to Bella Italia. Are you calling for a table reservation or takeout order?",
  },
  {
    id: "salon",
    name: "Salon & Spa Booking",
    icon: Scissors,
    description: "Stylist calendar check, service packages, and deposit links.",
    greeting: "Hello! Welcome to Glow Salon & Spa. How can I help you book your appointment today?",
  },
  {
    id: "real-estate",
    name: "Real Estate Buyer Qualification",
    icon: Building2,
    description: "Qualify buyers, open house RSVPs, and viewings scheduling.",
    greeting: "Hi there! Thanks for calling Premier Realty. Are you interested in scheduling a home viewing?",
  },
  {
    id: "plumber",
    name: "Emergency Plumbing Service",
    icon: Wrench,
    description: "Emergency dispatch, pricing quotes, and job scheduling.",
    greeting: "Thanks for calling QuickFix Plumbing. Do you have an emergency repair or standard maintenance?",
  },
  {
    id: "healthcare",
    name: "Medical Clinic Reception",
    icon: Stethoscope,
    description: "HIPAA triage, doctor check-ups, and prescription refills.",
    greeting: "Hello, this is Bright Health Clinic. Are you calling to book an appointment or request a refill?",
  },
  {
    id: "logistics",
    name: "Logistics & Dispatch",
    icon: Truck,
    description: "Driver check-ins, package tracking, and delivery rescheduling.",
    greeting: "Dispatch desk here. How can I assist with your shipment or delivery schedule?",
  },
  {
    id: "retail",
    name: "Retail & E-Commerce Support",
    icon: ShoppingBag,
    description: "Inventory status, return requests, and order tracking.",
    greeting: "Welcome to TrendStore Support! How can I help with your order or product question today?",
  },
];

export interface LiveDemoProps {
  filterIndustryId?: string;
  colorTheme?: string;
}

const themeStyles: Record<string, {
  badgeBg: string;
  badgeIcon: string;
  glowBg: string;
  cardSelected: string;
  cardIconSelected: string;
  cardIconDefault: string;
  boxIconContainer: string;
  inputFocus: string;
  callBtn: string;
  dialingBtnText: string;
  statusBanner: string;
  statusIcon: string;
}> = {
  purple: {
    badgeBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    badgeIcon: "text-purple-400",
    glowBg: "bg-purple-600/10",
    cardSelected: "bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-purple-400",
    boxIconContainer: "bg-purple-600/20 border-purple-500/30 text-purple-400",
    inputFocus: "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
    callBtn: "bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30",
    dialingBtnText: "text-purple-400",
    statusBanner: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    statusIcon: "text-purple-400",
  },
  orange: {
    badgeBg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    badgeIcon: "text-orange-400",
    glowBg: "bg-orange-600/10",
    cardSelected: "bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-orange-400",
    boxIconContainer: "bg-orange-600/20 border-orange-500/30 text-orange-400",
    inputFocus: "focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
    callBtn: "bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/30",
    dialingBtnText: "text-orange-400",
    statusBanner: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    statusIcon: "text-orange-400",
  },
  blue: {
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    badgeIcon: "text-blue-400",
    glowBg: "bg-blue-600/10",
    cardSelected: "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-blue-400",
    boxIconContainer: "bg-blue-600/20 border-blue-500/30 text-blue-400",
    inputFocus: "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    callBtn: "bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30",
    dialingBtnText: "text-blue-400",
    statusBanner: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    statusIcon: "text-blue-400",
  },
  cyan: {
    badgeBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    badgeIcon: "text-cyan-400",
    glowBg: "bg-cyan-600/10",
    cardSelected: "bg-cyan-600 border-cyan-500 text-white shadow-xl shadow-cyan-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-cyan-400",
    boxIconContainer: "bg-cyan-600/20 border-cyan-500/30 text-cyan-400",
    inputFocus: "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
    callBtn: "bg-cyan-600 hover:bg-cyan-500 shadow-xl shadow-cyan-600/30",
    dialingBtnText: "text-cyan-400",
    statusBanner: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    statusIcon: "text-cyan-400",
  },
  green: {
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    badgeIcon: "text-emerald-400",
    glowBg: "bg-emerald-600/10",
    cardSelected: "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-emerald-400",
    boxIconContainer: "bg-emerald-600/20 border-emerald-500/30 text-emerald-400",
    inputFocus: "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
    callBtn: "bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30",
    dialingBtnText: "text-emerald-400",
    statusBanner: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    statusIcon: "text-emerald-400",
  },
  indigo: {
    badgeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    badgeIcon: "text-indigo-400",
    glowBg: "bg-indigo-600/10",
    cardSelected: "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-indigo-400",
    boxIconContainer: "bg-indigo-600/20 border-indigo-500/30 text-indigo-400",
    inputFocus: "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
    callBtn: "bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30",
    dialingBtnText: "text-indigo-400",
    statusBanner: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    statusIcon: "text-indigo-400",
  },
};

export function LiveDemo({ filterIndustryId, colorTheme }: LiveDemoProps) {
  const availableScenarios = useMemo(() => {
    if (!filterIndustryId) return scenarios;
    const matches = scenarios.filter((sc) => sc.id === filterIndustryId);
    return matches.length > 0 ? matches : scenarios;
  }, [filterIndustryId]);

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    availableScenarios[0] || scenarios[0]
  );

  useEffect(() => {
    if (availableScenarios.length > 0) {
      setSelectedScenario(availableScenarios[0]);
    }
  }, [filterIndustryId, availableScenarios]);

  const t = themeStyles[colorTheme as keyof typeof themeStyles] || themeStyles.indigo;

  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState<{ name: string; email: string; interestType: string } | null>(null);

  // Phone Call Outbound Mode & Hot Lead Fields
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingState, setCallingState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callStatusMessage, setCallStatusMessage] = useState("");

  const handleStartDemoClick = async () => {
    if (!userName || !userName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      alert("Please enter a valid phone number with country code (e.g. +1234567890)");
      return;
    }

    setCallingState("calling");
    setCallStatusMessage("Saving lead details & initiating outbound AI voice call...");

    // 1. Save lead to hot_leads table in database
    try {
      await fetch("/api/hot-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName.trim(),
          number: phoneNumber.trim(),
          industry: selectedScenario.name,
        }),
      });
    } catch (dbErr) {
      console.warn("Failed to save lead to hot_leads database table:", dbErr);
    }

    // 2. Trigger outbound Retell call
    try {
      const res = await fetch("/api/retell/phone-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toNumber: phoneNumber.trim(),
          customerName: userName.trim(),
          scenario: selectedScenario.id,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setCallStatusMessage(`Call notice: ${data.error}`);
        setCallingState("connected");
      } else {
        setCallStatusMessage("Call placed! Your phone should ring shortly.");
        setCallingState("connected");
      }
    } catch (err: any) {
      console.error("Outbound call error:", err);
      setCallStatusMessage("Call initiated. Stand by for incoming call on your phone.");
      setCallingState("connected");
    }
  };

  const handleEndCall = () => {
    setCallingState("ended");
    setTimeout(() => {
      setCallingState("idle");
      setCallStatusMessage("");
    }, 2000);
  };

  return (
    <section id="live-demo" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${t.glowBg} rounded-full blur-3xl pointer-events-none`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${t.badgeBg} text-xs font-bold uppercase tracking-wider mb-4`}>
            <Sparkles className={`w-3.5 h-3.5 ${t.badgeIcon}`} />
            <span>Interactive Voice Playground</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Test Our AI Voice Agent Live
          </h2>
          <p className="text-slate-400 text-lg">
            {filterIndustryId
              ? "Enter your name & phone number to experience sub-300ms real-time voice automation tailored for your industry."
              : "Select an industry scenario, enter your name & phone number, and experience sub-300ms real-time voice automation."}
          </p>
        </div>

        {/* Scenario Selection Cards */}
        <div className={availableScenarios.length === 1 ? "flex justify-center mb-12" : "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"}>
          {availableScenarios.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const Icon = sc.icon;

            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  availableScenarios.length === 1 ? "w-full max-w-sm" : ""
                } ${
                  isSelected
                    ? t.cardSelected
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? t.cardIconSelected : t.cardIconDefault
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 leading-snug">{sc.name}</h3>
                  <p className="text-[11px] opacity-75 line-clamp-2">{sc.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Scenario & Call Control Box */}
        <div className="max-w-3xl mx-auto bg-slate-950/80 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className={`w-12 h-12 rounded-2xl ${t.boxIconContainer} flex items-center justify-center`}>
              <selectedScenario.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">{selectedScenario.name} Agent</h3>
              <p className="text-xs text-slate-400 italic">"{selectedScenario.greeting}"</p>
            </div>
          </div>

          {/* Live Demo Call Form (Required Fields: Name & Phone Number) */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={callingState === "calling" || callingState === "connected"}
                  className={`w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base font-medium placeholder:text-slate-500 outline-none ${t.inputFocus} transition-all`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number (with Country Code) <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={callingState === "calling" || callingState === "connected"}
                  className={`w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base font-medium placeholder:text-slate-500 outline-none ${t.inputFocus} transition-all`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {callingState === "idle" && (
                <button
                  onClick={handleStartDemoClick}
                  className={`w-full sm:w-auto px-8 py-4 ${t.callBtn} text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg hover:scale-[1.02]`}
                >
                  <Phone className="w-4 h-4 fill-white" />
                  <span>Call Me Now</span>
                </button>
              )}

              {callingState === "calling" && (
                <button
                  disabled
                  className={`w-full sm:w-auto px-8 py-4 bg-slate-800 ${t.dialingBtnText} rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shrink-0`}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dialing...</span>
                </button>
              )}

              {callingState === "connected" && (
                <button
                  onClick={handleEndCall}
                  className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Demo Call</span>
                </button>
              )}
            </div>

            {callStatusMessage && (
              <div className={`p-4 rounded-2xl ${t.statusBanner} text-xs font-semibold flex items-center gap-2`}>
                <CheckCircle2 className={`w-4 h-4 ${t.statusIcon} shrink-0`} />
                <span>{callStatusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

