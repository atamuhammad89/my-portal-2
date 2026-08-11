-- =========================================================================
-- Migration: Phone Numbers and Phone Orders Tables
-- =========================================================================

-- 1. Phone Orders Table
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

-- 2. Phone Numbers Table
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

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_phone_orders_user_id ON public.phone_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_orders_status ON public.phone_orders(status);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone ON public.phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_retell_agent ON public.phone_numbers(retell_agent_id);

-- 4. Triggers for updated_at
CREATE OR REPLACE TRIGGER phone_orders_updated_at 
  BEFORE UPDATE ON public.phone_orders 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER phone_numbers_updated_at 
  BEFORE UPDATE ON public.phone_numbers 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Row Level Security Policies
ALTER TABLE public.phone_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policies
CREATE POLICY "service_role_all_phone_orders" ON public.phone_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_phone_numbers" ON public.phone_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Users Policies
CREATE POLICY "users_select_own_phone_orders" ON public.phone_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_phone_orders" ON public.phone_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_select_own_phone_numbers" ON public.phone_numbers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_manage_own_phone_numbers" ON public.phone_numbers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin Access Policies
CREATE POLICY "admin_all_phone_orders" ON public.phone_orders FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
);

CREATE POLICY "admin_all_phone_numbers" ON public.phone_numbers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
);
