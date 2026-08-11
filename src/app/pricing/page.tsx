"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { UpgradeModal } from "@/components/landing/UpgradeModal";

export default function PricingPage() {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleNavigate = (view: string) => {
    if (view === "home") {
      router.push("/");
    } else {
      router.push(`/#${view}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500/20 selection:text-indigo-900 flex flex-col justify-between">
      <LandingHeader
        onNavigate={handleNavigate}
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      <main className="pt-20 flex-grow">
        <LandingPricing />
      </main>

      <LandingFooter />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}