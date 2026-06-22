# Phase 4: Diagnostic System — Research

**Researched:** 2026-06-22
**Domain:** Diagnostic gating, placement scoring, unlock watermark, resumable attempt state, Supabase RLS
**Confidence:** HIGH — all findings derived from codebase inspection, locked CONTEXT.md decisions, and established Phase 2/3 patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Diagnostic content & format**
- D-D01: Questions in dedicated `diagnostic_questions` table (NOT `sub_components`). Per-level pool.
- D-D02: Question types = MC + fill-in only, code-graded. Phase 4 ships its own minimal inline grader for these two types; Phase 5 builds the full engine.
- D-D03: Fill-in grading is lenient — case-insensitive, accent-insensitive, whitespace-trimmed. When normalized answer matches but accents differ, surface a soft inline note ("Correct — watch the accents: café, not cafe"). Still scored as correct.
- D-D04: Each level has a question pool (~20 seed questions); each attempt draws ~10. Pool must exceed draw count.
- D-D05: Each question carries a lesson/topic tag for weak-area review.

**Placement diagnostic**
- D-P01: Forced before any lesson access for first-time students.
- D-P02: One-time — no retake.
- D-P03: ~10 questions drawn. ≥80% → French 2; below → French 1. French 1 is the floor.
- D-P04: Placed at French 2 ⇒ watermark unlocks levels 1 & 2; current level = French 2. French 1 stays accessible.
- D-P05: Result screen shows placement level + encouraging message — NO raw percentage.

**End-of-level diagnostic**
- D-E01: Available only after student completes all lessons (all sub-components) in the level.
- D-E02: 80% to pass → unlocks next level (advances watermark).
- D-E03: On fail → score + weak-area review section listing lessons for missed questions + 3-hour per-level cooldown before retry. BOTH review AND cooldown (not either/or).
- D-E04: Retry re-draws/reshuffles from pool (not identical set).

**Diagnostic UX**
- D-U01: Soft timer — display elapsed time only. Not enforced, not used in grading.
- D-U02: In-progress attempts persisted and resumable — same question set + saved answers; leaving and returning resumes same attempt.
- D-U03: Cooldown shows live countdown on retry button ("available in 2h 14m"); per-level scope.

**Security / unlock model**
- D-S01: All placement/unlock writes go through service-role/admin client only — students cannot self-promote. Scoring + unlock decision happen server-side.
- D-S02: Generalize `deriveIsLevelLocked` to `unlocked_through` watermark: level locked when `levelNumber > unlockedThroughNumber`. Keep signature stable. Do NOT hard-code a 2-level ceiling.

### Claude's Discretion
- Exact schema: table/column names, attempt + answer modeling, RLS policy specifics, migration structure.
- Watermark representation: new int `unlocked_through_level_number` on `profiles` vs a level_id pointer (int watermark likely simplest).
- Placement gate mechanics: middleware/interceptor vs server-component guard.
- Exact seed question content + topics (minimal sample only).
- Diagnostic UI layout within DESIGN.md tokens.
- How "missed/weak topics" are computed from tags for the review section.
- Weighting of MC vs fill-in toward the score (assume equal unless a reason emerges).

### Deferred Ideas (OUT OF SCOPE)
- Full practice-problem engine (conjugation, matching, open-writing) → Phase 5
- Real French 1 / French 2 diagnostic question content → Phases 7–8
- Richer per-lesson scoring beyond the diagnostic
- Levels beyond French 2 (watermark model must NOT hard-code 2-level ceiling)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIAG-01 | Initial placement diagnostic runs on first use and places student at the correct level | Placement gate pattern (server-component guard in dashboard/level pages), scoring pure function, `profiles.unlocked_through_level_number` write via admin client |
| DIAG-02 | End-of-level diagnostic gates advancement — student must pass to unlock the next level | Availability gate (all sub-components complete check), scoring + unlock Server Action using admin client, cooldown enforcement via `diagnostic_attempts.cooldown_until` |
| DIAG-03 | Levels above the student's earned level are visibly locked | `deriveIsLevelLocked` generalized to watermark; existing LevelCard/LockBadge UI unchanged |
</phase_requirements>

---

## Summary

Phase 4 builds the diagnostic mechanism on top of the Phase 3 lesson framework. Three new Supabase tables are required: `diagnostic_questions` (content pool), `diagnostic_attempts` (per-student attempt state), and `diagnostic_answers` (per-question answer within an attempt). The `profiles` table gains a new integer watermark column `unlocked_through_level_number` (replacing the current single-pointer model). The existing `deriveIsLevelLocked` pure function is generalized to use this watermark: a level is locked when `level.level_number > profile.unlocked_through_level_number`.

The placement gate is best implemented as a **server-component guard** in the dashboard page and level pages (not middleware), because it requires a DB read to check placement completion state — middleware cannot make authenticated Supabase calls with RLS. The guard logic is: if the user has no completed placement attempt (`diagnostic_attempts` has no `completed` row for `diagnostic_type = 'placement'`), render the `DiagnosticGate` interstitial rather than the normal page content. This mirrors the existing `getUser()` defense-in-depth pattern in `DashboardPage` and `LevelPage`.

