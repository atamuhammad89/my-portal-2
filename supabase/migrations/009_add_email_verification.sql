-- ============================================================
-- Migration: Add email verification columns to users table
-- Run this in your Supabase Dashboard SQL Editor to update your schema.
-- ============================================================

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
