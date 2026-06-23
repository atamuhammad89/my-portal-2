-- ============================================================
-- Migration: Create users table for custom auth
-- Role-based access: only users in this table can log in.
-- ============================================================

-- 1. Create enum for all possible roles
create type public.user_role as enum (
  'super_admin',
  'operations',
  'support',
  'finance',
  'owner',
  'admin',
  'manager',
  'member',
  'viewer'
);

-- 2. Create the users table
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  -- bcrypt hash stored here; compare at login time
  password_hash text not null,
  full_name    text not null,
  role         public.user_role not null default 'member',
  tenant_id    text,                     -- optional: scope user to a tenant
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- 4. Row-level security: only the service role can read/write
--    (the Next.js API route uses the service key, not the anon key)
alter table public.users enable row level security;

-- Allow the service role full access (used server-side only)
create policy "service_role_all" on public.users
  for all
  to service_role
  using (true)
  with check (true);

-- 5. Index for fast email lookup on login
create index users_email_idx on public.users (lower(email));

-- ============================================================
-- Seed: insert example users (replace password_hashes below)
-- Generate hashes locally: `npx bcryptjs-cli hash "yourpassword" 10`
-- Or use: https://bcrypt-generator.com/ (cost=10)
-- ============================================================

-- Example super admin  (password: "admin123")
-- insert into public.users (email, password_hash, full_name, role)
-- values (
--   'admin@example.com',
--   '$2a$10$REPLACE_WITH_REAL_HASH',
--   'Super Admin',
--   'super_admin'
-- );

-- Example regular user  (password: "user123")
-- insert into public.users (email, password_hash, full_name, role, tenant_id)
-- values (
--   'user@example.com',
--   '$2a$10$REPLACE_WITH_REAL_HASH',
--   'Regular User',
--   'owner',
--   'tenant_abc'
-- );