Scoring logic and fill-in normalization are pure functions with no side effects — they are the primary testable seams for this phase. The Server Action that grades and unlocks uses the admin client for the profile write (carrying forward the T-03-01 guard from Phase 3), mirrors `markSubComponentComplete` for structure, and adds an idempotent upsert for the attempt completion record.

**Primary recommendation:** Model the attempt as a single `diagnostic_attempts` row (state machine: `in_progress` → `completed`), with a child `diagnostic_answers` table for per-question answers. The drawn question set is stored as a JSONB array on the attempt row so resuming is a single row read. Score computation and placement mapping are pure functions. All unlock writes use the admin client.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Placement gate (block lesson access) | Frontend Server (SSR) | — | Requires DB read; cannot be done in middleware without admin client. Server Component renders gate UI or redirects |
| Diagnostic question draw | API / Backend (Server Action) | — | Random draw from pool must happen server-side to prevent client seeing the full answer pool |
| Scoring (MC + fill-in) | API / Backend (Server Action) | — | Answer key must never reach the client; server computes correct/incorrect |
| Unlock write (watermark advance) | API / Backend (Server Action via admin client) | — | T-03-01 guard — only service_role may promote a student |
| Cooldown enforcement | API / Backend | Browser/Client | Server computes `cooldown_until`; client renders live countdown UI |
| Attempt resumability | Database / Storage | API / Backend | `diagnostic_attempts` persists drawn set + per-question answers |
| Lock UI derivation (DIAG-03) | Frontend Server (SSR) | — | `deriveIsLevelLocked` runs in Server Component from watermark value |
| Live countdown timer | Browser / Client | — | `CooldownCountdown` client component with `setInterval` |
| Fill-in normalization display | Browser / Client | — | Soft accent note rendered after graded fill-in submission |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | already installed | Server Components, Server Actions, routing | Established project stack |
| Supabase JS (`@supabase/ssr`) | already installed | DB queries, RLS-scoped reads, admin client for unlocks | Established project stack |
| Zod | already installed | Input validation in Server Actions | Used in `markSubComponentComplete`; mirror pattern |
| Lucide React | already installed | `Check`, `X`, `Lock`, `Timer` icons in diagnostic UI | Already installed per UI-SPEC |

No new npm packages are required for Phase 4. All grading logic is pure TypeScript. [VERIFIED: codebase inspection]

### Installation

```bash
# No new packages — all dependencies already present
```

---

## Package Legitimacy Audit

No new packages are installed in this phase. All capabilities are implemented using the existing project stack (Next.js, Supabase, Zod, Lucide React, Tailwind CSS).

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Student Browser
      │
      ▼
  Next.js Middleware (proxy.ts)
  [Auth gate: redirect to /login if unauthenticated]
      │
      ▼
  Server Component (DashboardPage / LevelPage)
  [Placement gate: query diagnostic_attempts for completed placement]
      │
      ├─── No completed placement ──────► DiagnosticGate interstitial
      │                                   "Before you begin" + CTA
      │                                        │
      │                                        ▼
      │                            /diagnostic/placement
      │                            Server Component
      │                            [Draw 10 questions from pool]
      │                            [Create/resume diagnostic_attempt]
      │                                        │
      │                            DiagnosticQuestionCard (Client)
      │                            [MC or FillIn → Submit answer]
      │                                        │
      │                            submitDiagnosticAnswer (Server Action)
      │                            [Grade answer server-side]
      │                            [Upsert diagnostic_answers row]
      │                            [If last question → grade attempt]
      │                                        │
      │                            scoreAndPlaceDiagnostic (Server Action)
      │                            [computeScore() pure fn]
      │                            [derivePlacement() pure fn]
      │                            [Admin client → profiles.unlocked_through_level_number]
      │                            [Admin client → profiles.current_level_id]
      │                                        │
      │                            DiagnosticResult screen
      │                            ["« French 1 »" or "« French 2 »" + message]
      │                                        │
      └─── Completed placement ────────► Normal dashboard / level content
                                         deriveIsLevelLocked(levelNumber, unlockedThroughNumber)
                                         drives LevelCard/LockBadge UI
