"use client";

import { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { BookingCalendar } from "@/components/landing/BookingCalendar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { UpgradeModal } from "@/components/landing/UpgradeModal";
import { IndustryPage } from "@/components/landing/IndustryPage";
import { ContactPage } from "@/components/landing/ContactPage";
import { AboutPage } from "@/components/landing/AboutPage";
import { ChatWidget } from "@/components/landing/ChatWidget";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { industriesData } from "@/data/industries";

export type LandingView =
  | "home"
  | "contact"
  | "about"
  | "booking"
  | "industry-salon"
  | "industry-real-estate"
  | "industry-logistics"
  | "industry-healthcare"
  | "industry-retail"
  | "industry-restaurant";

export default function Home() {
  const [currentView, setCurrentView] = useState<LandingView>("home");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getIndustryData = () => {
    switch (currentView) {
      case "industry-salon": return industriesData["salon"];
      case "industry-real-estate": return industriesData["real-estate"];
      case "industry-logistics": return industriesData["logistics"];
      case "industry-healthcare": return industriesData["healthcare"];
      case "industry-retail": return industriesData["retail"];
      case "industry-restaurant": return industriesData["restaurant"];
      default: return null;
    }
  };

  const industryData = getIndustryData();

  const handleNavigate = (view: string) => {
    const sectionIds = ["live-demo", "pricing", "features", "how-it-works", "booking"];

    if (sectionIds.includes(view)) {
      if (currentView === "home") {
        const el = document.getElementById(view);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      setCurrentView("home");
      // Poll for element to mount in DOM after state transition
      let attempts = 0;
      const pollElement = () => {
        const el = document.getElementById(view);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (attempts < 12) {
          attempts++;
          setTimeout(pollElement, 40);
        }
      };
      setTimeout(pollElement, 40);
      return;
    }

    setCurrentView(view as LandingView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 relative flex flex-col">
      {/* Header */}
      <LandingHeader
        onNavigate={handleNavigate}
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-grow">
        {currentView === "home" ? (
          <>
            <LandingHero onDemoClick={() => handleNavigate("live-demo")} />
            <LiveDemo />
            <LandingProblem />
            <LandingSolution />
            <LandingFeatures />
            <LandingHowItWorks />
            <LandingPricing />
            <BookingCalendar />
          </>
        ) : currentView === "contact" ? (
          <ContactPage />
        ) : currentView === "about" ? (
          <AboutPage />
        ) : industryData ? (
          <>
            <IndustryPage
              data={industryData}
              onDemoClick={() => handleNavigate("live-demo")}
            />
            <LiveDemo
              filterIndustryId={industryData.id}
              colorTheme={industryData.colorTheme}
            />
            <div className="bg-white border-t border-slate-200">
              <LandingPricing />
              <BookingCalendar />
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Floating AI Chat Assistant */}
      <ChatWidget />

      {/* Floating WhatsApp Action Button */}
      <WhatsAppButton />

      {/* Trial Expired / Upgrade Prompt Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
