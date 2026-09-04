-- =========================================================================
-- CallAutomate - Complete Consolidated & Updated Supabase Database Migration
-- Single, fully idempotent migration script with CREATE IF NOT EXISTS,
-- CREATE OR REPLACE FUNCTION, and DROP POLICY IF EXISTS.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- -------------------------------------------------------------------------
-- 2. ENUM TYPES
-- -------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin',
      'operations',
      'support',
      'finance',
      'owner',
      'admin',
      'manager',
      'member',
      'viewer',
      'reseller'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'active',
      'paused',
      'expired'
    );
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4. TABLES CREATION
-- -------------------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'member'::public.user_role,
  tenant_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active_subscription_id UUID,
  reseller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  commission_rate NUMERIC(4,2) DEFAULT 0.20,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,2) DEFAULT 0.20;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;

-- Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  total_minutes INTEGER NOT NULL,
  price_per_minute NUMERIC(8,6) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_price_id TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT plans_monthly_price_check CHECK (monthly_price >= 0::numeric),
  CONSTRAINT plans_price_per_minute_check CHECK (price_per_minute >= 0::numeric),
  CONSTRAINT plans_total_minutes_check CHECK (total_minutes > 0)
);
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'active'::public.subscription_status,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  minutes_used NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_price_snapshot NUMERIC(10, 2) NOT NULL,
  price_per_minute_snapshot NUMERIC(8, 6) NOT NULL,
  total_minutes_snapshot INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_session_id TEXT,
  CONSTRAINT subscriptions_dates_check CHECK (ends_at IS NULL OR ends_at > started_at),
  CONSTRAINT subscriptions_minutes_used_check CHECK (minutes_used >= 0::numeric)
);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Circular reference constraint on users -> active_subscription_id
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_active_subscription_id_fkey;

ALTER TABLE public.users 
  ADD CONSTRAINT users_active_subscription_id_fkey 
  FOREIGN KEY (active_subscription_id) 
  REFERENCES public.subscriptions(id) 
  ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- Voice Agents Table
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
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tenant_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- User Agent Access Table
CREATE TABLE IF NOT EXISTS public.user_agent_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_agent_access_user_agent_unique UNIQUE (user_id, agent_id)
);

-- Phone Orders Table
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

-- Phone Numbers Table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
ALTER TABLE public.phone_numbers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.phone_numbers ADD COLUMN IF NOT EXISTS telnyx_id TEXT;
ALTER TABLE public.phone_numbers ADD COLUMN IF NOT EXISTS retell_agent_id TEXT;

-- Call Logs Table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id TEXT NOT NULL UNIQUE,
  retell_agent_id TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  call_status TEXT NOT NULL DEFAULT 'unknown',
  start_timestamp BIGINT,
  end_timestamp BIGINT,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN end_timestamp IS NOT NULL AND start_timestamp IS NOT NULL
      THEN floor((end_timestamp - start_timestamp) / 1000)::integer
    ELSE NULL END
  ) STORED,
  from_number TEXT,
  to_number TEXT,
  transcript TEXT,
  transcript_object JSONB,
  recording_url TEXT,
  call_cost NUMERIC(10,6),
  disconnection_reason TEXT,
  call_analysis JSONB,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS disconnection_reason TEXT;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS call_analysis JSONB;

-- CDRs Table
CREATE TABLE IF NOT EXISTS public.cdrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT NOT NULL UNIQUE,
  customer_number TEXT,
  start_datetime TEXT,
  end_datetime TEXT,
  total_seconds INTEGER,
  total_mins NUMERIC(5, 2),
  assistant_id TEXT,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  call_recording TEXT,
  is_successful BOOLEAN,
  disconnection_reason TEXT,
  call_info TEXT,
  customer_sentiment TEXT,
  client_name TEXT
);

