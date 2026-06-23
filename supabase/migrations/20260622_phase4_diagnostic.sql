-- Phase 4 Diagnostic System: diagnostic_questions, diagnostic_attempts, diagnostic_answers tables,
-- RLS policies, unlocked_through_level_number watermark column on profiles, the one-active-attempt
-- concurrency-guard index, and seed question pools for French 1 + French 2.
-- Migration: 20260622_phase4_diagnostic.sql

-- ============================================================
-- 1. public.diagnostic_questions  (content table — the question bank + answer key)
-- ============================================================

create table public.diagnostic_questions (
  id              uuid        not null primary key default gen_random_uuid(),
  level_id        uuid        not null references public.levels on delete cascade,
  type            text        not null
                    constraint diagnostic_question_type check (type in ('mc', 'fill_in')),
  question_text   text        not null,
  options         jsonb,                       -- MC choices; null for fill_in
  correct_answer  text        not null,        -- SERVER-ONLY (see security note below)
  lesson_tag      text,                        -- weak-area grouping (lesson slug)
  position        int         not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_dq_level_id on public.diagnostic_questions (level_id);

-- Security note (Pitfall 1 / T-04-ID-01): correct_answer is NOT protected by RLS column
-- masking — RLS cannot mask columns. It is protected by application-level column-projection
-- discipline: Plans 04-03/04-05 select only (id, level_id, type, question_text, options,
-- lesson_tag, position) into client-facing queries and never project correct_answer.
grant select on public.diagnostic_questions to authenticated;

alter table public.diagnostic_questions enable row level security;

create policy "Authenticated users can read all diagnostic questions"
  on public.diagnostic_questions
  for select
  to authenticated
  using (true);

-- ============================================================
-- 2. public.diagnostic_attempts  (per-student attempt records)
-- ============================================================

create table public.diagnostic_attempts (
  id                  uuid          not null primary key default gen_random_uuid(),
  user_id             uuid          not null references auth.users on delete cascade,
  level_id            uuid          not null references public.levels on delete cascade,
  diagnostic_type     text          not null
                        constraint diagnostic_attempt_type check (diagnostic_type in ('placement', 'end_of_level')),
  status              text          not null default 'in_progress'
                        constraint diagnostic_attempt_status check (status in ('in_progress', 'completed', 'failed')),
  drawn_question_ids  uuid[]        not null default '{}',
  score               numeric(4,3),
  correct_count       int,
  total_count         int,
  started_at          timestamptz   not null default now(),
  completed_at        timestamptz,
  cooldown_until      timestamptz,
  elapsed_seconds     int
);

create index idx_da_user_level_type on public.diagnostic_attempts (user_id, level_id, diagnostic_type);
create index idx_da_user_type_status on public.diagnostic_attempts (user_id, diagnostic_type, status);

-- Concurrency guard (Pitfall 3 / T-04-Tamp-01): at most one in_progress attempt per
-- (user, level, diagnostic_type). A second concurrent insert fails atomically.
create unique index idx_one_active_attempt
  on public.diagnostic_attempts (user_id, level_id, diagnostic_type)
  where status = 'in_progress';

-- Grants: authenticated read/insert/update own rows; service_role full access.
grant select, insert, update on public.diagnostic_attempts to authenticated;
grant all on public.diagnostic_attempts to service_role;

alter table public.diagnostic_attempts enable row level security;

-- (select auth.uid()) subquery form — stable evaluation; blocks cross-student read/write
-- (T-04-Tamp-02). Mirrors Phase 3 sub_component_progress policies.
create policy "Students can read own attempts"
  on public.diagnostic_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own attempts"
  on public.diagnostic_attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update own attempts"
  on public.diagnostic_attempts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 3. public.diagnostic_answers  (per-question answer records)
-- ============================================================

create table public.diagnostic_answers (
  id                uuid        not null primary key default gen_random_uuid(),
  attempt_id        uuid        not null references public.diagnostic_attempts on delete cascade,
  question_id       uuid        not null references public.diagnostic_questions on delete cascade,
  submitted_answer  text        not null,
  is_correct        boolean     not null,
  answered_at       timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index idx_diag_ans_attempt_id on public.diagnostic_answers (attempt_id);

grant select, insert on public.diagnostic_answers to authenticated;
grant all on public.diagnostic_answers to service_role;

alter table public.diagnostic_answers enable row level security;

-- Ownership flows through the parent attempt (T-04-Tamp-02): a student may read/insert an
-- answer row only when they own the attempt it belongs to.
create policy "Students can read own answers"
  on public.diagnostic_answers
  for select
  to authenticated
  using (
    exists (
      select 1 from public.diagnostic_attempts da
      where da.id = attempt_id
        and da.user_id = (select auth.uid())
    )
  );

create policy "Students can insert own answers"
  on public.diagnostic_answers
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.diagnostic_attempts da
      where da.id = attempt_id
        and da.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- 4. Watermark column on profiles (D-S02)
-- ============================================================

-- unlocked_through_level_number generalises Phase 3's current_level_id check into a numeric
-- watermark: a level is locked when its level_number > unlocked_through_level_number.
--
-- Security guard (T-04-EoP-01, carries Phase 3 T-03-01): do NOT add this column to the
-- column-scoped UPDATE grant for authenticated. The Phase 2 grant stays:
--   grant update (username, updated_at) on public.profiles to authenticated;
-- Only service_role (admin client) may write the watermark — a student cannot self-unlock.

alter table public.profiles
  add column unlocked_through_level_number int
    constraint utp_min check (unlocked_through_level_number >= 1);

-- Backfill existing profiles from their current placement so locking stays consistent.
update public.profiles p
set unlocked_through_level_number = l.level_number
from public.levels l
where l.id = p.current_level_id
  and p.unlocked_through_level_number is null;

-- ============================================================
-- 5. Seed — diagnostic question pools (D-D04, D-D05)
-- ============================================================

-- Pools must exceed the 10-question draw. ~14 questions per level, mixing 'mc' and 'fill_in',
-- each tagged with a lesson_tag for weak-area review. Apostrophes doubled per Phase 3 convention.

do $$
declare
  v_french1_id uuid;
  v_french2_id uuid;
begin
  select id into v_french1_id from public.levels where slug = 'french-1';
  select id into v_french2_id from public.levels where slug = 'french-2';

  -- ---- French 1 pool (tags: greetings, definite-articles) ----
  insert into public.diagnostic_questions (level_id, type, question_text, options, correct_answer, lesson_tag, position)
  values
    (v_french1_id, 'fill_in', 'How do you say "hello" (formal) in French?', null, 'bonjour', 'greetings', 1),
    (v_french1_id, 'mc', 'Which greeting is informal?', '["salut","bonjour","bonsoir","enchanté"]'::jsonb, 'salut', 'greetings', 2),
    (v_french1_id, 'fill_in', 'Translate "good evening".', null, 'bonsoir', 'greetings', 3),
    (v_french1_id, 'mc', 'What does "bonne nuit" mean?', '["good morning","good night","good evening","hello"]'::jsonb, 'good night', 'greetings', 4),
    (v_french1_id, 'fill_in', 'Say "goodbye" in French (two words).', null, 'au revoir', 'greetings', 5),
    (v_french1_id, 'mc', 'Which word is used when meeting someone for the first time?', '["enchanté","salut","ciao","allô"]'::jsonb, 'enchanté', 'greetings', 6),
    (v_french1_id, 'fill_in', 'How do you ask "how are you?" informally? (two words)', null, 'ça va', 'greetings', 7),
    (v_french1_id, 'mc', 'Definite article for "livre" (masculine)?', '["le","la","les","l''"]'::jsonb, 'le', 'definite-articles', 8),
    (v_french1_id, 'mc', 'Definite article for "table" (feminine)?', '["le","la","les","l''"]'::jsonb, 'la', 'definite-articles', 9),
    (v_french1_id, 'fill_in', 'The plural definite article is ___.', null, 'les', 'definite-articles', 10),
    (v_french1_id, 'mc', 'Which article goes before "école"?', '["le","la","l''","les"]'::jsonb, 'l''', 'definite-articles', 11),
    (v_french1_id, 'fill_in', 'Complete: ___ amis (the friends).', null, 'les', 'definite-articles', 12),
    (v_french1_id, 'mc', 'Which article is feminine singular?', '["le","la","les","un"]'::jsonb, 'la', 'definite-articles', 13),
    (v_french1_id, 'fill_in', 'What is the masculine singular definite article?', null, 'le', 'definite-articles', 14);

  -- ---- French 2 pool (tags: passe-compose, vocabulary) ----
  insert into public.diagnostic_questions (level_id, type, question_text, options, correct_answer, lesson_tag, position)
  values
    (v_french2_id, 'mc', 'Which auxiliary verb does "manger" use in the passé composé?', '["avoir","être","aller","faire"]'::jsonb, 'avoir', 'passe-compose', 1),
    (v_french2_id, 'fill_in', 'Past participle of "parler"?', null, 'parlé', 'passe-compose', 2),
    (v_french2_id, 'mc', 'Which verb uses "être" as its auxiliary?', '["aller","manger","parler","finir"]'::jsonb, 'aller', 'passe-compose', 3),
    (v_french2_id, 'fill_in', 'Past participle of "finir"?', null, 'fini', 'passe-compose', 4),
    (v_french2_id, 'mc', 'Complete "j''ai ___" (I ate) — participle of manger.', '["mangé","manger","mangeais","mange"]'::jsonb, 'mangé', 'passe-compose', 5),
    (v_french2_id, 'fill_in', 'Past participle of "être"?', null, 'été', 'passe-compose', 6),
    (v_french2_id, 'mc', 'Which auxiliary do reflexive verbs use in the passé composé?', '["être","avoir","aller","venir"]'::jsonb, 'être', 'passe-compose', 7),
    (v_french2_id, 'fill_in', 'Translate "the school".', null, 'l''école', 'vocabulary', 8),
    (v_french2_id, 'mc', 'What does "bibliothèque" mean?', '["library","bookstore","school","office"]'::jsonb, 'library', 'vocabulary', 9),
    (v_french2_id, 'fill_in', 'Translate "water".', null, 'eau', 'vocabulary', 10),
    (v_french2_id, 'mc', 'What does "la semaine" mean?', '["the week","the weekend","the month","the day"]'::jsonb, 'the week', 'vocabulary', 11),
    (v_french2_id, 'fill_in', 'Translate the verb "to eat".', null, 'manger', 'vocabulary', 12),
    (v_french2_id, 'mc', 'What does "demain" mean?', '["tomorrow","yesterday","today","tonight"]'::jsonb, 'tomorrow', 'vocabulary', 13),
    (v_french2_id, 'fill_in', 'Translate "the house".', null, 'maison', 'vocabulary', 14);

end;
$$;
