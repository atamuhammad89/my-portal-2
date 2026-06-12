-- ============================================================
-- Migration: Event-Driven Overage Billing Sync Trigger
-- ============================================================

-- Function to automatically sync overage to pending_overage_invoices
create or replace function public.sync_subscription_overage()
returns trigger as $$
declare
  overage_min numeric;
  overage_amt numeric;
  plan_display_name text;
  invoice_id uuid;
begin
  -- Calculate overage minutes and amount
  if new.total_minutes_snapshot > 0 and new.minutes_used > new.total_minutes_snapshot then
    overage_min := new.minutes_used - new.total_minutes_snapshot;
    overage_amt := round((overage_min * new.price_per_minute_snapshot)::numeric, 4);

    -- Fetch plan display name
    select display_name into plan_display_name from public.plans where id = new.plan_id;
    if plan_display_name is null then
      plan_display_name := '—';
    end if;

    -- Check if there is an existing pending invoice for this subscription
    select id into invoice_id from public.pending_overage_invoices
    where subscription_id = new.id and status = 'pending'
    limit 1;

    if invoice_id is not null then
      -- Update existing pending invoice
      update public.pending_overage_invoices set
        overage_minutes = overage_min,
        overage_amount = overage_amt,
        price_per_minute = new.price_per_minute_snapshot,
        plan_name = plan_display_name,
        period_start = new.started_at,
        period_end = new.ends_at
      where id = invoice_id;
    else
      -- Insert new pending invoice
      insert into public.pending_overage_invoices (
        user_id,
        subscription_id,
        status,
        overage_minutes,
        overage_amount,
        price_per_minute,
        plan_name,
        period_start,
        period_end
      ) values (
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
    end if;
  else
    -- If usage drops below limit (e.g. manual correction), remove the pending invoice
    delete from public.pending_overage_invoices 
    where subscription_id = new.id and status = 'pending';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on subscriptions updates of minutes_used or metadata changes
create or replace trigger subscriptions_overage_sync_trig
  after insert or update of minutes_used, status, plan_id, started_at, ends_at on public.subscriptions
  for each row
  execute function public.sync_subscription_overage();
