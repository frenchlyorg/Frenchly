-- Phase 6: AI Writing Checker — DB migration
-- Adds writing_submissions table for feedback storage and rate-limit tracking.
-- RLS policies scope all access to the authenticated user's own rows.
-- No UPDATE policy: rows are immutable once written (D-12 one-shot per sub-component).
-- No DELETE policy: cascade on user deletion handles cleanup.

-- ============================================================
-- 1. public.writing_submissions
-- ============================================================

create table public.writing_submissions (
  id                 uuid        not null primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users on delete cascade,
  sub_component_id   uuid        not null references public.sub_components on delete cascade,
  feedback_text      text,                    -- null if rate-limited or API error (graceful fallback — D-06, Pitfall 5)
  created_at         timestamptz not null default now()
);

-- One submission per student per sub-component (D-12: one-shot, no resubmit)
create unique index idx_ws_user_sub on public.writing_submissions (user_id, sub_component_id);

-- Rate-limit index: fast COUNT WHERE user_id AND created_at >= today UTC (D-10, D-11)
create index idx_ws_user_created on public.writing_submissions (user_id, created_at);

-- Grants: authenticated can read/insert their own rows; service_role has full access
-- (mirrors Phase 3 user-scoped table pattern exactly)
grant select, insert on public.writing_submissions to authenticated;
grant all on public.writing_submissions to service_role;

alter table public.writing_submissions enable row level security;

-- Policy: students read only their own writing submissions
create policy "Students can read own writing submissions"
  on public.writing_submissions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: students insert only their own writing submissions
create policy "Students can insert own writing submissions"
  on public.writing_submissions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
