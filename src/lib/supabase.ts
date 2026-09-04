import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const cdrsSupabaseUrl = process.env.NEXT_PUBLIC_CDRS_SUPABASE_URL || supabaseUrl;
const cdrsSupabaseAnonKey = process.env.NEXT_PUBLIC_CDRS_SUPABASE_ANON_KEY || supabaseAnonKey;

export const supabase = createClient(cdrsSupabaseUrl, cdrsSupabaseAnonKey);
export const cdrsSupabase = createClient(cdrsSupabaseUrl, cdrsSupabaseAnonKey);
