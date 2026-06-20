-- =========================================================================
-- Migration: Automatic Subscription Expiration Check & Webhook Trigger
-- =========================================================================

-- 1. Ensure DB Enum Types Support "paused" and "expired"
-- Note: ALTER TYPE ... ADD VALUE cannot be executed within a transaction block in older Postgres,
-- but is fine in newer versions or runs natively in Supabase's migration runner.
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Enable pg_cron and pg_net Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule Cron Job to Check Expirations every 5 minutes
-- This job scans for active subscriptions whose end date has passed,
-- updating their status to 'expired'.
SELECT cron.schedule(
  'auto-expire-subscriptions',
  '*/5 * * * *', -- Run every 5 minutes
  $$
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();
  $$
);

-- 4. Create Expiration Trigger Function
-- This function gets the user's contact information and issues a secure
-- HTTP POST request to trigger the email delivery.
CREATE OR REPLACE FUNCTION public.handle_subscription_expiration_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  plan_name TEXT;
  payload JSONB;
BEGIN
  -- 1. Fetch user contact details
  SELECT email, full_name INTO user_email, user_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- 2. Fetch the plan name
  SELECT display_name INTO plan_name
  FROM public.plans
  WHERE id = NEW.plan_id;

  -- 3. Construct payload
  payload := json_build_object(
    'email', user_email,
    'name', user_name,
    'planName', plan_name,
    'subscriptionId', NEW.id,
    'endedAt', NEW.ends_at
  );

  -- 4. Make asynchronous HTTP request to Next.js API
  -- IMPORTANT: Replace 'https://your-domain.com' with your actual production site URL or ngrok tunnel URL for local testing.
  -- IMPORTANT: Replace 'YOUR_SECRET_WEBHOOK_KEY' with the same secret key value set in Next.js environment (WEBHOOK_SECRET_KEY).
  PERFORM net.http_post(
    url := 'https://your-domain.com/api/billing/notify-expiration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_WEBHOOK_KEY"}'::jsonb,
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Trigger for Exact-Once Execution
-- The "WHEN" clause guarantees this trigger runs ONLY when the status
-- transitions from 'active' to 'expired', preventing duplicate emails.
CREATE OR REPLACE TRIGGER trigger_on_subscription_expired
  AFTER UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'expired')
  EXECUTE FUNCTION public.handle_subscription_expiration_trigger();