```

End-of-level diagnostic flow mirrors placement but originates from level page CTA (after all sub-components complete) and routes to `/diagnostic/end-of-level/[levelSlug]`.

### Recommended Project Structure

```
src/
├── lib/
│   ├── lessons/
│   │   └── locking.ts            # MODIFY: generalize to watermark
│   └── diagnostics/
│       ├── scoring.ts            # NEW: computeScore(), derivePlacement(), normalizeFillin()
│       ├── gating.ts             # NEW: hasCompletedPlacement(), isLevelDiagnosticAvailable()
│       └── types.ts              # NEW: DiagnosticQuestion, DiagnosticAttempt, AttemptAnswer
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # MODIFY: add placement gate guard
│   ├── levels/[levelSlug]/
│   │   └── page.tsx              # MODIFY: add placement gate guard + end-of-level CTA
│   └── diagnostic/
│       ├── placement/
│       │   └── page.tsx          # NEW: placement diagnostic flow
│       └── end-of-level/[levelSlug]/
│           └── page.tsx          # NEW: end-of-level diagnostic flow
├── components/
│   └── diagnostic/
│       ├── DiagnosticGate.tsx        # NEW
│       ├── DiagnosticProgress.tsx    # NEW
│       ├── DiagnosticQuestionCard.tsx # NEW
│       ├── MCOptionButton.tsx        # NEW
│       ├── FillInInput.tsx           # NEW
│       ├── DiagnosticResult.tsx      # NEW
│       ├── DiagnosticResultFail.tsx  # NEW
│       └── CooldownCountdown.tsx     # NEW ('use client')
└── actions/
    └── diagnostic.ts             # NEW: Server Actions for diagnostic
```

### Pattern 1: Watermark Generalization of `deriveIsLevelLocked`

**What:** Replace UUID-equality lock check with numeric watermark comparison.
**When to use:** Always — all level locking goes through this function.

```typescript
// Source: src/lib/lessons/locking.ts (Phase 4 replacement)
// Breaking change: signature extends with unlockedThroughLevelNumber;
// callers (LevelPage) must pass the new field from profiles.

export function deriveIsLevelLocked(args: {
  levelId: string
  levelNumber: number
  currentLevelId: string | null | undefined
  /** Phase 4: numeric watermark. If absent, fall back to Phase 3 UUID check. */
  unlockedThroughLevelNumber?: number | null
}): boolean {
  // Null/undefined watermark AND null currentLevelId → new student, not yet placed
  // Treat as French 1 unlocked (watermark = 1), everything else locked
  if (args.unlockedThroughLevelNumber != null) {
    return args.levelNumber > args.unlockedThroughLevelNumber
  }
  // Phase 3 fallback: UUID check (removes itself once all users have watermark)
  if (args.currentLevelId == null) return false
  return args.levelId !== args.currentLevelId
}
```

**Why numeric watermark:** Integer comparison (`levelNumber > watermark`) is the cleanest model for multi-level unlocking without hard-coding a ceiling. New levels (French 3, 4, 5) slot in with no schema changes. [ASSUMED — implementer's call per D-S02]

### Pattern 2: Server Action for Diagnostic Grading and Unlock

**What:** Mirrors `markSubComponentComplete` — validate input, server-derive user, compute score server-side, write unlock via admin client.
**When to use:** Answer submission (per-question) and diagnostic completion (final grade + unlock).

```typescript
// Source: mirrors src/app/lessons/actions.ts pattern
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { computeScore, derivePlacement } from '@/lib/diagnostics/scoring'

const SubmitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().max(500).trim(),
})

export async function submitDiagnosticAnswer(raw: unknown): Promise<void> {
  const parsed = SubmitAnswerSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Invalid input')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Grade server-side — answer key read from DB here, never sent to client
  // ... upsert diagnostic_answers row ...
  // If last question in attempt → computeScore() → if pass → admin client unlock
}
```

### Pattern 3: Pure Scoring Functions (testable seams)

**What:** Isolated pure functions with no imports, no DB, no side effects.
**When to use:** These are the Wave 0 test targets.

```typescript
// Source: src/lib/diagnostics/scoring.ts

/** Normalize a fill-in answer: lowercase, remove diacritics, trim whitespace */
export function normalizeFillin(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
}

/** Grade a single answer. Returns { correct: boolean, accentNote?: string } */
export function gradeAnswer(question: DiagnosticQuestion, submitted: string): GradeResult {
  if (question.type === 'mc') {
    return { correct: submitted === question.correct_answer }
  }
  // fill-in: accent-insensitive comparison
  const normalSubmitted = normalizeFillin(submitted)
  const normalCorrect = normalizeFillin(question.correct_answer)
  const correct = normalSubmitted === normalCorrect
  // Soft accent note: correct on normalized but differs on raw
  const accentNote =
    correct && submitted.trim().toLowerCase() !== question.correct_answer.toLowerCase()
      ? question.correct_answer
      : undefined
  return { correct, accentNote }
}

/** Compute attempt score: correct count / total drawn */
export function computeScore(answers: GradeResult[]): number {
  const correct = answers.filter(a => a.correct).length
  return correct / answers.length
}

/** Map score to placement level number */
export function derivePlacement(score: number): 1 | 2 {
  return score >= 0.8 ? 2 : 1
}

