import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 * Uses the SERVICE ROLE key so it can bypass RLS and verify passwords.
 * NEVER import this file in client components.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Server-only Supabase client for CDRs (Call Detail Records) table.
 * Uses dedicated CDRs credentials if provided, with fallback to main Supabase credentials.
 */
export function createCdrsServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_CDRS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.CDRS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_CDRS_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing CDRS Supabase credentials environment variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

