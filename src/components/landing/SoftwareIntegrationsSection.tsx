"use client";

import React, { useState } from "react";
import { Zap, CheckCircle2, Cpu, Sparkles, ArrowRight, ShieldCheck, Database, RefreshCw, Activity, Layers, ShoppingBag, Cloud, Utensils, Shield, UserCheck, CreditCard, Scissors, Truck, Stethoscope, Calendar, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { IndustryData } from "@/data/industries";

export interface BrandIntegration {
  name: string;
  category: string;
  logoBg: string;
  logoBadgeBg: string;
  borderColor: string;
  tag: string;
  description: string;
  latency: string;
  icon: React.ElementType;
}

// Built-in vector SVG brand logos for 100% instant, bulletproof rendering
export function SoftwareLogo({ name }: { name: string }) {
  switch (name) {
    case "Toast POS":
      return (
        <div className="w-full h-full bg-[#FF5A1F] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M19.5 7h-15C3.12 7 2 8.12 2 9.5v5C2 15.88 3.12 17 4.5 17h15c1.38 0 2.5-1.12 2.5-2.5v-5C22 8.12 20.88 7 19.5 7zm-11 7H6v-4h2.5v4zm4.5 0h-2.5v-4H13v4zm4.5 0H15v-4h2.5v4z"/>
            <path d="M18.5 4h-13C4.67 4 4 4.67 4 5.5V6h16v-.5c0-.83-.67-1.5-1.5-1.5z"/>
          </svg>
        </div>
      );

    case "Square POS":
      return (
        <div className="w-full h-full bg-[#006AFF] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <rect x="8" y="8" width="8" height="8" rx="2" fill="#006AFF" />
          </svg>
        </div>
      );

    case "Clover POS":
      return (
        <div className="w-full h-full bg-[#2DAE3A] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zm-6 6a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zm12 0a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zm-6 6a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4z"/>
          </svg>
        </div>
      );

    case "OpenTable":
      return (
        <div className="w-full h-full bg-[#DA3743] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </div>
      );

    case "Resy":
      return (
        <div className="w-full h-full bg-[#4F46E5] rounded-xl flex items-center justify-center text-white shadow-md font-extrabold text-base italic font-serif">
          R
        </div>
      );

    case "TouchBistro":
      return (
        <div className="w-full h-full bg-[#0D9488] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs tracking-wider">
          TB
        </div>
      );

    case "Shopify POS":
      return (
        <div className="w-full h-full bg-[#95BF47] rounded-xl flex items-center justify-center text-slate-950 shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M15.34 2.5a.6.6 0 00-.54.34l-1.5 3.33a.6.6 0 01-.48.33H8.38a.6.6 0 00-.58.44L4.1 20.3a.6.6 0 00.58.74h14.64a.6.6 0 00.58-.74L16.2 3.1a.6.6 0 00-.56-.42zM12 7.5a3 3 0 110 6 3 3 0 010-6z"/>
          </svg>
        </div>
      );

    case "Salesforce CRM":
      return (
        <div className="w-full h-full bg-[#00A1E0] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
        </div>
      );

    case "HubSpot CRM":
      return (
        <div className="w-full h-full bg-[#FF7A59] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M18 10.5V7a2.5 2.5 0 10-5 0v1.16a5.002 5.002 0 00-4 4.84c0 1.63.78 3.08 2 4v2.5a2.5 2.5 0 105 0v-2.5a4.978 4.978 0 002-4c0-.98-.28-1.89-.78-2.66l.78-.34z"/>
          </svg>
        </div>
      );

    case "Follow Up Boss":
      return (
        <div className="w-full h-full bg-[#7C3AED] rounded-xl flex items-center justify-center text-white shadow-md font-extrabold text-xs tracking-wider font-mono">
          FUB
        </div>
      );

    case "kvCORE":
      return (
        <div className="w-full h-full bg-[#2563EB] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs font-mono">
          kv
        </div>
      );

    case "Zillow MLS":
      return (
        <div className="w-full h-full bg-[#006AFF] rounded-xl flex items-center justify-center text-white shadow-md font-black text-lg font-serif">
          Z
        </div>
      );

    case "BoomTown":
      return (
        <div className="w-full h-full bg-[#059669] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs tracking-wider">
          BT
        </div>
      );

    case "Samsara":
      return (
        <div className="w-full h-full bg-[#0891B2] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      );

    case "McLeod Software":
      return (
        <div className="w-full h-full bg-[#D97706] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs tracking-wider">
          McL
        </div>
      );

    case "Motive":
      return (
        <div className="w-full h-full bg-[#059669] rounded-xl flex items-center justify-center text-white shadow-md font-black text-sm">
          M
        </div>
      );

    case "Geotab":
      return (
        <div className="w-full h-full bg-[#1D4ED8] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs">
          GEO
        </div>
      );

    case "Epic Systems":
      return (
        <div className="w-full h-full bg-[#1E1B4B] border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 shadow-md font-black text-xs tracking-widest font-mono">
          EPIC
        </div>
      );

    case "Cerner / Oracle":
      return (
        <div className="w-full h-full bg-[#0284C7] rounded-xl flex items-center justify-center text-white shadow-md font-black text-[10px] font-mono">
          ORACLE
        </div>
      );

    case "AthenaHealth":
      return (
        <div className="w-full h-full bg-[#0D9488] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
      );

    case "DrChrono EMR":
      return (
        <div className="w-full h-full bg-[#9333EA] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs font-mono">
          drC
        </div>
      );

    case "eClinicalWorks":
      return (
        <div className="w-full h-full bg-[#EA580C] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs">
          eCW
        </div>
      );

    case "Vagaro":
      return (
        <div className="w-full h-full bg-[#DB2777] rounded-xl flex items-center justify-center text-white shadow-md font-black text-lg font-serif">
          V
        </div>
      );

    case "GlossGenius":
      return (
        <div className="w-full h-full bg-[#9333EA] rounded-xl flex items-center justify-center text-white shadow-md font-black text-base italic">
          G
        </div>
      );

    case "Boulevard":
      return (
        <div className="w-full h-full bg-[#2563EB] rounded-xl flex items-center justify-center text-white shadow-md font-black text-base">
          B
        </div>
      );

    case "Mindbody":
      return (
        <div className="w-full h-full bg-[#EA580C] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/>
          </svg>
        </div>
      );

    case "Fresha":
      return (
        <div className="w-full h-full bg-[#059669] rounded-xl flex items-center justify-center text-white shadow-md font-black text-sm">
          f
        </div>
      );

    case "Zenoti":
      return (
        <div className="w-full h-full bg-[#0891B2] rounded-xl flex items-center justify-center text-white shadow-md font-black text-base font-serif">
          Z
        </div>
      );

    case "Lightspeed Retail":
      return (
        <div className="w-full h-full bg-[#DC2626] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M13 2L3 14h7v8l10-12h-7V2z"/>
          </svg>
        </div>
      );

    case "WooCommerce":
      return (
        <div className="w-full h-full bg-[#7C3AED] rounded-xl flex items-center justify-center text-white shadow-md font-black text-xs font-mono">
          Woo
        </div>
      );

    case "ShipStation":
      return (
        <div className="w-full h-full bg-[#0284C7] rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M20 8l-8-5-8 5v8l8 5 8-5V8zm-8-3l5.5 3.5L12 12 6.5 8.5 12 5zm-6 5.5l5 3v5.5l-5-3v-5.5zm12 8.5l-5 3v-5.5l5-3v5.5z"/>
          </svg>
        </div>
      );

    case "Zapier":
      return (
        <div className="w-full h-full bg-[#FF4F00] rounded-xl flex items-center justify-center text-white shadow-md font-black text-lg">
          _|_
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
          <Zap className="w-5 h-5" />
        </div>
      );
  }
}

// Global Industry Brand Catalog
export const BRAND_INTEGRATIONS_CATALOG: Record<string, BrandIntegration[]> = {
  salon: [
    {
      name: "Vagaro",
      category: "Salon & Spa Software",
      logoBg: "from-pink-500/20 via-rose-500/10 to-transparent",
      logoBadgeBg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
      borderColor: "hover:border-pink-500/50",
      tag: "Direct 2-Way Sync",
      description: "Real-time calendar checking, stylist availability, and service package booking.",
      latency: "28ms",
      icon: Scissors,
    },
    {
      name: "GlossGenius",
      category: "Stylist Management",
      logoBg: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
      logoBadgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      borderColor: "hover:border-purple-500/50",
      tag: "Instant Booking",
      description: "Automatic appointment creation, client profile sync, and deposit collection.",
      latency: "22ms",
      icon: Calendar,
    },
    {
      name: "Boulevard",
      category: "Enterprise Salon Stack",
      logoBg: "from-indigo-500/20 via-blue-500/10 to-transparent",
      logoBadgeBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      borderColor: "hover:border-indigo-500/50",
      tag: "Seamless Webhook",
      description: "Live schedule lookups and automated SMS appointment confirmations.",
      latency: "31ms",
      icon: RefreshCw,
    },
    {
      name: "Mindbody",
      category: "Fitness & Wellness POS",
      logoBg: "from-orange-500/20 via-amber-500/10 to-transparent",
      logoBadgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      borderColor: "hover:border-orange-500/50",
      tag: "Live Class Sync",
      description: "Checks appointment slots, class rosters, and trainer schedules live.",
      latency: "26ms",
      icon: Activity,
    },
    {
      name: "Fresha",
      category: "Beauty Booking Platform",
      logoBg: "from-emerald-500/20 via-teal-500/10 to-transparent",
      logoBadgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/50",
      tag: "Instant Reservation",
      description: "Direct API booking synchronization and cancellation re-booking.",
      latency: "19ms",
      icon: CheckCircle2,
    },
    {
      name: "Zenoti",
      category: "Spa & Medical Spa ERP",
      logoBg: "from-cyan-500/20 via-blue-500/10 to-transparent",
      logoBadgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      borderColor: "hover:border-cyan-500/50",
      tag: "Multi-Location Sync",
      description: "Global clinic schedule lookups and automated patient intake links.",
      latency: "34ms",
      icon: Layers,
    },
  ],

  restaurant: [
    {
      name: "Toast POS",
      category: "Restaurant POS System",
      logoBg: "from-orange-500/20 via-amber-500/10 to-transparent",
      logoBadgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      borderColor: "hover:border-orange-500/50",
      tag: "Live Kitchen KDS Sync",
      description: "Fires takeout & delivery orders directly to your KDS and updates ticket status in real time.",
      latency: "18ms",
      icon: Utensils,
    },
    {
      name: "Square POS",
      category: "Omnichannel Ordering",
      logoBg: "from-blue-500/20 via-cyan-500/10 to-transparent",
      logoBadgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      borderColor: "hover:border-blue-500/50",
      tag: "Native Order Dispatch",
      description: "Direct order dispatch, live menu availability checks, and automatic ticket printing.",
      latency: "24ms",
      icon: CreditCard,
    },
    {
      name: "Clover POS",
      category: "Point of Sale Hardware",
      logoBg: "from-emerald-500/20 via-green-500/10 to-transparent",
      logoBadgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/50",
      tag: "Direct Webhook",
      description: "Automated table management, modifier sync, and instant SMS payment collection.",
      latency: "29ms",
      icon: CheckCircle2,
    },
    {
      name: "OpenTable",
      category: "Table Reservations",
      logoBg: "from-red-500/20 via-rose-500/10 to-transparent",
      logoBadgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
      borderColor: "hover:border-red-500/50",
      tag: "Live Table Sync",
      description: "Real-time floor plan availability checks, party holds, and guest confirmations.",
      latency: "21ms",
      icon: Calendar,
    },
    {
      name: "Resy",
      category: "Hospitality Reservations",
      logoBg: "from-indigo-500/20 via-purple-500/10 to-transparent",
      logoBadgeBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      borderColor: "hover:border-indigo-500/50",
      tag: "VIP Guest Hold",
      description: "Instant table reservation holds and automated large-party deposit capture.",
      latency: "27ms",
      icon: Layers,
    },
    {
      name: "TouchBistro",
      category: "iPad Restaurant POS",
      logoBg: "from-teal-500/20 via-emerald-500/10 to-transparent",
      logoBadgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      borderColor: "hover:border-teal-500/50",
      tag: "Menu Modifier Sync",
      description: "Syncs ingredient availability and custom item modifiers directly to POS.",
      latency: "25ms",
      icon: RefreshCw,
    },
  ],

  'real-estate': [
    {
      name: "Follow Up Boss",
      category: "Real Estate CRM",
      logoBg: "from-purple-500/20 via-indigo-500/10 to-transparent",
      logoBadgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      borderColor: "hover:border-purple-500/50",
      tag: "Instant Lead Feed",
      description: "Pushes call transcripts, buyer budget ratings, and listing queries directly into your activity stream.",
      latency: "20ms",
      icon: UserCheck,
    },
    {
      name: "kvCORE",
      category: "Lead Engine & MLS",
      logoBg: "from-blue-500/20 via-sky-500/10 to-transparent",
      logoBadgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      borderColor: "hover:border-blue-500/50",
      tag: "Automated Lead Routing",
      description: "Automated buyer qualification and instant open-house attendee registration.",
      latency: "28ms",
      icon: Activity,
    },
    {
      name: "Salesforce CRM",
      category: "Enterprise Real Estate",
      logoBg: "from-sky-500/20 via-cyan-500/10 to-transparent",
      logoBadgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      borderColor: "hover:border-sky-500/50",
      tag: "Enterprise API",
      description: "Full contact record updates, viewing task creation, and automated drip campaign triggers.",
      latency: "35ms",
      icon: Cloud,
    },
    {
      name: "HubSpot CRM",
      category: "Inbound Pipeline",
      logoBg: "from-amber-500/20 via-orange-500/10 to-transparent",
      logoBadgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      borderColor: "hover:border-amber-500/50",
      tag: "2-Way Pipeline Sync",
      description: "Logs call recordings, updates deal stages, and alerts assigned agents via Slack/SMS.",
      latency: "23ms",
      icon: Database,
    },
    {
      name: "Zillow MLS",
      category: "Property MLS Feeds",
      logoBg: "from-blue-600/20 via-indigo-500/10 to-transparent",
      logoBadgeBg: "bg-blue-600/15 text-blue-300 border-blue-500/30",
      borderColor: "hover:border-blue-500/50",
      tag: "Live MLS Query",
      description: "Checks active property listings, pricing details, and open house dates in real time.",
      latency: "32ms",
      icon: Layers,
    },
    {
      name: "BoomTown",
      category: "Agent Lead Platform",
      logoBg: "from-emerald-500/20 via-teal-500/10 to-transparent",
      logoBadgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/50",
      tag: "Lead Qualification",
      description: "Screens prospective buyers, checks pre-approval status, and assigns leads.",
      latency: "26ms",
      icon: ShieldCheck,
    },
  ],

  logistics: [
    {
      name: "Samsara",
      category: "Fleet & GPS Tracking",
      logoBg: "from-cyan-500/20 via-blue-500/10 to-transparent",
      logoBadgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      borderColor: "hover:border-cyan-500/50",
      tag: "Fleet GPS Sync",
      description: "Queries live vehicle locations and provides accurate ETAs to calling customers.",
      latency: "19ms",
      icon: Truck,
    },
    {
      name: "McLeod Software",
      category: "Dispatch TMS",
      logoBg: "from-amber-500/20 via-orange-500/10 to-transparent",
      logoBadgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      borderColor: "hover:border-amber-500/50",
      tag: "Dispatch Integration",
      description: "Logs driver arrivals, updates load statuses, and clears dock bottlenecks automatically.",
      latency: "33ms",
      icon: RefreshCw,
    },
    {
      name: "Motive",
      category: "ELD & Fleet Safety",
      logoBg: "from-emerald-500/20 via-teal-500/10 to-transparent",
      logoBadgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/50",
      tag: "Live Driver Status",
      description: "Automates driver check-ins and logs dock arrival timestamps instantly.",
      latency: "25ms",
      icon: CheckCircle2,
    },
    {
      name: "Geotab",
      category: "Telematics Platform",
      logoBg: "from-blue-500/20 via-sky-500/10 to-transparent",
      logoBadgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      borderColor: "hover:border-blue-500/50",
      tag: "Telematics API",
      description: "Live route tracking and automated customer delivery ETA updates.",
      latency: "21ms",
      icon: Activity,
    },
  ],

  healthcare: [
    {
      name: "Epic Systems",
      category: "Healthcare EMR / EHR",
      logoBg: "from-indigo-500/20 via-blue-500/10 to-transparent",
      logoBadgeBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      borderColor: "hover:border-indigo-500/50",
      tag: "HIPAA Compliant EMR",
      description: "Secure appointment scheduling, patient intake logging, and provider schedule sync.",
      latency: "38ms",
      icon: Stethoscope,
    },
    {
      name: "Cerner / Oracle",
      category: "Clinical EHR Network",
      logoBg: "from-cyan-500/20 via-teal-500/10 to-transparent",
      logoBadgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      borderColor: "hover:border-cyan-500/50",
      tag: "EHR Live Sync",
      description: "Automated appointment scheduling, pre-visit paperwork reminders, and clinic routing.",
      latency: "42ms",
      icon: Shield,
    },
    {
      name: "AthenaHealth",
      category: "Practice Management",
      logoBg: "from-teal-500/20 via-emerald-500/10 to-transparent",
      logoBadgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      borderColor: "hover:border-teal-500/50",
      tag: "Live Calendar Sync",
      description: "Real-time doctor calendar queries and automated patient reminder calling.",
      latency: "27ms",
      icon: Calendar,
    },
    {
      name: "DrChrono EMR",
      category: "Mobile EHR Platform",
      logoBg: "from-purple-500/20 via-rose-500/10 to-transparent",
      logoBadgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      borderColor: "hover:border-purple-500/50",
      tag: "Patient Intake API",
      description: "Direct appointment booking and instant insurance verification workflows.",
      latency: "31ms",
      icon: CheckCircle2,
    },
    {
      name: "eClinicalWorks",
      category: "Ambulatory EHR",
      logoBg: "from-amber-500/20 via-orange-500/10 to-transparent",
      logoBadgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      borderColor: "hover:border-amber-500/50",
      tag: "Clinic Routing Sync",
      description: "Verifies accepted provider plans and schedules specialist consultations.",
      latency: "36ms",
      icon: HelpCircle,
    },
  ],

  retail: [
    {
      name: "Shopify POS",
      category: "E-Commerce & Retail POS",
      logoBg: "from-emerald-500/20 via-teal-500/10 to-transparent",
      logoBadgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/50",
      tag: "Live Stock Sync",
      description: "Real-time SKU lookup, instant return QR code generation, and store pickup reserves.",
      latency: "23ms",
      icon: ShoppingBag,
    },
    {
      name: "Lightspeed Retail",
      category: "Multi-Store Retail POS",
      logoBg: "from-red-500/20 via-orange-500/10 to-transparent",
      logoBadgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
      borderColor: "hover:border-red-500/50",
      tag: "POS Order Fire",
      description: "Instant in-store pickup holding, inventory status checks, and customer loyalty lookups.",
      latency: "28ms",
      icon: CreditCard,
    },
    {
      name: "WooCommerce",
      category: "E-Com Webhooks",
      logoBg: "from-purple-500/20 via-indigo-500/10 to-transparent",
      logoBadgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      borderColor: "hover:border-purple-500/50",
      tag: "Direct Webhook",
      description: "Automated tracking status delivery and customer order history querying.",
      latency: "20ms",
      icon: RefreshCw,
    },
    {
      name: "ShipStation",
      category: "Fulfillment & Tracking",
      logoBg: "from-blue-500/20 via-cyan-500/10 to-transparent",
      logoBadgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      borderColor: "hover:border-blue-500/50",
      tag: "Live Tracking Sync",
      description: "Automated WISMO (Where Is My Order) tracking updates sent via SMS.",
      latency: "25ms",
      icon: Truck,
    },
    {
      name: "Zapier",
      category: "Universal Automation",
      logoBg: "from-orange-500/20 via-amber-500/10 to-transparent",
      logoBadgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      borderColor: "hover:border-orange-500/50",
      tag: "7,000+ App Sync",
      description: "Direct webhook connection to any custom inventory database or custom ERP.",
      latency: "14ms",
      icon: Zap,
    },
  ],
};

interface SoftwareIntegrationsSectionProps {
  data: IndustryData;
}

export function SoftwareIntegrationsSection({ data }: SoftwareIntegrationsSectionProps) {
  const [isPaused, setIsPaused] = useState(false);
  const integrations = BRAND_INTEGRATIONS_CATALOG[data.id] || BRAND_INTEGRATIONS_CATALOG["restaurant"];

  // Create a duplicated array for seamless infinite sliding animation
  const sliderItems = [...integrations, ...integrations, ...integrations, ...integrations];

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header Badge & Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 rounded-full text-xs font-extrabold text-indigo-300 uppercase tracking-wider mb-4 backdrop-blur shadow-lg shadow-indigo-500/10">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>2-Way POS & Software Integrations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            {data.posIntegrations?.title || "Seamless Software Integration"}
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {data.posIntegrations?.subtitle || "Instant 2-way data synchronization with your existing tech stack out of the box."}
          </p>
        </motion.div>

        {/* ── INFINITE CONTINUOUS AUTO-SLIDING MARQUEE CAROUSEL ── */}
        <div className="mb-16 relative">
          <div className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 text-center mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Supported Platforms (Hover to Inspect)</span>
          </div>

          {/* Left & Right Gradient Blur Edges for Smooth Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

          {/* Sliding Infinite Track */}
          <div
            className="overflow-hidden py-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              className="flex items-center gap-5 w-max"
              animate={isPaused ? {} : { x: [0, -1800] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 32,
                  ease: "linear",
                },
              }}
            >
              {sliderItems.map((item, idx) => {
                return (
                  <div
                    key={`row1-${idx}`}
                    className={`w-72 sm:w-80 bg-slate-900/90 border border-slate-800 ${item.borderColor} rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.03] group shrink-0 relative overflow-hidden cursor-pointer`}
                  >
                    {/* Top Glow Ribbon */}
                    <div className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${item.logoBg} rounded-full blur-xl opacity-40 group-hover:opacity-100 transition-opacity`} />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        {/* Vector SVG Brand Logo Badge */}
                        <div className="w-12 h-12 shrink-0 group-hover:scale-105 transition-transform">
                          <SoftwareLogo name={item.name} />
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono font-medium block">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2 relative z-10">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] font-mono relative z-10">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${item.logoBadgeBg}`}>
                        {item.tag}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        {item.latency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* ── DIRECT CUSTOM POS / SYSTEM BANNER ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/40 rounded-3xl p-8 md:p-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden group"
        >
          {/* Subtle Ambient Light Pill */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Cpu className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Custom API & Webhook Service</span>
              </div>
              <h4 className="text-xl font-extrabold text-white mb-1">Have a Proprietary POS or Custom Software?</h4>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {data.posIntegrations?.customNotice || "We build custom 2-way API & webhook connectors for ANY software system within 48 hours."}
              </p>
            </div>
          </div>

          <a
            href="#booking"
            className="group/btn px-8 py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-full hover:bg-slate-100 transition-all shrink-0 shadow-xl flex items-center gap-2 relative z-10"
          >
            <span>Request Custom API Setup</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
