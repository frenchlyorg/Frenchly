# Phase 3: Lesson Framework - Research

**Researched:** 2026-06-21
**Domain:** Supabase schema design, Next.js App Router Server Actions, RLS policies, real-time UI updates
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-L01:** One `sub_components` table, typed via a `kind` field (e.g. reading/explainer, practice, writing) plus a flexible content column (markdown/JSONB). Problem-type specifics (MC, fill-in, etc.) are NOT modeled here — Phase 5 fills them in.
- **D-L02:** Sub-component completion is binary (done / not-done) — no score in this phase.
- **D-L03:** Progress is written to the DB the instant a sub-component is finished. UI updates without a page reload.
- **D-L04:** French 1 is fully open — every lesson within French 1 is unlocked and freely jumpable in any order (no sequential gating inside the level).
- **D-L05:** New users default to French 1. French 2+ levels are shown in a locked state.
- **D-L06:** Phase 3 ships a single placement default (French 1). Phase 4 later flips a field to unlock higher levels. Keep the locked/unlocked UI real so Phase 4 only has to change data, not UI.
- **D-L07:** Time estimate is a manual `estimated_minutes` field authored per lesson — not computed from sub-component count.

### Claude's Discretion

- Exact schema column names/types, table relationships, and migration structure.
- Level-page and lesson-view layout (within DESIGN.md tokens).
- How much sample French 1 data to seed (minimal — enough to prove open → complete → restore works).
- Client/server data-fetching approach and the real-time UI update mechanism.

### Deferred Ideas (OUT OF SCOPE)

- Per-sub-component scoring (0–100) — revisit in Phase 4 if needed.
- Sequential lesson gating within a level — explicitly rejected for v1.
- Culture + Above & Beyond levels — out of v1 content scope.
- Actual problem types (MC, fill-in, conjugation, matching, open writing) — Phase 5.
- Real French 1/French 2 grammar content — Phases 7–8.
- Placement diagnostic + end-of-level diagnostic — Phase 4.
- AI writing checker — Phase 6.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LESSON-01 | Lessons are organized into levels (French 1, French 2 for v1) | `levels` table + `level_number` foreign key on `lessons`; placement field on `profiles` |
| LESSON-02 | Each lesson contains multiple trackable sub-components (granular progress) | `sub_components` table with `lesson_id` FK + `kind` field; `sub_component_progress` per-student binary completion |
| LESSON-03 | Student progress per sub-component is saved to the database in real time | Server Action + `useOptimistic` pattern; `revalidatePath` syncs server state; no page reload |
| LESSON-04 | Level pages display: time estimate per lesson, locked/unlocked state, sub-component list | `estimated_minutes` on `lessons`; locked state derived from `profiles.current_level_id` vs `lesson.level_id` join |
</phase_requirements>

---

## Summary

Phase 3 adds the content schema (levels, lessons, sub-components) and per-student progress tracking on top of the auth foundation built in Phase 2. The schema work is pure Postgres — a new migration file alongside the existing `20260620_phase2_auth.sql` — following the exact same RLS conventions already established. Content tables (`levels`, `lessons`, `sub_components`) are public-read for authenticated users with `USING (true)`. The progress table (`sub_component_progress`) mirrors the Phase 2 RLS ownership pattern: `USING ((select auth.uid()) = user_id)`.

The real-time save (LESSON-03 / success criterion 3) is the most technically interesting piece. The recommended approach is a **Server Action + `useOptimistic` pattern**: when a student completes a sub-component, the client calls a `'use server'` action via `startTransition`, the optimistic state flips immediately in the UI, and `revalidatePath` inside the action ensures the Server Component re-fetches the ground-truth progress on the next render. No Supabase Realtime subscription is needed — this is a single-user view of their own progress, and the optimistic pattern gives instant feedback without the complexity of a WebSocket subscription.

The locked/unlocked state (LESSON-04 / D-L05, D-L06) is derived at render time by comparing the lesson's `level_id` against a `current_level_id` field stored on `profiles`. Phase 3 adds this field defaulting to the French 1 level ID. French 1 lessons are always unlocked (their level matches the default). French 2+ levels are locked until Phase 4 updates the field. The UI logic is: `isLocked = lesson.level_id !== profile.current_level_id` (for now — Phase 4 will generalize to `level_number <= unlocked_through`).

**Primary recommendation:** New Supabase migration with 4 tables + seed data; Server Action + `useOptimistic` for progress saves; Server Components for all data fetching; placement field on `profiles`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lesson/sub-component schema | Database | — | Pure Postgres — tables, constraints, seed data |
| RLS policies (content read) | Database | — | `USING (true)` on content tables, enforced at Postgres layer |
| RLS policies (progress write) | Database | — | `auth.uid()` scoping on `sub_component_progress` |
| Level page data (lessons + lock state) | Frontend Server (SSR) | — | Async Server Component fetches via server Supabase client |
| Lesson view data (sub-components + progress) | Frontend Server (SSR) | — | Server Component initial render; progress passed as props |
| Mark sub-component complete | API / Backend | Browser | Server Action (`'use server'`); client calls via `startTransition` |
| Optimistic UI update | Browser / Client | — | `useOptimistic` hook in Client Component wrapping sub-component list |
| Locked/unlocked derivation | Frontend Server (SSR) | — | Computed in Server Component from `profiles.current_level_id` join |
| Placement default (French 1) | Database | — | `current_level_id` column on `profiles` with FK default |