/** Derive whether an end-of-level attempt passed */
export function derivePassFail(score: number): 'pass' | 'fail' {
  return score >= 0.8 ? 'pass' : 'fail'
}
```

### Pattern 4: Placement Gate in Server Components

**What:** Server Component checks for completed placement attempt; renders gate or normal content.
**When to use:** Dashboard page and any level page for first-time users.

```typescript
// Source: extends src/app/dashboard/page.tsx pattern

// After getUser() guard — check placement completion
const { data: placementAttempt } = await supabase
  .from('diagnostic_attempts')
  .select('id, status')
  .eq('user_id', user.id)
  .eq('diagnostic_type', 'placement')
  .eq('status', 'completed')
  .maybeSingle()

if (!placementAttempt) {
  // Check for in-progress placement — show resume banner if exists
  const { data: inProgress } = await supabase
    .from('diagnostic_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')
    .eq('status', 'in_progress')
    .maybeSingle()

  return <DiagnosticGate hasInProgress={!!inProgress} />
}
// ... render normal page content
```

**Why server-component guard (not middleware):** The proxy (`src/app/proxy.ts`) only does auth-presence checks — it cannot read `diagnostic_attempts` with RLS because middleware cannot use the browser/server Supabase client factories that handle cookie-based sessions for RLS. A server component guard (same pattern as the existing `getUser()` defense-in-depth) is the correct tier for this check. [VERIFIED: codebase inspection of proxy.ts and middleware.test.ts]

### Pattern 5: Cooldown Enforcement

**What:** `cooldown_until` timestamptz column on `diagnostic_attempts`. Server Action checks before allowing retry draw. Client renders live countdown.
**When to use:** End-of-level diagnostic fail flow.

```typescript
// Server Action: before creating a new attempt
const { data: lastFail } = await supabase
  .from('diagnostic_attempts')
  .select('cooldown_until')
  .eq('user_id', user.id)
  .eq('level_id', levelId)
  .eq('status', 'failed')
  .order('completed_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (lastFail?.cooldown_until && new Date(lastFail.cooldown_until) > new Date()) {
  throw new Error('Cooldown active')
}
```

### Anti-Patterns to Avoid

- **Answer key sent to client:** Never include `correct_answer` in the question data fetched by the diagnostic page component. Fetch questions with `select('id, question_text, type, options')` — omit `correct_answer`. Grade server-side only.
- **Client-reported score trusted:** Never accept a score from the client. Always recompute from DB-stored answers server-side.
- **Student writing own watermark:** The `unlocked_through_level_number` column must NOT be in the `update (...)` grant for `authenticated`. Only `service_role` may write it (mirrors the `current_level_id` guard from Phase 3).
- **Middleware placement gate:** Middleware cannot read `diagnostic_attempts` with user-scoped RLS. This logic belongs in the Server Component.
- **Re-using `sub_components` for questions:** D-D01 locks this — questions go in `diagnostic_questions`, clean separation from lesson content.
- **Hard-coding 2-level ceiling:** The watermark model (`levelNumber > unlockedThroughNumber`) must work for any number of future levels. No `if levelNumber === 2` branches.
- **Identical question set on retry:** D-E04 requires re-draw/reshuffle. The drawn set is stored on the attempt row; creating a new attempt re-draws from the pool.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accent/diacritic stripping | Custom regex per character | `String.prototype.normalize('NFD') + /[̀-ͯ]/g strip` | Standard Unicode decomposition; handles all French diacritics (é, è, ê, ë, à, â, ù, û, ç, î, ï, ô, œ, æ) correctly |
| Input validation in Server Actions | Ad-hoc type checks | Zod (already installed) | Mirrors `markSubComponentComplete` pattern; consistent error surface |
| UUID generation | `Math.random()` strings | Postgres `gen_random_uuid()` | Cryptographically safe, already used in all existing migrations |
| Admin writes (unlock) | Extra RLS policy exceptions | `createAdminClient()` from `src/lib/supabase/admin.ts` | Already established in Phase 2/3; bypasses RLS safely server-side |
| Live countdown | Third-party timer library | Native `setInterval` in Client Component | Simple enough; no dependency needed |

**Key insight:** The scoring logic is deceptively simple — the complexity is in the security boundary (answer key never leaves the server) and the RLS policy design (students can write their own answers but not their own unlock state).

---

## Schema Design

### New Tables

#### `diagnostic_questions` (content — per-level pool)

```sql
create table public.diagnostic_questions (
  id              uuid        not null primary key default gen_random_uuid(),
  level_id        uuid        not null references public.levels on delete cascade,
  type            text        not null
                    constraint dq_type check (type in ('mc', 'fill_in')),
  question_text   text        not null,
  options         jsonb,        -- null for fill_in; array of strings for mc
  correct_answer  text        not null,  -- never exposed to client via select
  lesson_tag      text,         -- slug of the lesson this question covers (D-D05)
  position        int         not null default 0,
  created_at      timestamptz not null default now()
);

-- Content table: authenticated read, service_role write
grant select on public.diagnostic_questions to authenticated;
alter table public.diagnostic_questions enable row level security;

