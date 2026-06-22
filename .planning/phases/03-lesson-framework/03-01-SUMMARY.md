---
phase: 03-lesson-framework
plan: "01"
subsystem: database
tags: [migration, rls, schema, seed, testing]
status: complete

dependency_graph:
  requires:
    - "supabase/migrations/20260620_phase2_auth.sql (profiles table, handle_new_user trigger base)"
  provides:
    - "levels, lessons, sub_components, sub_component_progress tables (migration file)"
    - "current_level_id column on profiles with elevation-of-privilege guard"
    - "updated handle_new_user trigger defaulting new users to French 1"
    - "French 1 seed: 2 lessons, 5 sub-components"
    - "rls-phase3 static test (LESSON-01, LESSON-02 verified)"
    - "Wave 0 scaffolds for Plans 02 and 03"
  affects:
    - "03-02 (level page reads levels/lessons tables)"
    - "03-03 (lesson action upserts to sub_component_progress)"

tech_stack:
  added: []
  patterns:
    - "Public-content RLS: USING(true) to authenticated (never anon)"
    - "Per-student RLS: (select auth.uid()) = user_id subquery form"
    - "Column grant guard: current_level_id withheld from authenticated UPDATE"
    - "CREATE OR REPLACE trigger function (reuse existing trigger, update function only)"
    - "Wave 0 test.todo stubs: import-safe scaffolds for future plan test bodies"

key_files:
  created:
    - supabase/migrations/20260622_phase3_lessons.sql
    - __tests__/rls-phase3.test.ts
    - __tests__/lessons/actions.test.ts
    - __tests__/lessons/level.test.ts
  modified: []

decisions:
  - "Use chr(10) concatenation for multi-line markdown seed strings to avoid escaped newline issues in plpgsql do-blocks"
  - "Wave 0 scaffolds do NOT top-level import non-existent modules — import-safe by design"
  - "rls-phase3.test.ts asserts both presence of correct policies AND absence of forbidden patterns (no anon, no current_level_id in update grant)"

metrics:
  duration_minutes: ~15
  completed_date: "2026-06-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 0
---

# Phase 3 Plan 01: Lesson Schema Foundation — Summary

**One-liner:** Phase 3 data schema — four-table lesson foundation with per-student RLS, French 1 seed, and elevation-of-privilege guard on current_level_id; all three tasks complete, schema verified live in Supabase.

---

## Status: COMPLETE

All three tasks done. Migration and tests committed (dafb838, 8b8b398, 92c03be). Task 3 schema push verified against the live Supabase DB: the migration was already applied in a prior run — all four tables exist, `current_level_id` is on profiles, `handle_new_user` references it, and the seed counts confirm 2 levels (French 1, French 2), 2 lessons, 5 sub-components.

---

## Tasks Completed

### Task 1: Migration file — commit `dafb838`

File: `supabase/migrations/20260622_phase3_lessons.sql` (287 lines)

- `public.levels`: id, slug (unique), name, level_number (unique), description, created_at. Indexed. SELECT grant to authenticated. RLS USING(true).
- `public.lessons`: id, level_id FK, slug, title, description, estimated_minutes (default 10), position (default 0), created_at. Composite unique (level_id, slug). Two indexes. SELECT grant. RLS USING(true).
- `public.sub_components`: id, lesson_id FK, title, kind (check in explainer/practice/writing), content (nullable text), position, created_at. Two indexes. SELECT grant. RLS USING(true).
- `public.sub_component_progress`: composite PK (user_id, sub_component_id). FK to auth.users (cascade) and sub_components (cascade). Two indexes. SELECT+INSERT+UPDATE grant to authenticated; ALL to service_role. RLS with three policies using `(select auth.uid()) = user_id`.
- `alter table public.profiles add column current_level_id uuid references public.levels on delete set null` — NOT added to authenticated update grant (T-03-01 guard).
- Seed: French 1 (slug french-1, level_number 1) with lesson 'greetings' (3 sub-components: explainer+practice+writing) and lesson 'definite-articles' (2 sub-components: explainer+practice). French 2 stub (no lessons). Existing user backfill: `update profiles set current_level_id = french1_id where current_level_id is null`.
- `create or replace function public.handle_new_user()` updated to insert `current_level_id = (select id from public.levels where level_number = 1)`.

Verification: `node -e "..."` printed `migration OK`.

### Task 2: Test files — commit `8b8b398`

Files created and verified green:

**`__tests__/rls-phase3.test.ts`** — 18/18 passing assertions:
- All four tables have RLS enabled
- Content tables: USING(true) to authenticated; no anon policy
- sub_component_progress: SELECT/INSERT/UPDATE all scope to `(select auth.uid()) = user_id`
- current_level_id NOT in authenticated update grant
- handle_new_user is CREATE OR REPLACE, references level_number = 1
- Seed slugs french-1 and french-2 present
- FK cascade constraints asserted