---

## Standard Stack

### Core — all already installed; zero new packages required

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `@supabase/ssr` | 0.12.0 | Server/browser Supabase clients | Established in Phase 2; three-tier factory pattern |
| `@supabase/supabase-js` | 2.108.2 | Supabase JS client (types, query builder) | Project standard |
| `next` | 16.2.9 | App Router Server Actions + Server Components | Project standard; React 19 `useOptimistic` stable |
| `zod` | 4.4.3 | Server-side input validation in Server Actions | Already used in project; validate `sub_component_id` UUIDs |
| `react` | (bundled with next) | `useOptimistic`, `useTransition` hooks | React 19 — stable hooks for optimistic UI |

[VERIFIED: npm registry] — confirmed via `npm view` during this session.

**No new package installations required for Phase 3.** All needed libraries are already in `package.json`.

---

## Package Legitimacy Audit

No new external packages are introduced in Phase 3. All dependencies (`@supabase/ssr`, `@supabase/supabase-js`, `next`, `react`, `zod`) were installed in Phases 1–2 and are already audited. This section is N/A.

---

## Architecture Patterns

### System Architecture Diagram

```
Student browser
     │
     │ 1. GET /levels/french-1
     ▼
Next.js Server Component (level page)
     │ createClient() [server factory]
     ├──► Supabase: SELECT levels + lessons + estimated_minutes
     │                WHERE level_number = 1
     ├──► Supabase: SELECT profiles.current_level_id WHERE id = auth.uid()
     │    (derives locked/unlocked per lesson)
     ▼
HTML rendered → browser
     │
     │ 2. GET /levels/french-1/lessons/[id]
     ▼
Next.js Server Component (lesson page)
     │ createClient() [server factory]
     ├──► Supabase: SELECT sub_components WHERE lesson_id = X (ORDER BY position)
     ├──► Supabase: SELECT sub_component_progress WHERE user_id = auth.uid()
     │              AND sub_component_id IN (...)
     ▼
Server renders lesson shell + passes {subComponents, completedIds} to Client Component
     │
     ▼
<SubComponentList> [Client Component — 'use client']
     │  useOptimistic(completedIds, ...)
     │
     │ 3. Student clicks "Mark complete"
     ▼
startTransition(async () => {
  setOptimisticCompleted(id)          ← instant UI flip
  await markSubComponentComplete(id)  ← Server Action
})
     │
     ▼
Server Action ('use server')
     ├──► getUser() — resolve auth.uid() server-side
     ├──► validate sub_component_id with zod
     ├──► Supabase upsert into sub_component_progress
     │    (user_id, sub_component_id, completed_at)
     └──► revalidatePath('/levels/french-1/lessons/[id]')
          ← Server Component re-fetches; optimistic state reconciled
```

### Recommended Project Structure

```
src/
├── app/
│   ├── levels/
│   │   └── [levelSlug]/
│   │       ├── page.tsx              # Level page — Server Component
│   │       └── lessons/
│   │           └── [lessonId]/
│   │               └── page.tsx      # Lesson page — Server Component
│   └── auth/
│       └── actions.ts                # Existing — lesson actions go in new file
├── app/lessons/
│   └── actions.ts                    # NEW: markSubComponentComplete Server Action
├── components/
│   ├── lessons/
│   │   ├── LevelCard.tsx             # Lesson card with lock state + time estimate
│   │   ├── SubComponentList.tsx      # 'use client' — useOptimistic wrapper
│   │   └── SubComponentItem.tsx      # Individual item with completion toggle
│   └── ui/
│       └── LockBadge.tsx             # Locked level indicator
supabase/
└── migrations/
    └── 20260622_phase3_lessons.sql   # NEW: levels + lessons + sub_components + progress
```

### Pattern 1: Content Tables — Public Read (Authenticated)

Content tables (levels, lessons, sub_components) hold curriculum authored by admins. Any logged-in student should be able to read all rows. No user-scoping needed.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Pattern: authenticated users read all content rows

alter table public.levels enable row level security;

create policy "Authenticated users can read all levels"
  on public.levels
  for select
  to authenticated
  using (true);

-- Same pattern for lessons and sub_components tables
```

[CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Pattern 2: Progress Table — Per-Student RLS (mirrors Phase 2)

The `sub_component_progress` table stores per-student rows. Must use the same `(select auth.uid())` pattern established in Phase 2 for performance (stable subquery avoids per-row function call).

```sql
-- Source: supabase/migrations/20260620_phase2_auth.sql (Phase 2 established pattern)
-- Mirrors: "Users can view own profile" policy