create policy "Authenticated users can read diagnostic questions (minus answer)"
  on public.diagnostic_questions
  for select to authenticated using (true);
-- NOTE: The RLS policy allows reading ALL columns including correct_answer.
-- The answer key is protected by NEVER including correct_answer in client-side
-- select queries (application-level enforcement, not RLS column masking).
-- Column-level security via Postgres is an option but adds complexity; the
-- simpler approach is disciplined server-side-only column selection.
```

**Security note on answer key:** Supabase does not expose column-level security in a simple way via JS client. The correct_answer column is protected by never including it in client-facing queries. The diagnostic page fetches `select('id, question_text, type, options, lesson_tag')` — `correct_answer` is never in the projection. Grading happens in the Server Action which fetches `correct_answer` separately. [ASSUMED — implementer verifies column projection discipline]

#### `diagnostic_attempts` (per-student attempt state)

```sql
create table public.diagnostic_attempts (
  id                  uuid        not null primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users on delete cascade,
  level_id            uuid        not null references public.levels on delete cascade,
  diagnostic_type     text        not null
                        constraint da_type check (diagnostic_type in ('placement', 'end_of_level')),
  status              text        not null default 'in_progress'
                        constraint da_status check (status in ('in_progress', 'completed', 'failed')),
  drawn_question_ids  uuid[]      not null default '{}',  -- ordered draw set (D-U02 resumability)
  score               numeric(4,3),   -- null until completed; 0.000–1.000
  correct_count       int,
  total_count         int,
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  cooldown_until      timestamptz,    -- set on fail (completed_at + 3h); null on pass
  elapsed_seconds     int             -- soft timer accumulation for display on resume
);

-- Index for gate queries
create index idx_da_user_level_type on public.diagnostic_attempts (user_id, level_id, diagnostic_type);
create index idx_da_user_type_status on public.diagnostic_attempts (user_id, diagnostic_type, status);

grant select, insert, update on public.diagnostic_attempts to authenticated;
grant all on public.diagnostic_attempts to service_role;

alter table public.diagnostic_attempts enable row level security;

create policy "Students can read own diagnostic attempts"
  on public.diagnostic_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own diagnostic attempts"
  on public.diagnostic_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update own diagnostic attempts"
  on public.diagnostic_attempts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- Note: status/score columns are writable by authenticated here.
-- The unlock write (profiles.unlocked_through_level_number) is the
-- security boundary — that uses admin client only (D-S01).
```

#### `diagnostic_answers` (per-question answer within an attempt)

```sql
create table public.diagnostic_answers (
  id              uuid        not null primary key default gen_random_uuid(),
  attempt_id      uuid        not null references public.diagnostic_attempts on delete cascade,
  question_id     uuid        not null references public.diagnostic_questions on delete cascade,
  submitted_answer text       not null,
  is_correct      boolean     not null,
  answered_at     timestamptz not null default now(),
  unique (attempt_id, question_id)  -- idempotent: one answer per question per attempt
);

create index idx_diag_ans_attempt_id on public.diagnostic_answers (attempt_id);

grant select, insert on public.diagnostic_answers to authenticated;
grant all on public.diagnostic_answers to service_role;

alter table public.diagnostic_answers enable row level security;

create policy "Students can read own diagnostic answers"
  on public.diagnostic_answers for select to authenticated
  using (
    exists (
      select 1 from public.diagnostic_attempts da
      where da.id = attempt_id and da.user_id = (select auth.uid())
    )
  );

create policy "Students can insert own diagnostic answers"
  on public.diagnostic_answers for insert to authenticated
  with check (
    exists (
      select 1 from public.diagnostic_attempts da
      where da.id = attempt_id and da.user_id = (select auth.uid())
    )
  );
```

### Profiles Table Modification

```sql
-- Add watermark column (D-S02)
-- NOT added to the authenticated UPDATE grant (only service_role may write it)
alter table public.profiles
  add column unlocked_through_level_number int
    constraint utp_min check (unlocked_through_level_number >= 1);

-- Backfill: existing users who have current_level_id → derive watermark
-- French 1 placement → watermark = 1
-- French 2 placement → watermark = 2 (unlocks both 1 and 2)
update public.profiles p
set unlocked_through_level_number = l.level_number
from public.levels l
where l.id = p.current_level_id
  and p.unlocked_through_level_number is null;

