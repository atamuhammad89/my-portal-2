-- =========================================================================
-- Migration: Add 'reseller' role to public.user_role enum
-- =========================================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'reseller';