alter table public.sub_component_progress enable row level security;

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
```

[VERIFIED: codebase — mirrors 20260620_phase2_auth.sql policy structure]

### Pattern 3: useOptimistic + Server Action for Instant Progress Save

This is the React 19 + Next.js 16 standard for binary toggle state. The `useOptimistic` hook lives in a `'use client'` component. The Server Action lives in a separate `'use server'` file.

```typescript
// Source: https://dev.to/mahdi_benrhouma_fe1c6005/optimistic-ui-patterns-with-nextjs-server-actions-and-supabase-realtime-7e0
// Source: https://www.thanosk.eu/deep-dives/react-19-server-actions-nextjs-16

// components/lessons/SubComponentList.tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { markSubComponentComplete } from '@/app/lessons/actions'

interface SubComponent {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  position: number
}

interface Props {
  subComponents: SubComponent[]
  initialCompletedIds: Set<string>
}

export function SubComponentList({ subComponents, initialCompletedIds }: Props) {
  const [, startTransition] = useTransition()
  const [completedIds, setOptimisticCompleted] = useOptimistic(
    initialCompletedIds,
    (current: Set<string>, id: string) => new Set([...current, id])
  )

  function handleComplete(id: string) {
    if (completedIds.has(id)) return // already done
    startTransition(async () => {
      setOptimisticCompleted(id)              // instant UI flip
      await markSubComponentComplete(id)      // Server Action persists to DB
    })
  }

  return (
    <ul>
      {subComponents.map((sc) => (
        <li key={sc.id}>
          <button
            onClick={() => handleComplete(sc.id)}
            disabled={completedIds.has(sc.id)}
            aria-pressed={completedIds.has(sc.id)}
          >
            {completedIds.has(sc.id) ? 'Done' : 'Mark complete'}
          </button>
          <span>{sc.title}</span>
        </li>
      ))}
    </ul>
  )
}
```

```typescript
// app/lessons/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const SubComponentIdSchema = z.string().uuid()

export async function markSubComponentComplete(subComponentId: string): Promise<void> {
  // 1. Validate input (never trust client-supplied IDs)
  const parsed = SubComponentIdSchema.safeParse(subComponentId)
  if (!parsed.success) throw new Error('Invalid sub-component ID')

  // 2. Resolve user server-side (never accept user_id from client)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 3. Verify sub_component_id exists (prevent progress rows for phantom IDs)
  const { data: sc } = await supabase
    .from('sub_components')
    .select('id, lesson_id')
    .eq('id', parsed.data)
    .single()
  if (!sc) throw new Error('Sub-component not found')

  // 4. Upsert progress row (idempotent — safe to call twice)
  const { error } = await supabase
    .from('sub_component_progress')
    .upsert(
      { user_id: user.id, sub_component_id: parsed.data, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,sub_component_id' }
    )
  if (error) throw new Error('Failed to save progress')

  // 5. Invalidate the lesson page so Server Component re-fetches ground-truth progress
  revalidatePath(`/levels/${sc.lesson_id}`) // planner: derive correct path from lesson slug
}
```

[CITED: https://dev.to/mahdi_benrhouma_fe1c6005/optimistic-ui-patterns-with-nextjs-server-actions-and-supabase-realtime-7e0]
[CITED: https://www.thanosk.eu/deep-dives/react-19-server-actions-nextjs-16]

### Pattern 4: Server Component Level Page — Locked/Unlocked Derivation

```typescript
// app/levels/[levelSlug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LevelPage({ params }: { params: { levelSlug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/levels/' + params.levelSlug)

  // Fetch level + its lessons in one query
  const { data: level } = await supabase
    .from('levels')
    .select(`
      id, name, level_number,
      lessons (
        id, title, estimated_minutes, position,
        sub_components (id, title, kind, position)
      )
    `)
    .eq('slug', params.levelSlug)
    .single()

  // Fetch student's unlocked level
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level_id')
    .eq('id', user.id)
    .single()

  // Locked = this level's id does not match student's current_level_id
  // Phase 4 will extend this to: level.level_number <= unlocked_through_number
  const isLevelLocked = level?.id !== profile?.current_level_id

  return <LevelPageClient level={level} isLevelLocked={isLevelLocked} />
}
```

[ASSUMED] — exact query shape depends on final column names chosen in migration.

### Anti-Patterns to Avoid

- **Calling `auth.uid()` directly (not via subquery) in RLS policies:** Per Phase 2 precedent and Supabase docs, always use `(select auth.uid())`. Direct `auth.uid()` calls are re-evaluated per row; the subquery form is stable and ~4× faster on large tables. [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]
- **Calling `router.refresh()` alone for instant feedback:** `router.refresh()` triggers a full server round-trip before the UI updates — the student sees a flash/delay. Use `useOptimistic` for the instant flip, with `revalidatePath` in the Server Action to sync afterward. [CITED: https://dev.to/mahdi_benrhouma_fe1c6005/optimistic-ui-patterns-with-nextjs-server-actions-and-supabase-realtime-7e0]
- **Calling `setOptimisticCompleted()` outside `startTransition`:** `useOptimistic` only works inside a React transition. Calling the setter outside `startTransition` silently fails in production. [CITED: https://dev.to/mahdi_benrhouma_fe1c6005/]
- **Forgetting `revalidatePath` in the Server Action:** Without it, the Server Component data stays stale after the action. The optimistic state reverts to stale server state, making it look like the action failed.
- **Accepting `user_id` from the client in progress writes:** Always call `getUser()` server-side and derive `user_id` there. A client-supplied ID bypasses RLS intent. Mirror the `deleteAccount` pattern in `src/app/auth/actions.ts` line 228.
- **Using Supabase Realtime for single-student progress:** Realtime subscriptions add WebSocket connection overhead and complexity. Single-student progress views have no multi-client sync requirement — `useOptimistic` + `revalidatePath` is simpler and sufficient.
- **Adding a SELECT policy that allows `anon` on content tables:** Lesson content should be available to authenticated users only, not anonymous visitors. Use `to authenticated` not `to authenticated, anon`.

---

## Schema Design

### Concrete Schema — Full Table Definitions

```sql
-- supabase/migrations/20260622_phase3_lessons.sql