-- Pending Overage Invoices Table
CREATE TABLE IF NOT EXISTS public.pending_overage_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL UNIQUE REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  overage_minutes NUMERIC(10, 2) NOT NULL DEFAULT 0,
  overage_amount NUMERIC(10, 4) NOT NULL DEFAULT 0,
  price_per_minute NUMERIC(10, 6) NOT NULL DEFAULT 0,
  plan_name TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT pending_overage_invoices_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'waived'::text]))
);

-- User Assistant Assignments Table
CREATE TABLE IF NOT EXISTS public.user_assistant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  assistant_id TEXT NOT NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  type TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_name TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Drop unused Retell tables if they exist
DROP TABLE IF EXISTS public.retell_voice_cache CASCADE;
DROP TABLE IF EXISTS public.retell_tests CASCADE;
DROP TABLE IF EXISTS public.retell_phone_numbers CASCADE;
DROP TABLE IF EXISTS public.retell_llms CASCADE;
DROP TABLE IF EXISTS public.retell_call_analysis CASCADE;
DROP TABLE IF EXISTS public.retell_batch_calls CASCADE;
DROP TABLE IF EXISTS public.retell_audit_logs CASCADE;

-- Retell Knowledge Bases Table
CREATE TABLE IF NOT EXISTS public.retell_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id TEXT NOT NULL UNIQUE,
  knowledge_base_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'indexing',
  document_count INT DEFAULT 0,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hot Leads Table
