-- =========================================================================
-- Migration: Add reseller columns to users table
-- =========================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS users_reseller_id_idx ON public.users(reseller_id);