-- ============================================================
-- 1. public.levels
-- ============================================================

create table public.levels (
  id             uuid        not null primary key default gen_random_uuid(),
  slug           text        not null unique,               -- e.g. 'french-1'
  name           text        not null,                      -- e.g. 'French 1'
  level_number   int         not null unique,               -- 1, 2, 3 …
  description    text,
  created_at     timestamptz not null default now()
);

grant select on public.levels to authenticated;
alter table public.levels enable row level security;

create policy "Authenticated users can read all levels"
  on public.levels for select
  to authenticated
  using (true);

-- ============================================================
-- 2. public.lessons
-- ============================================================

create table public.lessons (
  id                  uuid        not null primary key default gen_random_uuid(),
  level_id            uuid        not null references public.levels on delete cascade,
  slug                text        not null,                 -- unique per level
  title               text        not null,
  description         text,
  estimated_minutes   int         not null default 10,      -- D-L07: manual field
  position            int         not null default 0,       -- display order
  created_at          timestamptz not null default now(),
  unique (level_id, slug)
);

create index idx_lessons_level_id on public.lessons (level_id);
create index idx_lessons_position  on public.lessons (level_id, position);

grant select on public.lessons to authenticated;
alter table public.lessons enable row level security;

create policy "Authenticated users can read all lessons"
  on public.lessons for select
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
  content     text,       -- markdown body for explainer; Phase 5 fills practice details
  position    int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Note on content column: TEXT (markdown) for Phase 3 MVP.
-- Phase 5 can add a separate `problem_config jsonb` column for structured
-- MC/fill-in payloads without a breaking schema change.

create index idx_sub_components_lesson_id on public.sub_components (lesson_id);
create index idx_sub_components_position  on public.sub_components (lesson_id, position);

grant select on public.sub_components to authenticated;
alter table public.sub_components enable row level security;

create policy "Authenticated users can read all sub-components"
  on public.sub_components for select
  to authenticated
  using (true);

-- ============================================================
-- 4. public.sub_component_progress  (per-student binary completion)
-- ============================================================

create table public.sub_component_progress (
  user_id            uuid        not null references auth.users on delete cascade,
  sub_component_id   uuid        not null references public.sub_components on delete cascade,
  completed_at       timestamptz not null default now(),
  primary key (user_id, sub_component_id)    -- composite PK; also serves as upsert target
);

create index idx_scp_user_id            on public.sub_component_progress (user_id);
create index idx_scp_sub_component_id   on public.sub_component_progress (sub_component_id);

grant select, insert, update on public.sub_component_progress to authenticated;
grant all on public.sub_component_progress to service_role;

alter table public.sub_component_progress enable row level security;

create policy "Students can read own progress"
  on public.sub_component_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own progress"
  on public.sub_component_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update own progress"
  on public.sub_component_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 5. Placement field on profiles (D-L05, D-L06)
-- ============================================================

-- Add current_level_id to profiles; defaults to French 1 via trigger/seed.
-- Phase 4 updates this field when a student passes the level diagnostic.

alter table public.profiles
  add column current_level_id uuid references public.levels on delete set null;

-- ============================================================
-- 6. Seed — minimal French 1 sample data (success criterion 1)
-- ============================================================

do $$
declare
  v_level_id   uuid;
  v_lesson_id  uuid;
