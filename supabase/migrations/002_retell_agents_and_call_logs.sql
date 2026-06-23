-- ============================================================
-- Migration: Retell AI Agents + Call Logs + User-Agent mapping
-- ============================================================

-- 1. Agents table (stores Retell agent config + local metadata)
create table public.agents (
  id                uuid primary key default gen_random_uuid(),
  retell_agent_id   text not null unique,
  name              text not null,
  voice_id          text,
  language          text not null default 'en-US',
  response_engine   text not null default 'retell-llm',
  llm_websocket_url text,
  begin_message     text,
  general_prompt    text,
  config            jsonb not null default '{}',    -- full Retell config snapshot
  created_by        uuid not null references public.users(id) on delete restrict,
  tenant_id         text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index agents_created_by_idx on public.agents(created_by);
create index agents_tenant_idx     on public.agents(tenant_id);
create index agents_retell_id_idx  on public.agents(retell_agent_id);

-- 2. User ↔ Agent access mapping (who can see which agent)
create table public.user_agent_access (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  agent_id   uuid not null references public.agents(id) on delete cascade,
  granted_by uuid references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique(user_id, agent_id)
);

create index user_agent_access_user_idx  on public.user_agent_access(user_id);
create index user_agent_access_agent_idx on public.user_agent_access(agent_id);

-- 3. Call logs table (populated by Retell webhook)
create table public.call_logs (
  id                uuid primary key default gen_random_uuid(),
  retell_call_id    text not null unique,
  retell_agent_id   text not null,
  agent_id          uuid references public.agents(id) on delete set null,
  call_status       text not null default 'unknown',   -- registered|ongoing|ended|error
  start_timestamp   bigint,                             -- ms epoch from Retell
  end_timestamp     bigint,
  duration_seconds  integer generated always as (
                      case when end_timestamp is not null and start_timestamp is not null
                        then floor((end_timestamp - start_timestamp) / 1000)::integer
                      else null end
                    ) stored,
  from_number       text,
  to_number         text,
  transcript        text,
  transcript_object jsonb,
  recording_url     text,
  call_cost         numeric(10,6),                     -- USD
  disconnection_reason text,
  call_analysis     jsonb,
  raw_payload       jsonb not null default '{}',       -- full webhook body
  created_at        timestamptz not null default now()
);

create index call_logs_agent_id_idx       on public.call_logs(agent_id);
create index call_logs_retell_agent_idx   on public.call_logs(retell_agent_id);
create index call_logs_call_status_idx    on public.call_logs(call_status);
create index call_logs_start_ts_idx       on public.call_logs(start_timestamp desc);

-- 4. Auto-update updated_at on agents
create trigger agents_updated_at
  before update on public.agents
  for each row execute procedure public.set_updated_at();

-- 5. RLS
alter table public.agents           enable row level security;
alter table public.user_agent_access enable row level security;
alter table public.call_logs        enable row level security;

-- Service role (server-side) gets full access to everything
create policy "service_role_all_agents"      on public.agents           for all to service_role using (true) with check (true);
create policy "service_role_all_uaa"         on public.user_agent_access for all to service_role using (true) with check (true);
create policy "service_role_all_call_logs"   on public.call_logs        for all to service_role using (true) with check (true);