CREATE TABLE IF NOT EXISTS public.hot_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  industry TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hot Leads Call Results Table
CREATE TABLE IF NOT EXISTS public.hot_leads_callresults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.hot_leads(id) ON DELETE CASCADE,
  call_id TEXT UNIQUE,
  call_summary TEXT,
  transcript TEXT,
  call_successful BOOLEAN DEFAULT FALSE,
  in_voicemail BOOLEAN DEFAULT FALSE,
  user_sentiment TEXT,
  outcome TEXT,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 5. INDEXES (PERFORMANCE & OPTIMIZATION)
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (lower(email));
CREATE INDEX IF NOT EXISTS users_active_subscription_id_idx ON public.users USING btree (active_subscription_id) WHERE (active_subscription_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS users_reseller_id_idx ON public.users USING btree (reseller_id);

CREATE INDEX IF NOT EXISTS plans_is_active_idx ON public.plans USING btree (is_active);
CREATE INDEX IF NOT EXISTS plans_name_idx ON public.plans USING btree (name);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON public.subscriptions USING btree (plan_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS subscriptions_started_at_idx ON public.subscriptions USING btree (started_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON public.subscriptions USING btree (user_id, status) WHERE (status = 'active'::public.subscription_status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_session_id_idx ON public.subscriptions USING btree (stripe_session_id) WHERE (stripe_session_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS agents_created_by_idx ON public.agents(created_by);
CREATE INDEX IF NOT EXISTS agents_tenant_idx ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS agents_retell_id_idx ON public.agents(retell_agent_id);

CREATE INDEX IF NOT EXISTS user_agent_access_user_idx ON public.user_agent_access(user_id);
CREATE INDEX IF NOT EXISTS user_agent_access_agent_idx ON public.user_agent_access(agent_id);

CREATE INDEX IF NOT EXISTS call_logs_agent_id_idx ON public.call_logs(agent_id);
CREATE INDEX IF NOT EXISTS call_logs_retell_agent_idx ON public.call_logs(retell_agent_id);
CREATE INDEX IF NOT EXISTS call_logs_call_status_idx ON public.call_logs(call_status);
CREATE INDEX IF NOT EXISTS call_logs_start_ts_idx ON public.call_logs(start_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cdrs_assistant_id ON public.cdrs(assistant_id);
CREATE INDEX IF NOT EXISTS idx_cdrs_call_id ON public.cdrs(call_id);

CREATE INDEX IF NOT EXISTS idx_pending_overage_invoices_user_id ON public.pending_overage_invoices USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_pending_overage_invoices_status ON public.pending_overage_invoices USING btree (status);

CREATE INDEX IF NOT EXISTS user_assistant_assignments_user_idx ON public.user_assistant_assignments USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_orders_user_id ON public.phone_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_orders_status ON public.phone_orders(status);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone ON public.phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_retell_agent ON public.phone_numbers(retell_agent_id);

CREATE INDEX IF NOT EXISTS idx_retell_kb_id ON public.retell_knowledge_bases(knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_hot_leads_callresults_customer_id ON public.hot_leads_callresults(customer_id);
CREATE INDEX IF NOT EXISTS idx_hot_leads_callresults_call_id ON public.hot_leads_callresults(call_id);

-- -------------------------------------------------------------------------
-- 6. TRIGGERS & TRIGGER FUNCTIONS
-- -------------------------------------------------------------------------

-- Auto-update updated_at triggers
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at 
  BEFORE UPDATE ON public.agents 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS plans_updated_at ON public.plans;
CREATE TRIGGER plans_updated_at 
  BEFORE UPDATE ON public.plans 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS phone_orders_updated_at ON public.phone_orders;
CREATE TRIGGER phone_orders_updated_at 
  BEFORE UPDATE ON public.phone_orders 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS phone_numbers_updated_at ON public.phone_numbers;
CREATE TRIGGER phone_numbers_updated_at 
  BEFORE UPDATE ON public.phone_numbers 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Overage Sync Trigger
CREATE OR REPLACE FUNCTION public.sync_subscription_overage()
RETURNS TRIGGER AS $$
DECLARE
  overage_min numeric;
  overage_amt numeric;
  plan_display_name text;
  invoice_id uuid;
BEGIN
  IF new.total_minutes_snapshot > 0 AND new.minutes_used > new.total_minutes_snapshot THEN
    overage_min := new.minutes_used - new.total_minutes_snapshot;
    overage_amt := round((overage_min * new.price_per_minute_snapshot)::numeric, 4);

    SELECT display_name INTO plan_display_name FROM public.plans WHERE id = new.plan_id;
    IF plan_display_name IS NULL THEN
      plan_display_name := '—';
    END IF;

    SELECT id INTO invoice_id FROM public.pending_overage_invoices
    WHERE subscription_id = new.id AND status = 'pending'
    LIMIT 1;

    IF invoice_id IS NOT NULL THEN
      UPDATE public.pending_overage_invoices SET
        overage_minutes = overage_min,
        overage_amount = overage_amt,
        price_per_minute = new.price_per_minute_snapshot,
        plan_name = plan_display_name,
        period_start = new.started_at,
        period_end = new.ends_at
      WHERE id = invoice_id;
    ELSE
      INSERT INTO public.pending_overage_invoices (
        user_id,
        subscription_id,
        status,
        overage_minutes,
        overage_amount,
        price_per_minute,
        plan_name,
        period_start,
        period_end
      ) VALUES (
        new.user_id,
        new.id,
        'pending',
        overage_min,
        overage_amt,
        new.price_per_minute_snapshot,
        plan_display_name,
        new.started_at,
        new.ends_at
      );
    END IF;
  ELSE
    DELETE FROM public.pending_overage_invoices 
    WHERE subscription_id = new.id AND status = 'pending';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subscriptions_overage_sync_trig ON public.subscriptions;
CREATE TRIGGER subscriptions_overage_sync_trig
  AFTER INSERT OR UPDATE OF minutes_used, status, plan_id, started_at, ends_at ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_overage();

-- CDR Minutes Calculator Trigger
CREATE OR REPLACE FUNCTION public.calculate_subscription_minutes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_active_sub_id UUID;
  v_diff_mins NUMERIC(10, 2) := 0;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.user_assistant_assignments
  WHERE assistant_id = NEW.assistant_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT created_by INTO v_user_id
    FROM public.agents
    WHERE retell_agent_id = NEW.assistant_id OR id::text = NEW.assistant_id
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT active_subscription_id INTO v_active_sub_id
    FROM public.users
    WHERE id = v_user_id;

    IF v_active_sub_id IS NOT NULL THEN
      IF TG_OP = 'INSERT' THEN
        v_diff_mins := COALESCE(NEW.total_mins, 0);
      ELSIF TG_OP = 'UPDATE' THEN
        v_diff_mins := COALESCE(NEW.total_mins, 0) - COALESCE(OLD.total_mins, 0);
      END IF;

      IF v_diff_mins <> 0 THEN
        UPDATE public.subscriptions
        SET minutes_used = GREATEST(0, minutes_used + v_diff_mins)
        WHERE id = v_active_sub_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_subscription_minutes ON public.cdrs;
CREATE TRIGGER trg_calculate_subscription_minutes
  AFTER INSERT OR UPDATE ON public.cdrs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_subscription_minutes();

-- Expiration webhook trigger
CREATE OR REPLACE FUNCTION public.handle_subscription_expiration_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  plan_name TEXT;
  payload JSONB;
  webhook_secret TEXT;
  app_url TEXT;
BEGIN
  SELECT email, full_name INTO user_email, user_name
  FROM public.users
  WHERE id = NEW.user_id;

  SELECT display_name INTO plan_name
  FROM public.plans
  WHERE id = NEW.plan_id;

  payload := json_build_object(
    'email', user_email,
    'name', user_name,
    'planName', plan_name,
    'subscriptionId', NEW.id,
    'endedAt', NEW.ends_at
  );

  BEGIN
    SELECT decrypted_secret INTO webhook_secret FROM vault.decrypted_secrets WHERE name = 'webhook_secret_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    webhook_secret := NULL;
  END;

  BEGIN
    SELECT decrypted_secret INTO app_url FROM vault.decrypted_secrets WHERE name = 'app_url' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    app_url := NULL;
  END;

  IF webhook_secret IS NULL THEN
    webhook_secret := 'YOUR_SECRET_WEBHOOK_KEY';
  END IF;

  IF app_url IS NULL THEN
    app_url := 'https://your-domain.com';
  END IF;

  PERFORM net.http_post(
    url := app_url || '/api/billing/notify-expiration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_subscription_expired ON public.subscriptions;
CREATE TRIGGER trigger_on_subscription_expired
  AFTER UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.status = 'active'::public.subscription_status AND NEW.status = 'expired'::public.subscription_status)
  EXECUTE FUNCTION public.handle_subscription_expiration_trigger();

-- Invoices Triggers
CREATE OR REPLACE FUNCTION public.handle_subscription_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  plan_display_name TEXT;
  is_renewal BOOLEAN;
  inv_type TEXT;
  inv_number TEXT;
BEGIN
  SELECT email, full_name INTO user_email, user_name
  FROM public.users
  WHERE id = NEW.user_id;

  SELECT display_name INTO plan_display_name
  FROM public.plans
  WHERE id = NEW.plan_id;

  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = NEW.user_id AND id <> NEW.id
  ) INTO is_renewal;

  IF is_renewal THEN
    inv_type := 'renewal';
  ELSE
    inv_type := 'subscription';
  END IF;

  inv_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  INSERT INTO public.invoices (
    user_id,
    subscription_id,
    invoice_number,
    amount,
    status,
    type,
    plan_name,
    billing_email,
    billing_name,
    period_start,
    period_end,
    paid_at
  ) VALUES (
    NEW.user_id,
    NEW.id,
    inv_number,
    NEW.monthly_price_snapshot,
    'paid',
    inv_type,
    COALESCE(plan_display_name, 'Standard Plan'),
    COALESCE(user_email, 'billing@callautomate.ai'),
    COALESCE(user_name, 'Customer'),
    NEW.started_at,
    COALESCE(NEW.ends_at, NEW.started_at + INTERVAL '30 days'),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_subscription_insert ON public.subscriptions;
CREATE TRIGGER trigger_on_subscription_insert
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_insert_trigger();

CREATE OR REPLACE FUNCTION public.handle_overage_invoice_update_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  inv_number TEXT;
BEGIN
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    SELECT email, full_name INTO user_email, user_name
    FROM public.users
    WHERE id = NEW.user_id;

    inv_number := 'INV-OV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

    INSERT INTO public.invoices (
      user_id,
      subscription_id,
      invoice_number,
      amount,
      status,
      type,
      plan_name,
      billing_email,
      billing_name,
      period_start,
      period_end,
      paid_at
    ) VALUES (
      NEW.user_id,
      NEW.subscription_id,
      inv_number,
      NEW.overage_amount,
      'paid',
      'overage',
      COALESCE(NEW.plan_name, 'Overage Billing'),
      COALESCE(user_email, 'billing@callautomate.ai'),
      COALESCE(user_name, 'Customer'),
      NEW.period_start,
      NEW.period_end,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_overage_invoice_update ON public.pending_overage_invoices;
CREATE TRIGGER trigger_on_overage_invoice_update
  AFTER UPDATE OF status ON public.pending_overage_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_overage_invoice_update_trigger();

-- -------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agent_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_overage_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assistant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_leads_callresults ENABLE ROW LEVEL SECURITY;

-- Helper to safely recreate policies
DO $$
BEGIN
  -- Service Role Policies (Full Bypass)
  DROP POLICY IF EXISTS "service_role_all_agents" ON public.agents;
  CREATE POLICY "service_role_all_agents" ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_user_agent_access" ON public.user_agent_access;
  CREATE POLICY "service_role_all_user_agent_access" ON public.user_agent_access FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_call_logs" ON public.call_logs;
  CREATE POLICY "service_role_all_call_logs" ON public.call_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_users" ON public.users;
  CREATE POLICY "service_role_all_users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_plans" ON public.plans;
  CREATE POLICY "service_role_all_plans" ON public.plans FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_subscriptions" ON public.subscriptions;
  CREATE POLICY "service_role_all_subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_poi" ON public.pending_overage_invoices;
  CREATE POLICY "service_role_all_poi" ON public.pending_overage_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_user_assignments" ON public.user_assistant_assignments;
  CREATE POLICY "service_role_all_user_assignments" ON public.user_assistant_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_cdrs" ON public.cdrs;
  CREATE POLICY "service_role_all_cdrs" ON public.cdrs FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_invoices" ON public.invoices;
  CREATE POLICY "service_role_all_invoices" ON public.invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_phone_orders" ON public.phone_orders;
  CREATE POLICY "service_role_all_phone_orders" ON public.phone_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "service_role_all_phone_numbers" ON public.phone_numbers;
  CREATE POLICY "service_role_all_phone_numbers" ON public.phone_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- Authenticated Users Policies
  DROP POLICY IF EXISTS "users_select_own_profile" ON public.users;
  CREATE POLICY "users_select_own_profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

  DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
  CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

  DROP POLICY IF EXISTS "anyone_select_active_plans" ON public.plans;
  CREATE POLICY "anyone_select_active_plans" ON public.plans FOR SELECT USING (is_active = true);

  DROP POLICY IF EXISTS "users_select_own_subscriptions" ON public.subscriptions;
  CREATE POLICY "users_select_own_subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_invoices" ON public.invoices;
  CREATE POLICY "users_select_own_invoices" ON public.invoices FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_poi" ON public.pending_overage_invoices;
  CREATE POLICY "users_select_own_poi" ON public.pending_overage_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_uaa" ON public.user_assistant_assignments;
  CREATE POLICY "users_select_own_uaa" ON public.user_assistant_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_cdrs" ON public.cdrs;
  CREATE POLICY "users_select_own_cdrs" ON public.cdrs FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_assistant_assignments uaa
      WHERE uaa.user_id = auth.uid() AND uaa.assistant_id = cdrs.assistant_id
    ) OR EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.created_by = auth.uid() AND (a.retell_agent_id = cdrs.assistant_id OR a.id::text = cdrs.assistant_id)
    )
  );

  DROP POLICY IF EXISTS "users_select_own_agents" ON public.agents;
  CREATE POLICY "users_select_own_agents" ON public.agents FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_agent_access uaa WHERE uaa.user_id = auth.uid() AND uaa.agent_id = agents.retell_agent_id
    )
  );

  DROP POLICY IF EXISTS "users_insert_own_agents" ON public.agents;
  CREATE POLICY "users_insert_own_agents" ON public.agents FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

  DROP POLICY IF EXISTS "users_update_own_agents" ON public.agents;
  CREATE POLICY "users_update_own_agents" ON public.agents FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

  DROP POLICY IF EXISTS "users_delete_own_agents" ON public.agents;
  CREATE POLICY "users_delete_own_agents" ON public.agents FOR DELETE TO authenticated USING (created_by = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_phone_orders" ON public.phone_orders;
  CREATE POLICY "users_select_own_phone_orders" ON public.phone_orders FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_insert_own_phone_orders" ON public.phone_orders;
  CREATE POLICY "users_insert_own_phone_orders" ON public.phone_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_select_own_phone_numbers" ON public.phone_numbers;
  CREATE POLICY "users_select_own_phone_numbers" ON public.phone_numbers FOR SELECT TO authenticated USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "users_manage_own_phone_numbers" ON public.phone_numbers;
  CREATE POLICY "users_manage_own_phone_numbers" ON public.phone_numbers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

  -- Hot Leads Policies
  DROP POLICY IF EXISTS "Allow public insert to hot_leads" ON public.hot_leads;
  CREATE POLICY "Allow public insert to hot_leads" ON public.hot_leads FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow service role full access on hot_leads" ON public.hot_leads;
  CREATE POLICY "Allow service role full access on hot_leads" ON public.hot_leads FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow public insert to hot_leads_callresults" ON public.hot_leads_callresults;
  CREATE POLICY "Allow public insert to hot_leads_callresults" ON public.hot_leads_callresults FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow service role full access on hot_leads_callresults" ON public.hot_leads_callresults;
  CREATE POLICY "Allow service role full access on hot_leads_callresults" ON public.hot_leads_callresults FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow authenticated read on hot_leads_callresults" ON public.hot_leads_callresults;
  CREATE POLICY "Allow authenticated read on hot_leads_callresults" ON public.hot_leads_callresults FOR SELECT USING (true);

  -- Platform Admin Policies
  DROP POLICY IF EXISTS "admin_all_users" ON public.users;
  CREATE POLICY "admin_all_users" ON public.users FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_plans" ON public.plans;
  CREATE POLICY "admin_all_plans" ON public.plans FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;
  CREATE POLICY "admin_all_subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_poi" ON public.pending_overage_invoices;
  CREATE POLICY "admin_all_poi" ON public.pending_overage_invoices FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_invoices" ON public.invoices;
  CREATE POLICY "admin_all_invoices" ON public.invoices FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_uaa" ON public.user_assistant_assignments;
  CREATE POLICY "admin_all_uaa" ON public.user_assistant_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_cdrs" ON public.cdrs;
  CREATE POLICY "admin_all_cdrs" ON public.cdrs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations', 'support'))
  );

  DROP POLICY IF EXISTS "admin_all_agents" ON public.agents;
  CREATE POLICY "admin_all_agents" ON public.agents FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_phone_orders" ON public.phone_orders;
  CREATE POLICY "admin_all_phone_orders" ON public.phone_orders FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );

  DROP POLICY IF EXISTS "admin_all_phone_numbers" ON public.phone_numbers;
  CREATE POLICY "admin_all_phone_numbers" ON public.phone_numbers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'operations'))
  );
END $$;

-- -------------------------------------------------------------------------
-- 8. CRON JOB SCHEDULE (HOURLY AUTO-EXPIRATION)
-- -------------------------------------------------------------------------
DELETE FROM cron.job WHERE name = 'auto-expire-subscriptions';

SELECT cron.schedule(
  'auto-expire-subscriptions',
  '0 * * * *',
  $$
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();
  $$
);