-- Users with null current_level_id have no placement yet → leave null
-- (the gate will catch them; deriveIsLevelLocked handles null watermark gracefully)
```

**Watermark null semantics:** `unlocked_through_level_number IS NULL` means the student has not completed placement. The generalized `deriveIsLevelLocked` treats null watermark as "not yet placed" — French 1 is the floor if the gate is bypassed, but the gate should prevent this state from reaching lesson content. [ASSUMED — null vs. 0 is implementer's call; null is recommended as it distinguishes "not placed" from "placed at level 0"]

---

## Common Pitfalls

### Pitfall 1: Answer Key Leaking to Client
**What goes wrong:** The diagnostic page Server Component fetches `diagnostic_questions` including `correct_answer` in the select projection, and Next.js serializes this into the page's initial RSC payload — visible in browser devtools.
**Why it happens:** Copy-paste of a content fetch that selects `*`.
**How to avoid:** Always specify columns explicitly in diagnostic question fetches: `select('id, question_text, type, options, lesson_tag')`. The Server Action that grades fetches `correct_answer` in a separate server-side query.
**Warning signs:** Check network tab → RSC payload for "correct_answer" strings.

### Pitfall 2: Watermark Write Without Admin Client
**What goes wrong:** `profiles.unlocked_through_level_number` is written via the regular server client (`createClient()`), which runs with authenticated RLS. The `authenticated` role's UPDATE grant on `profiles` covers only `(username, updated_at)` (from Phase 2). The write silently fails or returns an RLS error.
**Why it happens:** Forgetting the admin client requirement for level promotion.
**How to avoid:** All writes to `profiles.unlocked_through_level_number` and `profiles.current_level_id` MUST use `createAdminClient()`. Pattern mirrors Phase 3's T-03-01 guard. Test: verify unlock Server Action throws on RLS rather than silently no-ops.
**Warning signs:** Profile column remains null after a passing diagnostic — no JS error.

### Pitfall 3: Cooldown Check Race Condition
**What goes wrong:** Two concurrent retries both pass the cooldown check before either creates the new attempt, resulting in two simultaneous in-progress attempts for the same level.
**Why it happens:** The cooldown check and attempt creation are not atomic.
**How to avoid:** Use a Postgres unique partial index to prevent two `in_progress` attempts for the same (user_id, level_id, diagnostic_type): `create unique index idx_one_active_attempt on diagnostic_attempts (user_id, level_id, diagnostic_type) where status = 'in_progress'`. The insert will fail with a constraint error if a race occurs; the Server Action catches this and returns a "diagnostic already in progress" response.
**Warning signs:** Two `in_progress` rows for the same user/level in `diagnostic_attempts`.

### Pitfall 4: Placement Gate in Wrong Tier (Middleware)
**What goes wrong:** Attempting to add the placement gate to `src/app/proxy.ts` (middleware). The proxy uses `@supabase/ssr createServerClient` with cookie forwarding, but it cannot make RLS-scoped reads to `diagnostic_attempts` because the middleware context lacks the full server client session.
**Why it happens:** Confusing auth-presence checks (safe in middleware) with data-presence checks (require server component).
**How to avoid:** Gate implemented in Server Components (`DashboardPage`, `LevelPage`) using the existing `createClient()` server factory. The proxy continues to handle only auth-presence.

### Pitfall 5: Drawn Question Set Drift on Resume
**What goes wrong:** On resume, the Server Component re-queries `diagnostic_questions` for the level, and the question order is non-deterministic. The student sees a different subset than they originally answered.
**Why it happens:** Not storing the drawn set on the attempt.
**How to avoid:** `diagnostic_attempts.drawn_question_ids uuid[]` stores the ordered draw on attempt creation. Resume reads this array and fetches exactly those questions in that order. Only unanswered questions (not in `diagnostic_answers`) are shown.

### Pitfall 6: Lenient Grading Misses Blank Submissions
**What goes wrong:** `normalizeFillin('')` returns `''`, which might match a trick question with an empty correct answer — or `gradeAnswer` marks blank as incorrect without the soft note.
**Why it happens:** Edge case not covered by normalization.
**How to avoid:** Add a guard: if `submitted.trim() === ''`, always return `{ correct: false }` without running normalization. Blank = unanswered, not a leniency case. Test explicitly.

### Pitfall 7: End-of-Level CTA Shown for Locked Level
**What goes wrong:** The "Take the end-of-level diagnostic" CTA is rendered even when the level is locked (the student shouldn't be taking the diagnostic for a level they can't access).
**Why it happens:** CTA availability check only queries sub-component completion, not level lock state.
**How to avoid:** The level page already computes `isLocked` from the watermark. Guard the CTA: `!isLocked && allSubComponentsComplete && <DiagnosticCTA />`.

---

## Code Examples

### Unicode Diacritic Normalization

```typescript
// Source: MDN Web Docs — String.prototype.normalize() [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize]
// NFD = canonical decomposition: "é" → "e" + combining acute accent (U+0301)
// The regex strips all combining diacritical marks (U+0300–U+036F)

