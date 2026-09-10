import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const DEFAULT_PLANS = [
  {
    id: "plan_free_trial",
    name: "free_trial",
    display_name: "30-Day Free Trial",
    monthly_price: 0,
    total_minutes: 100,
    price_per_minute: 0,
    description: "30 days full platform access with 100 free AI voice calling minutes. No credit card required.",
    stripe_price_id: null,
    features: [
      "100 Free AI Calling Minutes",
      "24/7 AI Voice Receptionist",
      "CRM & Calendar Sync",
      "Real-time Call Transcripts",
      "Sub-300ms Voice Engine",
    ],
    is_featured: false,
  },
  {
    id: "plan_starter",
    name: "starter",
    display_name: "Starter",
    monthly_price: 49,
    total_minutes: 500,
    price_per_minute: 0.10,
    description: "Perfect for small businesses starting with AI voice automation.",
    stripe_price_id: null,
    features: [
      "500 Included Minutes / mo",
      "$0.10 / extra minute",
      "1 Dedicated Phone Number",
      "Webhooks & Zapier Integration",
      "Email & SMS Notifications",
    ],
    is_featured: false,
  },
  {
    id: "plan_growth",
    name: "growth",
    display_name: "Growth",
    monthly_price: 149,
    total_minutes: 2000,
    price_per_minute: 0.08,
    description: "Designed for growing teams requiring multi-agent workflows and high call volume.",
    stripe_price_id: null,
    features: [
      "2,000 Included Minutes / mo",
      "$0.08 / extra minute",
      "Up to 5 Dedicated Phone Numbers",
      "Custom AI Voice Agent Prompts",
      "Priority Technical Support",
      "Advanced Analytics & Sentiment",
    ],
    is_featured: true,
  },
  {
    id: "plan_enterprise",
    name: "enterprise",
    display_name: "Enterprise",
    monthly_price: 499,
    total_minutes: 8000,
    price_per_minute: 0.06,
    description: "Custom high-volume platform operations with dedicated SLAs and custom integrations.",
    stripe_price_id: null,
    features: [
      "8,000 Included Minutes / mo",
      "$0.06 / extra minute",
      "Unlimited Phone Numbers",
      "99.9% Uptime SLA Guarantee",
      "Dedicated Account Manager",
      "Custom Telephony & Webhooks",
    ],
    is_featured: false,
  },
];

/**
 * GET /api/plans
 * Returns all active plans. Used by the pricing page and renewal modal.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: plans, error } = await supabase
      .from("plans")
      .select(
        "id, name, display_name, monthly_price, total_minutes, price_per_minute, description, stripe_price_id, features, is_featured"
      )
      .eq("is_active", true)
      .order("monthly_price", { ascending: true });

    if (error || !plans || plans.length === 0) {
      if (error) console.warn("[/api/plans] Supabase query error, serving default plans:", error.message);
      return NextResponse.json({ plans: DEFAULT_PLANS });
    }

    return NextResponse.json({ plans });
  } catch (err) {
    console.warn("[/api/plans] Exception caught, serving default plans:", err);
    return NextResponse.json({ plans: DEFAULT_PLANS });
  }
}