**`__tests__/lessons/actions.test.ts`** — Wave 0 scaffold for Plan 03 (LESSON-03):
- Full mock infrastructure: next/navigation redirect throwing NEXT_REDIRECT, next/cache revalidatePath, @/lib/supabase/server createClient with getUser + from/select/eq/single + upsert
- 5 test.todo stubs: upserts progress row, redirects when unauthenticated, throws on invalid UUID, calls revalidatePath, never accepts user_id from caller
- Import-safe: markSubComponentComplete NOT imported at top level

**`__tests__/lessons/level.test.ts`** — Wave 0 scaffold for Plan 02 (LESSON-04):
- 3 test.todo stubs: isLevelLocked true/false cases and null current_level_id guard
- Import-safe: no module imports at top level

Full suite result: 11 suites, 69 passing, 8 todo, 3 skipped, 0 failures.

---

## Task 3: COMPLETE — Schema Verified Live in Supabase

**Status:** Verified live (2026-06-22). The migration was already applied to the linked Supabase project in a prior run. Diagnostic against the live DB confirmed: all four tables (`levels`, `lessons`, `sub_components`, `sub_component_progress`) exist; `profiles.current_level_id` present; `handle_new_user` source includes `current_level_id`; seed counts = 2 levels (French 1, French 2), 2 lessons, 5 sub-components.

Note: the Supabase CLI was not installed locally and no access token was set, so the push could not be run from this machine — the live state was confirmed via the Supabase Studio SQL Editor instead. The repo migration carries a later apostrophe-escaping fix (commit 92c03be) not present in the already-seeded live row; this is cosmetic sample-data only and can be patched with a one-line UPDATE if desired.

<details><summary>Apply path (if re-pushing to a fresh DB)</summary>

**What to do:**

**Option A — Supabase CLI (if available):**
```bash
# Ensure env vars are set
export SUPABASE_ACCESS_TOKEN=<your-token>
export SUPABASE_DB_PASSWORD=<your-db-password>   # if prompted

# From repo root (project already linked in Phase 2)
supabase db push
```

**Option B — Supabase Studio SQL Editor (fallback):**
1. Open Supabase Dashboard → your project → SQL Editor
2. Paste the full contents of `supabase/migrations/20260622_phase3_lessons.sql`
3. Click Run

**Verification queries to run after push:**
```sql
-- Must return 2 (french-1, french-2)
select count(*) from public.levels;

-- Must return 2 (greetings, definite-articles)
select count(*) from public.lessons;

-- Must return 5 (3 for greetings + 2 for definite-articles)
select count(*) from public.sub_components;

-- Must return: French 1, French 2 (in order)
select name from public.levels order by level_number;

-- Must include 'current_level_id' in the function source
select prosrc from pg_proc where proname = 'handle_new_user';
```

**Resume signal:** Type "approved" once all counts match.

</details>

---

## Deviations from Plan

**None** — plan executed exactly as written for Tasks 1 and 2. Task 3 stopped at the expected blocking checkpoint (Supabase CLI not installed, no auth token — documented in the orchestrator dispatch as an expected gate).

---

## Known Stubs

None in migration or test files. The Wave 0 test.todo entries in actions.test.ts and level.test.ts are intentional scaffolds (not stubs blocking plan goals) — they will be filled by Plans 02 and 03 respectively.

---

## Threat Flags

No new security surface introduced beyond what is planned. All four threat mitigations from the plan's STRIDE register are implemented in the migration:
- T-03-01 (Elevation of Privilege): current_level_id not in authenticated update grant — asserted by rls-phase3 test
- T-03-02 (Tampering): INSERT/UPDATE with check (select auth.uid()) = user_id
- T-03-03 (Information Disclosure): content tables use `to authenticated` only; no anon — asserted by rls-phase3 test
- T-03-04 (Tampering/orphans): FK on delete cascade on both sub_component_progress FKs
- T-03-05 (Information Disclosure): SELECT policy scopes to user_id owner

---

## Self-Check

**Files created:**
- [x] `supabase/migrations/20260622_phase3_lessons.sql` — FOUND
- [x] `__tests__/rls-phase3.test.ts` — FOUND
- [x] `__tests__/lessons/actions.test.ts` — FOUND
- [x] `__tests__/lessons/level.test.ts` — FOUND

**Commits:**
- [x] `dafb838` — Task 1 migration — FOUND
- [x] `8b8b398` — Task 2 test files — FOUND
- [x] `92c03be` — seed apostrophe fix — FOUND

**Live DB:** 2 levels, 2 lessons, 5 sub-components; current_level_id + trigger update verified.
**Tests:** 11 suites, 69 passed, 8 todo, 3 skipped, 0 failed.

## Self-Check: PASS

All three tasks complete and committed. Schema verified live in Supabase (2/2/5 seed, current_level_id, trigger). Test suite green.
