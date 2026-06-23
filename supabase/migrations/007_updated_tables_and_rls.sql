-- =========================================================================
-- Migration: Save updated tables schema and apply secure RLS policies
-- =========================================================================

-- 1. cdrs Table
CREATE TABLE IF NOT EXISTS public.cdrs (
  id uuid not null default gen_random_uuid (),
  call_id text not null,
  customer_number text null,
  start_datetime text null,
  end_datetime text null,
  total_seconds integer null,
  total_mins numeric(5, 2) null,
  assistant_id text null,
  transcript text null,
  created_at timestamp with time zone null default now(),
  call_recording text null,
  is_successful boolean null,
  disconnection_reason text null,
  call_info text null,
  customer_sentiment text null,
  client_name text null,
  constraint cdrs_pkey primary key (id),
  constraint cdrs_call_id_key unique (call_id)
) TABLESPACE pg_default;

-- Create the subscription minutes calculator trigger function
CREATE OR REPLACE FUNCTION public.calculate_subscription_minutes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_active_sub_id UUID;
  v_diff_mins NUMERIC(10, 2) := 0;
BEGIN
  -- 1. Resolve user ID from assistant_id
  SELECT user_id INTO v_user_id
  FROM public.user_assistant_assignments
  WHERE assistant_id = NEW.assistant_id
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- 2. Resolve active subscription ID for the user
    SELECT active_subscription_id INTO v_active_sub_id
    FROM public.users
    WHERE id = v_user_id;

    IF v_active_sub_id IS NOT NULL THEN
      -- 3. Calculate difference in minutes
      IF TG_OP = 'INSERT' THEN
        v_diff_mins := COALESCE(NEW.total_mins, 0);
      ELSIF TG_OP = 'UPDATE' THEN
        v_diff_mins := COALESCE(NEW.total_mins, 0) - COALESCE(OLD.total_mins, 0);
      END IF;

      -- 4. Apply difference to subscription's minutes_used
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
EXECUTE FUNCTION calculate_subscription_minutes ();


-- 2. plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  display_name text not null,
  monthly_price numeric(10, 2) not null,
  total_minutes integer not null,
  price_per_minute numeric(8, 6) not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  stripe_price_id text null,
  features jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  constraint plans_pkey primary key (id),
  constraint plans_name_key unique (name),
  constraint plans_monthly_price_check check ((monthly_price >= (0)::numeric)),
  constraint plans_price_per_minute_check check ((price_per_minute >= (0)::numeric)),
  constraint plans_total_minutes_check check ((total_minutes > 0))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS plans_is_active_idx on public.plans using btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS plans_name_idx on public.plans using btree (name) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS plans_updated_at ON public.plans;
CREATE TRIGGER plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