begin
  -- Level: French 1
  insert into public.levels (id, slug, name, level_number, description)
  values (
    gen_random_uuid(), 'french-1', 'French 1', 1,
    'The foundation — greetings, articles, basic sentence structure.'
  )
  returning id into v_level_id;

  -- Lesson 1
  insert into public.lessons (id, level_id, slug, title, estimated_minutes, position)
  values (
    gen_random_uuid(), v_level_id, 'greetings',
    'Greetings and introductions', 10, 1
  )
  returning id into v_lesson_id;

  insert into public.sub_components (lesson_id, title, kind, content, position)
  values
    (v_lesson_id, 'How French greetings work', 'explainer',
     '## Bonjour vs Salut\n\nFormal and informal greetings in French...', 1),
    (v_lesson_id, 'Practice: match the greeting', 'practice', null, 2),
    (v_lesson_id, 'Write your own introduction', 'writing', null, 3);

  -- Lesson 2
  insert into public.lessons (id, level_id, slug, title, estimated_minutes, position)
  values (
    gen_random_uuid(), v_level_id, 'definite-articles',
    'Definite articles: le, la, les', 12, 2
  )
  returning id into v_lesson_id;

  insert into public.sub_components (lesson_id, title, kind, content, position)
  values
    (v_lesson_id, 'What are definite articles?', 'explainer',
     '## Le, la, l'', les\n\nFrench nouns have gender...', 1),
    (v_lesson_id, 'Practice: choose the right article', 'practice', null, 2);

  -- Level 2 stub (locked for all new users)
  insert into public.levels (slug, name, level_number, description)
  values ('french-2', 'French 2', 2, 'Expanding vocabulary and grammar.');

  -- Default new users to French 1
  -- This runs AFTER the seed, so levels row exists
  update public.profiles
  set current_level_id = v_level_id
  where current_level_id is null;
end;
$$;
```

**Note on `current_level_id` default for new users:** The `handle_new_user` trigger created in Phase 2 fires on `auth.users` insert. In Phase 3, we either (a) update the trigger to also set `current_level_id` by querying the `levels` table for `level_number = 1`, or (b) set it via the seed's bulk UPDATE and add a small trigger update. Option (a) is cleaner for future new signups. The planner should include a trigger update task.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic UI toggle | Custom event bus, Supabase Realtime subscription, or manual state reconciliation | `useOptimistic` + `startTransition` (React 19 built-in) | Handles rollback automatically; no WebSocket overhead; no race conditions |
| Upsert idempotency | Custom "check then insert" logic | Postgres `upsert` with `ON CONFLICT` on composite PK | Single round-trip; eliminates TOCTOU race where double-tap inserts duplicate rows |
| RLS `auth.uid()` scoping | Custom middleware or server-side filter | Postgres RLS policy with `(select auth.uid()) = user_id` | Enforced at DB layer; cannot be bypassed by client code |
| UUID primary keys | Custom ID generation (nanoid, sequential) | `gen_random_uuid()` (Postgres built-in) | Already used in Phase 2 profiles; consistent across all tables |
| Schema validation in Server Action | Manual string checks | `zod` (already installed) | Type-safe, composable; consistent with Phase 2 server action pattern |

**Key insight:** The upsert pattern (`ON CONFLICT DO UPDATE`) is critical for the "mark complete" action. A student clicking the button twice would create a duplicate row without it — the composite primary key on `(user_id, sub_component_id)` plus upsert makes the action naturally idempotent.

---

## Common Pitfalls

### Pitfall 1: `useOptimistic` setter called outside `startTransition`
**What goes wrong:** `setOptimisticCompleted(id)` is called directly in an onClick handler without wrapping in `startTransition`. The optimistic update silently fails in production; the UI does not update.
**Why it happens:** React 19 `useOptimistic` requires a concurrent transition context to work. Outside a transition, the update is a no-op.
**How to avoid:** Always wrap in `startTransition(async () => { setOptimisticCompleted(...); await serverAction(...); })`.
**Warning signs:** UI doesn't flip on click; no error thrown (silent failure in production).

### Pitfall 2: Missing `revalidatePath` in the Server Action
**What goes wrong:** The optimistic state shows "done" but after the transition completes, the state reverts to the stale server-rendered value (not done). Looks like the save failed.
**Why it happens:** Without `revalidatePath`, the Server Component's data cache is not invalidated. The real state never catches up to the optimistic state.
**How to avoid:** Always call `revalidatePath('/levels/[levelSlug]/lessons/[lessonId]')` at the end of the Server Action — after the upsert succeeds.
**Warning signs:** Sub-component shows as completed during the transition, then reverts to incomplete after the action finishes.

### Pitfall 3: `current_level_id` is NULL for existing users after migration
**What goes wrong:** The `alter table profiles add column current_level_id` migration adds a nullable column with no default. Existing users have `NULL`. The level page crashes or shows all levels as locked.
**Why it happens:** The seed's `UPDATE profiles SET current_level_id = ... WHERE current_level_id IS NULL` only runs once at migration time. Users created between migration run and seed completion (race in dev) stay NULL. New users after Phase 3 also stay NULL until trigger is updated.
**How to avoid:** Update the `handle_new_user` trigger in Phase 2 to also set `current_level_id` to the French 1 level ID. Add a NULL guard on the level page: treat NULL as French 1.
**Warning signs:** All levels show as locked for a newly created test user.

### Pitfall 4: Progress rows referencing deleted sub-components
**What goes wrong:** Admin deletes a sub-component from the DB. `sub_component_progress` rows referencing it are orphaned; joins return nulls; the lesson page breaks.
**Why it happens:** FK without cascade.
**How to avoid:** Define `references public.sub_components on delete cascade` on `sub_component_progress.sub_component_id`. Schema above already includes this.

### Pitfall 5: Nested Supabase select flattening
**What goes wrong:** The level page query uses a nested select like `lessons(sub_components(...))`. Supabase returns data structured as `level.lessons[].sub_components[]`. Accessing it as a flat array throws a TypeScript error.
**Why it happens:** Supabase JS nested selects return typed nested objects, not SQL-flat rows. The type depends on exact column aliases used.
**How to avoid:** Use explicit TypeScript types generated from the schema (or manual interface) for the nested query result. Test the query shape in Supabase Studio before wiring to the component.

### Pitfall 6: Testing RLS from the SQL Editor (bypasses RLS)
**What goes wrong:** Developer runs SELECT from sub_component_progress in Supabase Studio SQL Editor and sees all rows — concludes RLS is broken.
**Why it happens:** SQL Editor runs as `postgres` superuser, which bypasses RLS by default.
**How to avoid:** Test RLS from the client SDK (as established in `__tests__/rls.test.ts` in Phase 2). The static test pattern — parsing the migration SQL to assert policy presence — is the established project pattern and runs in CI without a live DB.

---

## Code Examples

### Supabase content table read (Server Component)

```typescript
// Source: established project pattern — src/app/dashboard/page.tsx
const supabase = await createClient()

