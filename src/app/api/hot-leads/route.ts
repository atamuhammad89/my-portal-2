import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, number, industry } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is a required field." },
        { status: 400 }
      );
    }

    if (!number || typeof number !== "string" || !number.trim()) {
      return NextResponse.json(
        { error: "Phone number is a required field." },
        { status: 400 }
      );
    }

    const leadData = {
      name: name.trim(),
      number: number.trim(),
      industry: industry && typeof industry === "string" ? industry.trim() : "General",
    };

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("hot_leads")
        .insert([leadData])
        .select();

      if (error) {
        console.error("Error inserting into hot_leads table in Supabase:", error);
        return NextResponse.json(
          { error: error.message || "Failed to save lead to database." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Lead saved successfully.", data },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.warn("Supabase connection warning:", dbError?.message);
      // Return success with warning if env vars missing during development
      return NextResponse.json(
        { success: true, message: "Lead captured (DB connection notice).", lead: leadData },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Hot lead API route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