-- 3. subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  plan_id uuid not null,
  status public.subscription_status not null default 'active'::subscription_status,
  started_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone null,
  cancelled_at timestamp with time zone null,
  minutes_used numeric(10, 2) not null default 0,
  monthly_price_snapshot numeric(10, 2) not null,
  price_per_minute_snapshot numeric(8, 6) not null,
  total_minutes_snapshot integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  stripe_session_id text null,
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete RESTRICT,
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint subscriptions_dates_check check (((ends_at is null) or (ends_at > started_at))),
  constraint subscriptions_minutes_used_check check ((minutes_used >= (0)::numeric))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx on public.subscriptions using btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx on public.subscriptions using btree (plan_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS subscriptions_status_idx on public.subscriptions using btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS subscriptions_started_at_idx on public.subscriptions using btree (started_at desc) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx on public.subscriptions using btree (user_id, status) TABLESPACE pg_default where (status = 'active'::subscription_status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_session_id_idx on public.subscriptions using btree (stripe_session_id) TABLESPACE pg_default where (stripe_session_id is not null);

DROP TRIGGER IF EXISTS subscriptions_overage_sync_trig ON public.subscriptions;
CREATE TRIGGER subscriptions_overage_sync_trig
AFTER INSERT OR UPDATE OF minutes_used, status, plan_id, started_at, ends_at ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_overage ();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS trigger_on_subscription_expired ON public.subscriptions;
CREATE TRIGGER trigger_on_subscription_expired
AFTER UPDATE OF status ON public.subscriptions
FOR EACH ROW WHEN (old.status = 'active'::subscription_status and new.status = 'expired'::subscription_status)
EXECUTE FUNCTION handle_subscription_expiration_trigger ();

-- 4. pending_overage_invoices Table
CREATE TABLE IF NOT EXISTS public.pending_overage_invoices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  subscription_id uuid not null,
  status text not null default 'pending'::text,
  overage_minutes numeric(10, 2) not null default 0,
  overage_amount numeric(10, 4) not null default 0,
  price_per_minute numeric(10, 6) not null default 0,
  plan_name text null,
  period_start timestamp with time zone null,
  period_end timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  paid_at timestamp with time zone null,
  resolved_at timestamp with time zone null,
  constraint pending_overage_invoices_pkey primary key (id),
  constraint pending_overage_invoices_subscription_id_key unique (subscription_id),
  constraint pending_overage_invoices_subscription_id_fkey foreign KEY (subscription_id) references subscriptions (id) on delete CASCADE,
  constraint pending_overage_invoices_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint pending_overage_invoices_status_check check ((status = any (array['pending'::text, 'paid'::text, 'waived'::text])))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pending_overage_invoices_user_id on public.pending_overage_invoices using btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pending_overage_invoices_status on public.pending_overage_invoices using btree (status) TABLESPACE pg_default;

-- 5. user_assistant_assignments Table
CREATE TABLE IF NOT EXISTS public.user_assistant_assignments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  assistant_id text not null,
  assigned_by uuid null,
  assigned_at timestamp with time zone not null default now(),
  constraint user_assistant_assignments_pkey primary key (id),
  constraint user_assistant_assignments_user_id_key unique (user_id),
  constraint user_assistant_assignments_assigned_by_fkey foreign KEY (assigned_by) references users (id) on delete set null,
  constraint user_assistant_assignments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_assistant_assignments_user_idx on public.user_assistant_assignments using btree (user_id) TABLESPACE pg_default;

-- 6. users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid not null default gen_random_uuid (),
  email text not null,
  password_hash text not null,
  full_name text not null,
  role public.user_role not null default 'member'::user_role,
  tenant_id text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  active_subscription_id uuid null,
  reseller_id uuid null,
  commission_rate numeric(4, 2) null default 0.20,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_active_subscription_id_fkey foreign KEY (active_subscription_id) references subscriptions (id) on delete set null deferrable initially DEFERRED,
  constraint users_reseller_id_fkey foreign KEY (reseller_id) references users (id) on delete set null
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS users_email_idx on public.users using btree (lower(email)) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS users_active_subscription_id_idx on public.users using btree (active_subscription_id) TABLESPACE pg_default where (active_subscription_id is not null);
CREATE INDEX IF NOT EXISTS users_reseller_id_idx on public.users using btree (reseller_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.cdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_overage_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assistant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Apply explicit service_role access policies (dropping existing ones first)
DROP POLICY IF EXISTS "service_role_all" ON public.users;
CREATE POLICY "service_role_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_plans" ON public.plans;
CREATE POLICY "service_role_all_plans" ON public.plans FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_subscriptions" ON public.subscriptions;
CREATE POLICY "service_role_all_subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_poi" ON public.pending_overage_invoices;
CREATE POLICY "service_role_all_poi" ON public.pending_overage_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_uaa" ON public.user_assistant_assignments;
CREATE POLICY "service_role_all_uaa" ON public.user_assistant_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_cdrs" ON public.cdrs;
CREATE POLICY "service_role_all_cdrs" ON public.cdrs FOR ALL TO service_role USING (true) WITH CHECK (true);