const { data: level } = await supabase
  .from('levels')
  .select(`
    id, slug, name, level_number,
    lessons (
      id, slug, title, estimated_minutes, position,
      sub_components (id, title, kind, position)
    )
  `)
  .eq('slug', levelSlug)
  .order('position', { referencedTable: 'lessons' })
  .single()
```

### Progress fetch for a lesson (Server Component)

```typescript
const { data: progressRows } = await supabase
  .from('sub_component_progress')
  .select('sub_component_id')
  .eq('user_id', user.id)
  .in('sub_component_id', subComponentIds)

const completedIds = new Set(progressRows?.map(r => r.sub_component_id) ?? [])
```

### RLS static test pattern (mirrors existing `__tests__/rls.test.ts`)

```typescript
// __tests__/rls-phase3.test.ts
import * as fs from 'fs'
import * as path from 'path'

const MIGRATION = path.resolve(__dirname, '../supabase/migrations/20260622_phase3_lessons.sql')

describe('Phase 3 RLS static analysis', () => {
  let sql: string
  beforeAll(() => { sql = fs.readFileSync(MIGRATION, 'utf-8') })

  test('sub_component_progress has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.sub_component_progress enable row level security/)
  })

  test('progress SELECT policy scopes to auth.uid()', () => {
    expect(sql).toMatch(/for select[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = user_id\)/i)
  })

  test('content tables have RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.levels enable row level security/)
    expect(sql).toMatch(/alter table public\.lessons enable row level security/)
    expect(sql).toMatch(/alter table public\.sub_components enable row level security/)
  })

  test('content table policies use USING (true) for authenticated reads', () => {
    expect(sql).toMatch(/for select\s+to authenticated\s+using\s*\(true\)/i)
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `router.refresh()` for post-mutation sync | `revalidatePath()` in Server Action + `useOptimistic` client-side | Next.js 14+ / React 19 | Instant UI, no visible reload flicker |
| `useOptimistic` (experimental) | `useOptimistic` stable in React 19 | React 19 GA (2024) | Safe for production use in Next.js 16 |
| `auth.uid()` directly in RLS | `(select auth.uid())` subquery form | Supabase recommended pattern | Per-row vs stable evaluation; significant perf difference on large tables |
| Separate `json` column | `jsonb` for structured flexible content | Postgres 9.4+ | Binary storage, indexable; always prefer `jsonb` over `json` |
| `getSession()` for auth checks | `getUser()` (verified against auth server) | Supabase SSR guidance | `getSession()` trusts JWT claims; `getUser()` verifies server-side |

**Deprecated/outdated:**
- `router.refresh()` as the primary post-mutation update: still works, but causes visible reload. Use `revalidatePath` + `useOptimistic` instead.
- Direct `auth.uid()` in RLS USING clauses: functional but slower. Project already uses `(select auth.uid())` in Phase 2 — maintain this consistently.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Level page route will be `/levels/[levelSlug]` and lesson route `/levels/[levelSlug]/lessons/[lessonId]` | Architecture Patterns | Planner picks the actual routes; `revalidatePath` call in Server Action must match exactly |
| A2 | `kind` constraint values will be `('explainer', 'practice', 'writing')` | Schema Design | Phase 5 may need to add additional kinds; constraint can be expanded in a later migration |
| A3 | The `content` text column holds markdown for explainer sub-components; practice/writing sub-components leave it null in Phase 3 | Schema Design | If Phase 5 needs structured JSON for practice config, a separate `problem_config jsonb` column should be added rather than overloading `content` |
| A4 | `revalidatePath` path argument in the Server Action requires the full lesson URL path | Code Examples | If the route structure differs, the path must be updated or the cache won't invalidate correctly |
| A5 | The `handle_new_user` trigger from Phase 2 will be updated in this phase to also set `current_level_id` | Schema Design | If not updated, new users created after the migration will have NULL `current_level_id` and see all levels locked |

---

## Open Questions

1. **`handle_new_user` trigger update strategy**
   - What we know: The trigger is defined in `20260620_phase2_auth.sql`. It cannot be edited in-place (migration is applied). A new migration must use `CREATE OR REPLACE FUNCTION`.
   - What's unclear: The trigger function must query `levels` to get the French 1 ID by `level_number = 1`. This creates a dependency: the trigger fires on user creation, so the `levels` row must already exist in the DB. This is fine for prod (seed runs once), but test environments must seed levels before creating test users.
   - Recommendation: The planner should include an updated `handle_new_user` function in the Phase 3 migration that also sets `current_level_id`. Add a note to the test setup to seed `levels` before creating test users.

2. **Level page route structure**
   - What we know: Existing routes are `/dashboard`, `/admin`, `/account`. No `/levels` route exists yet.
   - What's unclear: Should level pages live at `/levels/french-1` or `/dashboard/levels/french-1` (nested under dashboard)?
   - Recommendation: [ASSUMED] `/levels/[levelSlug]` as a top-level route — cleaner URLs, matches `PAGE-03`/`PAGE-04` requirement language ("French 1 level page"). The proxy already protects all non-static routes via the `matcher` config.

3. **Progress fetch strategy: one query or N queries?**
   - What we know: A lesson page shows ~3–5 sub-components. Progress is fetched as a set of completed IDs.
   - What's unclear: Whether to fetch progress in the same Server Component render as sub-components (one page, two queries) or combine into a single join.
   - Recommendation: Two separate queries in the Server Component — one for sub-components (content), one for progress (user data). This keeps content and user-data fetching logically separate and makes the RLS boundary explicit.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | ✓ | (project running) | — |
| Supabase CLI (`supabase db push`) | Apply migration | [ASSUMED] | — | Apply migration manually via Supabase Studio SQL Editor |
| Supabase project (local or cloud) | Schema push + seed | ✓ | Phase 2 verified working | — |
| `npm test` (Jest) | RLS static tests | ✓ | Jest + ts-jest configured | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:**
- Supabase CLI: if not installed locally, migration SQL can be applied via Supabase Studio. The planner should include both paths as a note.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern=phase3` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LESSON-01 | Levels table exists with correct schema; RLS enabled | unit (static SQL parse) | `npm test -- --testPathPattern=rls-phase3` | Wave 0 |
| LESSON-02 | sub_components and sub_component_progress tables; RLS scoped to auth.uid() | unit (static SQL parse) | `npm test -- --testPathPattern=rls-phase3` | Wave 0 |
| LESSON-03 | `markSubComponentComplete` action upserts progress row for authenticated user | unit (mocked Supabase) | `npm test -- --testPathPattern=lessons` | Wave 0 |
| LESSON-03 | `markSubComponentComplete` rejects unauthenticated calls | unit (mocked Supabase) | `npm test -- --testPathPattern=lessons` | Wave 0 |
| LESSON-03 | `markSubComponentComplete` rejects invalid UUID input | unit (zod validation) | `npm test -- --testPathPattern=lessons` | Wave 0 |
| LESSON-04 | Level page derives `isLevelLocked = true` when `current_level_id` does not match | unit (pure function test) | `npm test -- --testPathPattern=level` | Wave 0 |
| LESSON-04 | Level page derives `isLevelLocked = false` for French 1 (matching `current_level_id`) | unit (pure function test) | `npm test -- --testPathPattern=level` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=phase3`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/rls-phase3.test.ts` — static SQL parse of Phase 3 migration; covers LESSON-01, LESSON-02
- [ ] `__tests__/lessons/actions.test.ts` — unit tests for `markSubComponentComplete`; covers LESSON-03
- [ ] `__tests__/lessons/level.test.ts` — unit tests for locked/unlocked derivation logic; covers LESSON-04

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (indirect) | `getUser()` in every Server Action and Server Component — already established pattern |
| V3 Session Management | no | Handled entirely in Phase 2; no new session logic |
| V4 Access Control | yes | RLS policies on `sub_component_progress`; `current_level_id` not settable by student |
| V5 Input Validation | yes | `zod` UUID validation on `sub_component_id` in Server Action |
| V6 Cryptography | no | No new crypto; Supabase handles auth tokens |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Student POSTs arbitrary `sub_component_id` to claim progress for another student's lesson | Tampering | RLS INSERT policy: `with check ((select auth.uid()) = user_id)` — DB rejects mismatched user_id |
| Student submits a `sub_component_id` UUID that doesn't exist in the DB (phantom progress) | Tampering | Server Action verifies `sub_component_id` exists in `sub_components` before upsert |
| Student updates their own `current_level_id` to unlock French 2 ahead of Phase 4 | Elevation of Privilege | Column grant: do NOT grant UPDATE on `profiles.current_level_id` to `authenticated` role. Only `service_role` (admin client) may set this field. Mirror the Phase 2 column-scoped UPDATE grant pattern. |
| Unauthenticated access to lesson content via direct Supabase API call | Information Disclosure | Content tables use `to authenticated` (not `to anon`) — anonymous callers see no rows |

**Critical:** The `current_level_id` column added to `profiles` must NOT be included in the column-scoped UPDATE grant for `authenticated`. The Phase 2 migration grants `update (username, updated_at)` — the Phase 3 migration must NOT expand this to include `current_level_id`. Only `service_role` (used by Phase 4 diagnostic) may set it.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 3 |
|-----------|-------------------|
| RLS required on every user-data table | `sub_component_progress` MUST have RLS with `auth.uid()` scoping |
| Parameterized queries only — no raw SQL string building | All Supabase queries use the JS query builder (`.from().select()...`); no string interpolation |
| Input sanitization on all user-submitted content | `sub_component_id` validated as UUID via zod before any DB operation |
| No API keys / secrets in client code | `markSubComponentComplete` is a Server Action — runs server-side only. No Supabase secret key exposed |
| Green (tertiary color `#006c4a`) = correct-answer feedback ONLY | "Mark complete" UI uses primary coral or neutral — NOT green. Green is reserved for Phase 5 problem feedback |
| Lesson content max-width = 720px | Lesson page layout: `max-w-[720px]` on the content column |
| Dashboard container = 1040px | Level page layout: `max-w-[1040px]` on the outer container |
| Guillemet « » = active-lesson marker | Level page: active/in-progress lesson gets `«` prefix marker |
| Sentence case for all UI copy | "Mark complete" not "Mark Complete"; "Back to level" not "Back To Level" |
| Warm palette only — no ad-hoc hex values | All colors via DESIGN.md tokens (e.g., `text-primary`, `bg-surface-container-low`) |

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20260620_phase2_auth.sql` — RLS pattern, column grant pattern, trigger structure verified directly from codebase
- `src/app/auth/actions.ts` — Server Action pattern (getUser() server-side, zod-style validation, redirect) verified from codebase
- `src/app/dashboard/page.tsx` — Server Component pattern verified from codebase
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — `USING (true)` for public content, `(select auth.uid())` for user data, `to authenticated` role scoping. Published 2026-06-19.

### Secondary (MEDIUM confidence)
- [Optimistic UI Patterns with Next.js Server Actions and Supabase Realtime](https://dev.to/mahdi_benrhouma_fe1c6005/optimistic-ui-patterns-with-nextjs-server-actions-and-supabase-realtime-7e0) — `useOptimistic` + `startTransition` toggle pattern; pitfall list for missing `startTransition` and `revalidatePath`. Published 2026-06-11.
- [React 19 Server Actions in Next.js 16](https://www.thanosk.eu/deep-dives/react-19-server-actions-nextjs-16) — `useOptimistic` with `setOptimisticTodo(id)` pattern; zod validation in Server Actions.
- [Next.js 16 Optimistic UI Tutorial](https://nerdleveltech.com/nextjs-16-server-actions-react-19-optimistic-ui-tutorial) — `useActionState` + `useOptimistic` combination; silent-failure trap analysis. Published 2026-05-18.
- [Supabase JSON Docs](https://supabase.com/docs/guides/database/json) — `jsonb` vs `json` column guidance; TEXT for simple markdown preferred when no querying needed.

### Tertiary (LOW confidence)
- None — all core claims verified via codebase inspection or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and verified via `npm view`
- Schema design: HIGH — mirrors Phase 2 SQL style directly; RLS pattern from official Supabase docs
- Architecture: HIGH — verified against existing `src/app/dashboard/page.tsx` and `actions.ts` patterns
- Real-time save pattern: HIGH — confirmed via two independent recent sources (June 2026) both describing identical pattern
- Pitfalls: HIGH — sourced from official docs + codebase review + recently published tutorials

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable libraries — Supabase RLS and React `useOptimistic` APIs are stable)
