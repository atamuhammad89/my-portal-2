-- =========================================================================
-- Migration: Create Invoices Table & Automated Trigger
-- =========================================================================

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  subscription_id uuid null,
  invoice_number text not null,
  amount numeric(10, 2) not null,
  status text not null default 'paid'::text,
  type text not null, -- 'subscription', 'renewal', 'overage'
  plan_name text not null,
  billing_email text not null,
  billing_name text not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  paid_at timestamp with time zone null default now(),
  constraint invoices_pkey primary key (id),
  constraint invoices_invoice_number_key unique (invoice_number),
  constraint invoices_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade,
  constraint invoices_subscription_id_fkey foreign key (subscription_id) references public.subscriptions(id) on delete set null
) TABLESPACE pg_default;

-- Create indices for querying
CREATE INDEX IF NOT EXISTS idx_invoices_user_id on public.invoices using btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invoices_created_at on public.invoices using btree (created_at desc) TABLESPACE pg_default;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "service_role_all_invoices" ON public.invoices;
CREATE POLICY "service_role_all_invoices" ON public.invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_view_own_invoices" ON public.invoices;
CREATE POLICY "users_view_own_invoices" ON public.invoices FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Create trigger to generate invoices on subscription insert (initial subscription or renewal)
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
  -- Fetch user contact details
  SELECT email, full_name INTO user_email, user_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Fetch the plan name
  SELECT display_name INTO plan_display_name
  FROM public.plans
  WHERE id = NEW.plan_id;

  -- Determine if it's a renewal or initial subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = NEW.user_id AND id <> NEW.id
  ) INTO is_renewal;

  IF is_renewal THEN
    inv_type := 'renewal';
  ELSE
    inv_type := 'subscription';
  END IF;

  -- Generate unique invoice number
  inv_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Insert invoice
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

-- Trigger to execute on subscriptions insert
DROP TRIGGER IF EXISTS trigger_on_subscription_insert ON public.subscriptions;
CREATE TRIGGER trigger_on_subscription_insert
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_insert_trigger();

-- 5. Create trigger to generate invoices on pending overage invoice PAID
CREATE OR REPLACE FUNCTION public.handle_overage_invoice_update_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  inv_number TEXT;
BEGIN
  -- We only create a permanent invoice record when the overage invoice is PAID
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    -- Fetch user contact details
    SELECT email, full_name INTO user_email, user_name
    FROM public.users
    WHERE id = NEW.user_id;

    -- Generate unique invoice number
    inv_number := 'INV-OV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

    -- Insert invoice
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

-- Trigger to execute on pending overage invoices status update
DROP TRIGGER IF EXISTS trigger_on_overage_invoice_update ON public.pending_overage_invoices;
CREATE TRIGGER trigger_on_overage_invoice_update
  AFTER UPDATE OF status ON public.pending_overage_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_overage_invoice_update_trigger();

-- 6. Backfill existing subscriptions
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
)
SELECT 
  s.user_id,
  s.id as subscription_id,
  'INV-' || to_char(s.created_at, 'YYYYMMDD') || '-' || upper(substr(md5(s.id::text || random()::text), 1, 6)) as invoice_number,
  s.monthly_price_snapshot as amount,
  'paid' as status,
  CASE 
    WHEN (SELECT count(*) FROM public.subscriptions prev WHERE prev.user_id = s.user_id AND prev.started_at < s.started_at) > 0 THEN 'renewal'::text
    ELSE 'subscription'::text
  END as type,
  COALESCE(p.display_name, 'Standard Plan') as plan_name,
  COALESCE(u.email, 'billing@callautomate.ai') as billing_email,
  COALESCE(u.full_name, 'Customer') as billing_name,
  s.started_at as period_start,
  COALESCE(s.ends_at, s.started_at + INTERVAL '30 days') as period_end,
  s.created_at as paid_at
FROM public.subscriptions s
JOIN public.users u ON s.user_id = u.id
JOIN public.plans p ON s.plan_id = p.id
ON CONFLICT DO NOTHING;
