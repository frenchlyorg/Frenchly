-- Phase 3 Lesson Framework: levels, lessons, sub_components, sub_component_progress tables,
-- RLS policies, current_level_id placement field on profiles, updated handle_new_user trigger,
-- and French 1 seed + French 2 locked stub.
-- Migration: 20260622_phase3_lessons.sql

-- ============================================================
-- 1. public.levels
-- ============================================================

create table public.levels (
  id             uuid        not null primary key default gen_random_uuid(),
  slug           text        not null unique,
  name           text        not null,
  level_number   int         not null unique,
  description    text,
  created_at     timestamptz not null default now()
);

-- Grant: authenticated only — content is for logged-in students (D-L05 / T-03-03 Information Disclosure)
-- Never grant to anon: anonymous visitors must not read curriculum rows.
grant select on public.levels to authenticated;

alter table public.levels enable row level security;

create policy "Authenticated users can read all levels"
  on public.levels
  for select
  to authenticated
  using (true);

-- ============================================================
-- 2. public.lessons
-- ============================================================

create table public.lessons (
  id                  uuid        not null primary key default gen_random_uuid(),
  level_id            uuid        not null references public.levels on delete cascade,
  slug                text        not null,
  title               text        not null,
  description         text,
  estimated_minutes   int         not null default 10,
  position            int         not null default 0,
  created_at          timestamptz not null default now(),
  unique (level_id, slug)
);

create index idx_lessons_level_id on public.lessons (level_id);
create index idx_lessons_position  on public.lessons (level_id, position);

grant select on public.lessons to authenticated;

alter table public.lessons enable row level security;

create policy "Authenticated users can read all lessons"
  on public.lessons
  for select
  to authenticated
  using (true);

-- ============================================================
-- 3. public.sub_components
-- ============================================================

