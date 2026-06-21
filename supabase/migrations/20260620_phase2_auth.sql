-- Phase 2 Authentication: profiles + login_attempts tables, RLS, trigger
-- Migration: 20260620_phase2_auth.sql

-- ============================================================
-- 1. public.profiles
-- ============================================================

create table public.profiles (
  id          uuid        not null primary key references auth.users on delete cascade,
  username    text        not null unique
                            constraint username_length check (char_length(username) between 3 and 20)
                            constraint username_format check (username ~ '^[a-zA-Z0-9_]+$'),
  role        text        not null default 'student'
                            constraint role_values check (role in ('student', 'admin')),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Grants
grant select on public.profiles to anon;
grant select, insert on public.profiles to authenticated;
-- Column-scoped UPDATE (SEC-02 privilege-escalation guard): authenticated may change
-- only username/updated_at. `role` and `deleted_at` are privileged columns — granting
-- table-wide UPDATE would let a student run `update profiles set role='admin'` against
-- their own row (the RLS policy below scopes rows, not columns), self-escalating past the
-- admin gate (AUTH-05). Role promotion and soft-delete run through the service_role admin
-- client only.
grant update (username, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Indexes
create index idx_profiles_username on public.profiles (username);
create index idx_profiles_role     on public.profiles (role);

-- ============================================================
-- 2. Row Level Security — profiles
-- ============================================================

alter table public.profiles enable row level security;

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users can update their own profile (no INSERT policy — trigger only)
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============================================================
-- 3. handle_new_user trigger — auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. public.login_attempts
-- ============================================================

create table public.login_attempts (
  id           bigserial    primary key,
  email        text         not null,
  attempted_at timestamptz  not null default now(),
  ip_address   text
);

-- Index for rate-limit queries (email + recency)
create index idx_login_attempts_email_time
  on public.login_attempts (email, attempted_at desc);

-- RLS enabled — ZERO policies = service_role only access
alter table public.login_attempts enable row level security;
