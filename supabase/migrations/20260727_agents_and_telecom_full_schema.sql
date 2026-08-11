-- =========================================================================
-- Complete Database Schema Migration: Voice Agents & Telecom Management
-- Execute this SQL in your Supabase / PostgreSQL SQL Editor
-- =========================================================================

-- 1. Voice Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_agent_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL DEFAULT 'retell-Cimo',
  language TEXT NOT NULL DEFAULT 'en-US',
  response_engine TEXT NOT NULL DEFAULT 'retell-llm',
  llm_websocket_url TEXT,
  begin_message TEXT,
  general_prompt TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Phone Orders Table
CREATE TABLE IF NOT EXISTS public.phone_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  phone_number TEXT NOT NULL,
  customer_reference TEXT,
  requirements_met BOOLEAN NOT NULL DEFAULT true,
  sub_order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Phone Numbers Table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'US',
  area_code TEXT,
  type TEXT NOT NULL DEFAULT 'local',
  capabilities JSONB NOT NULL DEFAULT '{"voice": true, "sms": true}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  telnyx_id TEXT,
  retell_agent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agents_retell_id ON public.agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON public.agents(created_by);
CREATE INDEX IF NOT EXISTS idx_phone_orders_user ON public.phone_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user ON public.phone_numbers(user_id);

-- 5. Row Level Security Policies
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_agents" ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_phone_orders" ON public.phone_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_phone_numbers" ON public.phone_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_own_agents" ON public.agents FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "users_own_phone_orders" ON public.phone_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_own_phone_numbers" ON public.phone_numbers FOR SELECT USING (user_id = auth.uid());