create table public.sub_components (
  id          uuid        not null primary key default gen_random_uuid(),
  lesson_id   uuid        not null references public.lessons on delete cascade,
  title       text        not null,
  kind        text        not null
                constraint sub_component_kind check (
                  kind in ('explainer', 'practice', 'writing')
                ),
  content     text,
  position    int         not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_sub_components_lesson_id on public.sub_components (lesson_id);
create index idx_sub_components_position  on public.sub_components (lesson_id, position);

grant select on public.sub_components to authenticated;

alter table public.sub_components enable row level security;

create policy "Authenticated users can read all sub-components"
  on public.sub_components
  for select
  to authenticated
  using (true);

-- ============================================================
-- 4. public.sub_component_progress  (per-student binary completion)
-- ============================================================

create table public.sub_component_progress (
  user_id            uuid        not null references auth.users on delete cascade,
  sub_component_id   uuid        not null references public.sub_components on delete cascade,
  completed_at       timestamptz not null default now(),
  primary key (user_id, sub_component_id)
);

create index idx_scp_user_id          on public.sub_component_progress (user_id);
create index idx_scp_sub_component_id on public.sub_component_progress (sub_component_id);

-- Grants: authenticated can read/insert/update their own rows; service_role has full access
-- (T-03-02 Tampering: RLS enforces user_id scope; grants enable the operations)
grant select, insert, update on public.sub_component_progress to authenticated;
grant all on public.sub_component_progress to service_role;

alter table public.sub_component_progress enable row level security;

-- All three policies use (select auth.uid()) subquery form — stable evaluation, not per-row
-- (mirrors Phase 2 pattern; prevents cross-student read T-03-05 and write T-03-02)
create policy "Students can read own progress"
  on public.sub_component_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own progress"
  on public.sub_component_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update own progress"
  on public.sub_component_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 5. Placement field on profiles (D-L05, D-L06)
-- ============================================================

-- Add current_level_id to profiles; defaults to French 1 via trigger and seed update.
-- Phase 4 updates this field when a student passes the level diagnostic.
--
-- Security guard (T-03-01 Elevation of Privilege): do NOT add current_level_id to
-- the column-scoped UPDATE grant for authenticated. The Phase 2 grant stays:
--   grant update (username, updated_at) on public.profiles to authenticated;
-- Only service_role (admin client) may set current_level_id. This prevents a student
-- from self-upgrading to French 2 ahead of Phase 4.

alter table public.profiles
  add column current_level_id uuid references public.levels on delete set null;

-- ============================================================
-- 6. Seed — French 1 sample data + French 2 locked stub
-- ============================================================

do $$
declare
  v_french1_id  uuid;
  v_lesson1_id  uuid;
  v_lesson2_id  uuid;
begin
  -- Level: French 1
  insert into public.levels (id, slug, name, level_number, description)
  values (
    gen_random_uuid(),
    'french-1',
    'French 1',
    1,
    'The foundation — greetings, articles, basic sentence structure.'
  )
  returning id into v_french1_id;

  -- Lesson 1: Greetings
  insert into public.lessons (id, level_id, slug, title, estimated_minutes, position)
  values (
    gen_random_uuid(),
    v_french1_id,
    'greetings',
    'Greetings and introductions',
    10,
    1
  )
  returning id into v_lesson1_id;

  insert into public.sub_components (lesson_id, title, kind, content, position)
  values
    (
      v_lesson1_id,
      'How French greetings work',
      'explainer',
      '## Bonjour vs Salut' || chr(10) || chr(10) ||
      'French has both formal and informal greetings.' || chr(10) || chr(10) ||
      '- **Bonjour** — formal or neutral; use with strangers, teachers, adults' || chr(10) ||
      '- **Salut** — informal; use with friends and peers' || chr(10) || chr(10) ||
      'Time-of-day greetings:' || chr(10) ||
      '- **Bonsoir** — good evening' || chr(10) ||
      '- **Bonne nuit** — good night (parting only)',
      1
    ),
    (
      v_lesson1_id,
      'Practice: match the greeting',
      'practice',
      null,
      2
    ),
    (
      v_lesson1_id,
      'Write your own introduction',
      'writing',
      null,
      3
    );

  -- Lesson 2: Definite articles
  insert into public.lessons (id, level_id, slug, title, estimated_minutes, position)
  values (
    gen_random_uuid(),
    v_french1_id,
    'definite-articles',
    'Definite articles: le, la, les',
    12,
    2
  )
  returning id into v_lesson2_id;

  insert into public.sub_components (lesson_id, title, kind, content, position)
  values
    (
      v_lesson2_id,
      'What are definite articles?',
      'explainer',
      '## Le, la, l'', les' || chr(10) || chr(10) ||
      'French nouns have grammatical gender — masculine or feminine.' || chr(10) || chr(10) ||
      '| Article | Gender | Example |' || chr(10) ||
      '|---------|--------|---------|' || chr(10) ||
      '| **le** | masculine singular | le livre (the book) |' || chr(10) ||
      '| **la** | feminine singular | la table (the table) |' || chr(10) ||
      '| **l''''** | before vowel/h | l''''école (the school) |' || chr(10) ||
      '| **les** | all plural | les amis (the friends) |',
      1
    ),
    (
      v_lesson2_id,
      'Practice: choose the right article',
      'practice',
      null,
      2
    );

  -- Level: French 2 (locked stub — no lessons; D-L05/D-L06)
  insert into public.levels (slug, name, level_number, description)
  values (
    'french-2',
    'French 2',
    2,
    'Expanding vocabulary and grammar.'
  );

  -- Default existing users to French 1 (Pitfall 3 guard: NULL current_level_id = all levels locked)
  update public.profiles
  set current_level_id = v_french1_id
  where current_level_id is null;

end;
$$;

-- ============================================================
-- 7. Update handle_new_user trigger function
-- ============================================================

-- CREATE OR REPLACE the function (do NOT re-create the trigger on_auth_user_created —
-- it already exists from Phase 2). The new version sets current_level_id to French 1
-- for every new signup, preventing NULL placement for users created after the migration.
-- (Pitfall 3 / RESEARCH Open Question 1 resolution)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, current_level_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (select id from public.levels where level_number = 1)
  );
  return new;
end;
$$;