export function normalizeFillin(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Covers all French diacritics:
// é è ê ë → e
// à â → a
// ù û → u
// ç → c  (cedilla U+0327 — also in combining range)
// î ï → i
// ô → o
// œ → oe (NFD decomposes to o + combining)
// æ → ae
```

### Random Question Draw (Server-Side)

```typescript
// Pure function — no DB dependency; testable
// Source: [ASSUMED] Fisher-Yates shuffle — well-known algorithm
export function drawQuestions<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
```

### Cooldown Computation

```typescript
// Pure function — testable
export function computeCooldownUntil(completedAt: Date, cooldownHours: number): Date {
  return new Date(completedAt.getTime() + cooldownHours * 60 * 60 * 1000)
}

export function isCooldownActive(cooldownUntil: Date | null, now = new Date()): boolean {
  if (!cooldownUntil) return false
  return now < cooldownUntil
}

export function formatCooldownRemaining(cooldownUntil: Date, now = new Date()): string {
  const ms = cooldownUntil.getTime() - now.getTime()
  if (ms <= 0) return ''
  const totalMinutes = Math.ceil(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
```

### Level Completion Check (pure)

```typescript
// Pure function: all sub-components complete = no gap between completed set and total set
export function deriveAllLessonsComplete(
  subComponentIds: string[],
  completedSubComponentIds: Set<string>
): boolean {
  return subComponentIds.length > 0 &&
    subComponentIds.every(id => completedSubComponentIds.has(id))
}
```

---

## Runtime State Inventory

This is a greenfield feature phase (no rename/refactor). Omit.

---

## Environment Availability

No external tools or services beyond the existing stack are required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase (local/remote) | All DB operations | ✓ | existing | — |
| Node.js / Next.js | Server Actions, Server Components | ✓ | existing | — |
| Jest + ts-jest | Test suite | ✓ | existing | — |

---

## Validation Architecture

> `nyquist_validation: true` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` (root) |
| Test directory | `__tests__/` |
| Quick run command | `npx jest --testPathPattern="diagnostic"` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | `derivePlacement(score)` returns 2 for ≥80%, 1 for <80% | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `normalizeFillin()` strips accents, lowercases, trims | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `gradeAnswer()` MC correct/incorrect | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `gradeAnswer()` fill-in lenient: café == cafe == Cafe | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `gradeAnswer()` blank submission always incorrect | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `gradeAnswer()` returns accent note when normalized match but raw differs | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-01 | `computeScore()` returns correct ratio | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-02 | `derivePassFail(score)` threshold at 0.8 | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| DIAG-02 | `computeCooldownUntil()` adds 3 hours | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ Wave 0 |
| DIAG-02 | `isCooldownActive()` true when now < cooldown_until | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ Wave 0 |
| DIAG-02 | `formatCooldownRemaining()` formats "2h 14m" / "45m" correctly | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ Wave 0 |
| DIAG-03 | `deriveIsLevelLocked()` uses numeric watermark — level 2 locked when watermark = 1 | unit | `npx jest --testPathPattern="lessons/level"` | ❌ Wave 0 (modify existing) |
| DIAG-03 | `deriveIsLevelLocked()` null watermark falls back gracefully | unit | `npx jest --testPathPattern="lessons/level"` | existing (extend) |
| DIAG-03 | `deriveAllLessonsComplete()` true only when all sub-components present | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ Wave 0 |
| DIAG-01 | `drawQuestions()` returns exactly N items, no duplicates | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ Wave 0 |
| SEC-05 | Unlock Server Action rejects client-reported scores | unit (mock) | `npx jest --testPathPattern="diagnostic/actions"` | ❌ Wave 0 |
| SEC-05 | Unlock Server Action uses admin client (not server client) for profile write | unit (mock) | `npx jest --testPathPattern="diagnostic/actions"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest --testPathPattern="diagnostic"` (diagnostic tests only, ~5s)
- **Per wave merge:** `npx jest` (full suite, currently 77 tests + new diagnostic tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/diagnostic/scoring.test.ts` — covers all `computeScore`, `derivePlacement`, `gradeAnswer`, `normalizeFillin`, `drawQuestions` pure functions
- [ ] `__tests__/diagnostic/gating.test.ts` — covers `computeCooldownUntil`, `isCooldownActive`, `formatCooldownRemaining`, `deriveAllLessonsComplete`
- [ ] `__tests__/diagnostic/actions.test.ts` — covers unlock Server Action security contract (mock pattern from `actions.test.ts`)
- [ ] Extend `__tests__/lessons/level.test.ts` — add watermark cases to `deriveIsLevelLocked` tests

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `getUser()` in all Server Actions and Server Components (established pattern) |
| V3 Session Management | no | Session handled by Supabase Auth (Phase 2) |
| V4 Access Control | yes | Admin client for unlock writes; RLS on all user tables; answer key never in client queries |
| V5 Input Validation | yes | Zod schema validation on Server Action inputs (attemptId, questionId, answer string) |
| V6 Cryptography | no | No new cryptographic operations |

### Known Threat Patterns for Diagnostic System

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client self-reports passing score | Tampering | Score never accepted from client; always recomputed from DB-stored answers server-side |
| Student writes own unlock (self-promotion) | Elevation of Privilege | `unlocked_through_level_number` not in authenticated UPDATE grant; admin client only (T-03-01 pattern) |
| Answer key extraction via client query | Information Disclosure | `correct_answer` never included in client-facing column projections; page fetches `id, question_text, type, options, lesson_tag` only |
| Cooldown bypass via concurrent requests | Tampering | Partial index `where status = 'in_progress'` enforces one active attempt; insert fails on race |
| Placement retake to game level selection | Elevation of Privilege | D-P02: one-time placement. Server Action checks for existing completed placement attempt before creating new one; returns error if found |
| Phantom attempt injection | Tampering | Attempt existence verified before answer insert; `attempt_id` validated as UUID + ownership checked via RLS join policy on `diagnostic_answers` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `unlocked_through_level_number` as int watermark is simplest (vs level_id pointer) | Schema Design | Low — either model works; int is simpler for comparison. Implementer decides |
| A2 | Answer key protection via column projection discipline (not Postgres column-level security) | Schema Design / Security | Medium — if a developer accidentally selects `*`, answer key leaks. Mitigation: code review + test that checks RSC payload in e2e (Phase 10) |
| A3 | Null watermark in `deriveIsLevelLocked` treated as "not yet placed" (not as French 1 unlocked) | Architecture Patterns | Low — behavior is controlled by the placement gate; null should never reach the level page for a new user post-gate. Edge case: gate bypass |
| A4 | `drawQuestions` uses `Math.random()` (not crypto-random) | Code Examples | Very low — question order randomization for learning, not security |
| A5 | `diagnostic_answers` uses RLS join policy (checking `diagnostic_attempts.user_id`) rather than denormalizing `user_id` onto each answer row | Schema Design | Low — join policy is correct pattern for ownership-through-parent; slightly more complex but cleaner schema |

---

## Open Questions

1. **Should `diagnostic_attempts` denormalize `user_id` onto `diagnostic_answers`?**
   - What we know: The join RLS policy on `diagnostic_answers` works but adds a subquery per-row.
   - What's unclear: Performance at scale (not a concern for v1, but schema decisions are expensive to change).
   - Recommendation: Use the join policy for v1. Document in migration comment. Revisit if v2 diagnostics show query cost.

2. **Should `current_level_id` on `profiles` be retained or replaced by `unlocked_through_level_number`?**
   - What we know: `current_level_id` is used in the existing `deriveIsLevelLocked` fallback and the `handle_new_user` trigger.
   - What's unclear: Whether both fields should coexist or `current_level_id` should be removed.
   - Recommendation: Retain both in Phase 4. `current_level_id` = "active learning level" (where the student is working), `unlocked_through_level_number` = "highest level accessible" (the lock gate). They serve different UI purposes. The CONTEXT.md D-P04 decision ("current level = French 2" for placed-at-French-2 students) confirms both concepts are needed.

3. **What is the behavior when a student navigates directly to `/diagnostic/placement` after completing placement?**
   - What we know: D-P02 says one-time — no retake.
   - What's unclear: Should this redirect to dashboard, or show a "placement complete" message?
   - Recommendation: Redirect to `/dashboard`. The Server Component guard checks for existing completed placement and redirects rather than rendering the diagnostic flow again.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/lessons/locking.ts` — Phase 4 watermark extension point, verified in codebase
- `src/app/lessons/actions.ts` — Server Action pattern (validate → auth → DB → revalidate)
- `src/app/dashboard/page.tsx` — Server Component gate pattern (`getUser()` + profile fetch)
- `src/app/levels/[levelSlug]/page.tsx` — Level page query pattern, `deriveIsLevelLocked` usage
- `supabase/migrations/20260622_phase3_lessons.sql` — RLS policy patterns, grant model, trigger
- `__tests__/lessons/actions.test.ts` — Jest mock pattern for Server Actions
- `__tests__/middleware.test.ts` — proxy test pattern; confirms middleware scope
- `.planning/phases/04-diagnostic-system/04-CONTEXT.md` — all locked decisions
- `.planning/phases/04-diagnostic-system/04-UI-SPEC.md` — component inventory and interaction contracts
- `DESIGN.md` — color tokens, typography scale, spacing
- `CLAUDE.md` — security rules, design system rules

### Secondary (MEDIUM confidence)
- [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize] — NFD normalization for diacritic stripping
- `.planning/REQUIREMENTS.md` — DIAG-01, DIAG-02, DIAG-03 acceptance criteria

### Tertiary (LOW confidence)
- Fisher-Yates shuffle algorithm — [ASSUMED] well-known algorithm; standard for array randomization

---

## Metadata

**Confidence breakdown:**
- Schema design: HIGH — derived directly from Phase 3 migration patterns and locked CONTEXT.md decisions
- Scoring/grading pure functions: HIGH — straightforward logic, well-specified in CONTEXT.md
- Security model: HIGH — mirrors established Phase 2/3 patterns (admin client, RLS grants)
- Placement gate tier: HIGH — verified by reading proxy.ts and dashboard page
- Watermark representation: MEDIUM — implementer's call (D-S02); int is recommended

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable stack — 30-day window)
