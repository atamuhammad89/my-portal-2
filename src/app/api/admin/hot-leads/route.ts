import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/admin/hot-leads
 * 
 * Fetches:
 * 1. hotLeads: all entries from public.hot_leads
 * 2. callResults: all entries from public.hot_leads_callresults enriched with customer details
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Query hot_leads table
    const { data: hotLeads, error: leadsError } = await supabase
      .from("hot_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (leadsError) {
      console.warn("[GET /api/admin/hot-leads] Error fetching hot_leads:", leadsError.message);
    }

    // Map leads into key lookup map
    const leadMap: Record<string, { id: string; name: string; number: string; industry: string }> = {};
    (hotLeads || []).forEach((lead: any) => {
      if (lead.id) {
        leadMap[lead.id] = {
          id: lead.id,
          name: lead.name || "Unknown Lead",
          number: lead.number || "—",
          industry: lead.industry || "General",
        };
      }
    });

    // 2. Query hot_leads_callresults table
    const { data: rawCallResults, error: resultsError } = await supabase
      .from("hot_leads_callresults")
      .select("*")
      .order("created_at", { ascending: false });

    if (resultsError) {
      console.warn("[GET /api/admin/hot-leads] Error fetching call results:", resultsError.message);
    }

    // Format and enrich call results with associated customer details
    const callResults = (rawCallResults || []).map((res: any) => {
      const customer = res.customer_id ? leadMap[res.customer_id] : null;
      return {
        id: res.id,
        customer_id: res.customer_id,
        customer_name: customer?.name || "Unknown / Direct Call",
        customer_number: customer?.number || "—",
        customer_industry: customer?.industry || "—",
        call_id: res.call_id || res.id,
        call_summary: res.call_summary || "No summary recorded.",
        transcript: res.transcript || null,
        call_successful: Boolean(res.call_successful),
        in_voicemail: Boolean(res.in_voicemail),
        user_sentiment: res.user_sentiment || "Neutral",
        outcome: res.outcome || "GENERAL_INFO",
        start_timestamp: res.start_timestamp || res.created_at,
        end_timestamp: res.end_timestamp || null,
        created_at: res.created_at || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      hotLeads: hotLeads || [],
      callResults: callResults || [],
      totalLeads: (hotLeads || []).length,
      totalCallResults: (callResults || []).length,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/hot-leads] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch hot leads & call results",
        hotLeads: [],
        callResults: [],
        totalLeads: 0,
        totalCallResults: 0,
      },
      { status: 500 }
    );
  }
}
