# Phase 4: Diagnostic System - Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 16 new/modified files
**Analogs found:** 15 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/20260622_phase4_diagnostic.sql` | migration | CRUD | `supabase/migrations/20260622_phase3_lessons.sql` | exact |
| `src/lib/lessons/locking.ts` | utility (modify) | transform | `src/lib/lessons/locking.ts` (current) | self |
| `src/lib/diagnostics/types.ts` | model | transform | `src/lib/lessons/locking.ts` (type pattern) | role-match |
| `src/lib/diagnostics/scoring.ts` | utility | transform | `src/lib/lessons/locking.ts` (pure-fn pattern) | role-match |
| `src/lib/diagnostics/gating.ts` | utility | transform | `src/lib/lessons/locking.ts` (pure-fn pattern) | role-match |
| `src/actions/diagnostic.ts` | service (Server Action) | request-response | `src/app/lessons/actions.ts` | exact |
| `src/app/dashboard/page.tsx` | component (modify) | request-response | `src/app/dashboard/page.tsx` (current) | self |
| `src/app/levels/[levelSlug]/page.tsx` | component (modify) | request-response | `src/app/levels/[levelSlug]/page.tsx` (current) | self |
| `src/app/diagnostic/placement/page.tsx` | component | request-response | `src/app/levels/[levelSlug]/page.tsx` | role-match |
| `src/app/diagnostic/end-of-level/[levelSlug]/page.tsx` | component | request-response | `src/app/levels/[levelSlug]/page.tsx` | role-match |
| `src/components/diagnostic/DiagnosticGate.tsx` | component | request-response | `src/components/lessons/LevelCard.tsx` | role-match |
| `src/components/diagnostic/DiagnosticProgress.tsx` | component | request-response | `src/components/lessons/SubComponentList.tsx` (progress bar) | partial |
| `src/components/diagnostic/DiagnosticQuestionCard.tsx` | component | request-response | `src/components/lessons/SubComponentList.tsx` | partial |
| `src/components/diagnostic/MCOptionButton.tsx` | component | event-driven | `src/components/lessons/SubComponentItem.tsx` | role-match |
| `src/components/diagnostic/FillInInput.tsx` | component | event-driven | `src/components/lessons/SubComponentItem.tsx` | role-match |
| `src/components/diagnostic/DiagnosticResult.tsx` | component | request-response | `src/components/lessons/LevelCard.tsx` | partial |
| `src/components/diagnostic/DiagnosticResultFail.tsx` | component | request-response | `src/components/lessons/SubComponentList.tsx` (allDone block) | partial |
| `src/components/diagnostic/CooldownCountdown.tsx` | component | event-driven | none — no timer client component exists yet | no analog |
| `__tests__/diagnostic/scoring.test.ts` | test | transform | `__tests__/lessons/level.test.ts` | exact |
| `__tests__/diagnostic/gating.test.ts` | test | transform | `__tests__/lessons/level.test.ts` | exact |
| `__tests__/diagnostic/actions.test.ts` | test | request-response | `__tests__/lessons/actions.test.ts` | exact |

---

## Pattern Assignments

### `supabase/migrations/20260622_phase4_diagnostic.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260622_phase3_lessons.sql`

**Table creation pattern** (lines 10–29 of analog — `public.levels`):
```sql
create table public.<table_name> (
  id             uuid        not null primary key default gen_random_uuid(),
  -- FK columns use  `references public.<parent> on delete cascade`
  created_at     timestamptz not null default now()
);
```

**Content table grant + RLS pattern** (lines 20–29 of analog — levels):
```sql
-- Content tables: authenticated read only, no user-scoped RLS needed
grant select on public.<table> to authenticated;
alter table public.<table> enable row level security;
create policy "Authenticated users can read all <table>"
  on public.<table>
  for select to authenticated using (true);
```

**User-data table grant + RLS pattern** (lines 104–130 of analog — sub_component_progress):
```sql
grant select, insert, update on public.<table> to authenticated;
grant all on public.<table> to service_role;
alter table public.<table> enable row level security;

-- Use (select auth.uid()) subquery form — stable evaluation, not per-row
create policy "Students can read own <table>"
  on public.<table> for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own <table>"
  on public.<table> for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update own <table>"
  on public.<table> for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

**RLS join policy pattern** (for `diagnostic_answers` — ownership through parent attempt):
```sql
-- Child table: ownership verified via join to parent (not denormalized user_id)
create policy "Students can read own diagnostic answers"
  on public.diagnostic_answers for select to authenticated
  using (
    exists (
      select 1 from public.diagnostic_attempts da
      where da.id = attempt_id and da.user_id = (select auth.uid())
    )
  );
```

**Profiles ALTER pattern** (lines 145–146 of analog):
```sql
-- Add column; do NOT add to authenticated UPDATE grant (only service_role writes it)
-- The Phase 2 grant stays: grant update (username, updated_at) on public.profiles to authenticated;
alter table public.profiles
  add column <new_column> <type> <constraint>;
```

**Seed pattern** (lines 152–209 of analog — DO $$ block with vars):
```sql
do $$
declare
  v_level_id uuid;
begin
  insert into public.<table> (...) values (...) returning id into v_level_id;
  -- child inserts reference v_level_id
end $$;
```

---

### `src/lib/lessons/locking.ts` (utility, transform — MODIFY)

**Current file:** `src/lib/lessons/locking.ts` (lines 1–35)

The existing signature already carries `levelNumber` as reserved. Phase 4 extends it with an optional `unlockedThroughLevelNumber` parameter and changes the lock rule:

**Current signature** (lines 21–27):
```typescript
export function deriveIsLevelLocked(args: {
  levelId: string
  levelNumber: number
  currentLevelId: string | null | undefined
}): boolean {
```

**Phase 4 extended signature** — add `unlockedThroughLevelNumber?` and watermark branch:
```typescript
export function deriveIsLevelLocked(args: {
  levelId: string
  levelNumber: number
  currentLevelId: string | null | undefined
  /** Phase 4: numeric watermark. If present, takes precedence over UUID check. */
  unlockedThroughLevelNumber?: number | null
}): boolean {
  // Watermark path (Phase 4): level locked when levelNumber > watermark
  if (args.unlockedThroughLevelNumber != null) {
    return args.levelNumber > args.unlockedThroughLevelNumber
  }
  // Phase 3 fallback: UUID check (for users without watermark yet)
  if (args.currentLevelId == null) return false
  return args.levelId !== args.currentLevelId
}
```

**Callers to update:** `src/app/levels/[levelSlug]/page.tsx` line 88–93 — pass `unlockedThroughLevelNumber` from profile fetch.

---

### `src/lib/diagnostics/types.ts` (model, transform — NEW)

**Analog:** `src/lib/lessons/locking.ts` (TypeScript interface/type-export pattern)

**Pattern:** Pure type file, no imports except possibly other local types. Export all diagnostic domain types from one barrel.

```typescript
// No runtime imports — types only
export type QuestionType = 'mc' | 'fill_in'
export type AttemptStatus = 'in_progress' | 'completed' | 'failed'
export type DiagnosticType = 'placement' | 'end_of_level'

export interface DiagnosticQuestion {
  id: string
  level_id: string
  type: QuestionType
  question_text: string
  options: string[] | null   // null for fill_in
  // NOTE: correct_answer NEVER included in client-facing fetches
  lesson_tag: string | null
  position: number
}

export interface DiagnosticAttempt {
  id: string
  user_id: string
  level_id: string
  diagnostic_type: DiagnosticType
  status: AttemptStatus
  drawn_question_ids: string[]
  score: number | null
  correct_count: number | null
  total_count: number | null
  started_at: string
  completed_at: string | null
  cooldown_until: string | null
  elapsed_seconds: number | null
}

export interface GradeResult {
  correct: boolean
  accentNote?: string   // set when normalized match but raw form differs
}
```

---

### `src/lib/diagnostics/scoring.ts` (utility, transform — NEW)

**Analog:** `src/lib/lessons/locking.ts` — pure function pattern, no imports, no DB, no side effects.

**File-level comment pattern** (locking.ts lines 1–20):
```typescript
/**
 * <description>
 *
 * Pure function — no imports, no side effects, no DB access.
 * Safe to import in tests without a database.
 */
```

**Core pattern** — each export is a standalone pure function testable with no setup:
```typescript
import type { DiagnosticQuestion, GradeResult } from './types'

export function normalizeFillin(raw: string): string {
  if (raw.trim() === '') return ''
  return raw.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function gradeAnswer(question: DiagnosticQuestion, submitted: string): GradeResult {
  // Blank guard — always incorrect, no leniency (Pitfall 6)
  if (submitted.trim() === '') return { correct: false }

  if (question.type === 'mc') {
    return { correct: submitted === question.correct_answer }
  }
  // fill_in: accent-insensitive (D-D03)
  const normSubmitted = normalizeFillin(submitted)
  const normCorrect = normalizeFillin(question.correct_answer)
  const correct = normSubmitted === normCorrect
  const accentNote =
    correct && submitted.trim().toLowerCase() !== question.correct_answer.toLowerCase()
      ? question.correct_answer
      : undefined
  return { correct, accentNote }
}

export function computeScore(results: GradeResult[]): number {
  if (results.length === 0) return 0
  return results.filter(r => r.correct).length / results.length
}

export function derivePlacement(score: number): 1 | 2 {
  return score >= 0.8 ? 2 : 1
}

export function derivePassFail(score: number): 'pass' | 'fail' {
  return score >= 0.8 ? 'pass' : 'fail'
}

export function drawQuestions<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
```

---

### `src/lib/diagnostics/gating.ts` (utility, transform — NEW)

**Analog:** `src/lib/lessons/locking.ts` — pure function pattern.

These functions take plain data arguments (no DB calls) and derive boolean/computed values:

```typescript
// All pure — no DB imports

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

export function deriveAllLessonsComplete(
  subComponentIds: string[],
  completedSubComponentIds: Set<string>
): boolean {
  return subComponentIds.length > 0 &&
    subComponentIds.every(id => completedSubComponentIds.has(id))
}
```

---

### `src/actions/diagnostic.ts` (service/Server Action, request-response — NEW)

**Analog:** `src/app/lessons/actions.ts` (lines 1–77) — exact pattern.

**Imports pattern** (analog lines 1–16):
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'  // NEW: needed for unlock write
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { computeScore, derivePlacement, derivePassFail, gradeAnswer, drawQuestions } from '@/lib/diagnostics/scoring'
import { computeCooldownUntil, isCooldownActive } from '@/lib/diagnostics/gating'
import type { DiagnosticQuestion } from '@/lib/diagnostics/types'
```

**Zod validation pattern** (analog lines 18–19):
```typescript
const StartDiagnosticSchema = z.object({
  levelId: z.string().uuid(),
  diagnosticType: z.enum(['placement', 'end_of_level']),
})

const SubmitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().max(500).trim(),
})
```

**Auth pattern** (analog lines 26–31):
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

**Admin client pattern** (for unlock writes — not in analog but from `src/lib/supabase/admin.ts`):
```typescript
// ONLY for writing profiles.unlocked_through_level_number and profiles.current_level_id
// Regular supabase (createClient()) cannot write these — RLS blocks authenticated role
const adminClient = createAdminClient()
await adminClient
  .from('profiles')
  .update({
    unlocked_through_level_number: newWatermark,
    current_level_id: newLevelId,
  })
  .eq('id', user.id)
```

**Idempotent upsert pattern** (analog lines 49–60):
```typescript
const { error } = await supabase
  .from('diagnostic_answers')
  .upsert(
    { attempt_id: parsed.data.attemptId, question_id: parsed.data.questionId, ... },
    { onConflict: 'attempt_id,question_id' }
  )
if (error) throw new Error('Failed to save answer')
```

**revalidatePath pattern** (analog lines 63–76):
```typescript
revalidatePath(`/diagnostic/placement`)
revalidatePath(`/diagnostic/end-of-level/${levelSlug}`)
revalidatePath('/dashboard')
revalidatePath(`/levels/${levelSlug}`)
```

---

### `src/app/dashboard/page.tsx` (component, request-response — MODIFY)

**Current file:** `src/app/dashboard/page.tsx` (lines 1–47)

**Existing auth guard pattern** (lines 10–17 — keep unchanged):
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login?next=/dashboard')
```

**Placement gate addition** — insert after existing profile fetch, before return:
```typescript
// Phase 4: placement gate — check for completed placement attempt
const { data: placementAttempt } = await supabase
  .from('diagnostic_attempts')
  .select('id, status')
  .eq('user_id', user.id)
  .eq('diagnostic_type', 'placement')
  .eq('status', 'completed')
  .maybeSingle()

if (!placementAttempt) {
  const { data: inProgress } = await supabase
    .from('diagnostic_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')
    .eq('status', 'in_progress')
    .maybeSingle()
  return <DiagnosticGate hasInProgress={!!inProgress} />
}
```

**Profile fetch extension** — extend existing select to include watermark:
```typescript
// Existing: .select('username')
// Extended:
const { data: profile } = await supabase
  .from('profiles')
  .select('username, unlocked_through_level_number')
  .eq('id', user.id)
  .single()
```

---

### `src/app/levels/[levelSlug]/page.tsx` (component, request-response — MODIFY)

**Current file:** `src/app/levels/[levelSlug]/page.tsx` (lines 1–159)

**Existing profile fetch** (lines 79–84 — extend):
```typescript
// Current:
const { data: profile } = await supabase
  .from('profiles')
  .select('current_level_id')
  .eq('id', user.id)
  .single()
```
Extend to: `.select('current_level_id, unlocked_through_level_number')`

**Existing deriveIsLevelLocked call** (lines 87–93 — extend with watermark arg):
```typescript
const isLocked = level
  ? deriveIsLevelLocked({
      levelId: level.id,
      levelNumber: level.level_number,
      currentLevelId: profile?.current_level_id ?? null,
      unlockedThroughLevelNumber: profile?.unlocked_through_level_number ?? null, // Phase 4
    })
  : false
```

**End-of-level CTA addition** — add after lesson grid, guarded per Pitfall 7:
```typescript
{/* End-of-level diagnostic CTA — only when: not locked AND all sub-components complete */}
{!isLocked && allSubComponentsComplete && (
  <div className="mt-8">
    <form action={startEndOfLevelDiagnostic}>
      <input type="hidden" name="levelId" value={level.id} />
      <button type="submit" className="...primary button classes...">
        Take the end-of-level diagnostic
      </button>
    </form>
  </div>
)}
```

---

### `src/app/diagnostic/placement/page.tsx` (component, request-response — NEW)

**Analog:** `src/app/levels/[levelSlug]/page.tsx` (lines 51–159) — Server Component with auth guard, two DB queries, conditional render.

**Imports pattern** (analog lines 14–18):
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { startPlacementDiagnostic, submitDiagnosticAnswer } from '@/actions/diagnostic'
import DiagnosticProgress from '@/components/diagnostic/DiagnosticProgress'
import DiagnosticQuestionCard from '@/components/diagnostic/DiagnosticQuestionCard'
import DiagnosticResult from '@/components/diagnostic/DiagnosticResult'
```

**Auth guard** (analog lines 60–67 — copy exactly):
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login?next=/diagnostic/placement')
```

**Two-query pattern** (analog lines 70–93 — content query + profile query):
```typescript
// Query 1: check for existing attempt (in_progress or completed)
const { data: attempt } = await supabase
  .from('diagnostic_attempts')
  .select('id, status, drawn_question_ids, score, correct_count, total_count')
  .eq('user_id', user.id)
  .eq('diagnostic_type', 'placement')
  .in('status', ['in_progress', 'completed'])
  .order('started_at', { ascending: false })
  .limit(1)
  .maybeSingle()

// Query 2: fetch questions for drawn set (OMIT correct_answer — Pitfall 1)
const { data: questions } = await supabase
  .from('diagnostic_questions')
  .select('id, question_text, type, options, lesson_tag')
  .in('id', attempt?.drawn_question_ids ?? [])
  .order('position')
```

**D-P02 guard** (redirect if completed placement attempt exists):
```typescript
if (attempt?.status === 'completed') redirect('/dashboard')
```

---

### `src/app/diagnostic/end-of-level/[levelSlug]/page.tsx` (component, request-response — NEW)

**Analog:** `src/app/levels/[levelSlug]/page.tsx` — same Server Component pattern with dynamic route param.

**Params pattern** (analog lines 54–57 — Next 15+ awaited params):
```typescript
export default async function EndOfLevelDiagnosticPage({
  params,
}: {
  params: Promise<{ levelSlug: string }>
}) {
  const { levelSlug } = await params
  // ... auth guard, then queries
```

Mirror placement page queries but scoped to `diagnostic_type = 'end_of_level'` and the specific `level_id`. Cooldown check belongs in the Server Action (not here), but the page reads `cooldown_until` from the last failed attempt to render the `DiagnosticResultFail` with live countdown if appropriate.

---

### `src/components/diagnostic/DiagnosticGate.tsx` (component, request-response — NEW)

**Analog:** `src/components/lessons/LevelCard.tsx` (lines 1–117) — pure presentational Server Component, no `'use client'`.

**Props interface pattern** (analog lines 18–36):
```typescript
interface DiagnosticGateProps {
  hasInProgress: boolean  // shows resume banner vs fresh start copy
}
```

**Card + guillemet pattern** (analog lines 47–101 and UI-SPEC §DiagnosticGate):
```typescript
// Container: centered, max-w-[480px], bg-surface-container-low
// Heading: guillemet-framed in font-heading text-primary (analog: LevelCard guillemet line 69-73)
<h1 className="font-heading text-[28px] font-semibold text-on-surface">
  <span className="text-primary" aria-hidden="true">« </span>
  Before you begin
  <span className="text-primary" aria-hidden="true"> »</span>
</h1>
```

**No dismiss affordance** — single primary CTA only, per D-P01/D-P02. No skip link. Link to `/diagnostic/placement`.

---

### `src/components/diagnostic/DiagnosticProgress.tsx` (component, request-response — NEW)

**Analog:** `src/components/lessons/SubComponentList.tsx` lines 75–93 — progress bar pattern.

**Progress bar pattern** (SubComponentList lines 75–93):
```typescript
// Thin 4px bar, bg-primary fill, bg-surface-container-high track
<div
  role="progressbar"
  aria-valuenow={current}
  aria-valuemin={0}
  aria-valuemax={total}
  aria-label="Diagnostic progress"
  className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden"
>
  <div
    className="h-full rounded-full bg-primary transition-all duration-300"
    style={{ width: `${(current / total) * 100}%` }}
  />
</div>
```

**Label pattern** (SubComponentList lines 78–80):
```typescript
// Left: question counter  |  Right: soft timer badge
<span className="font-label text-[13px] text-on-surface-variant">
  Question {current} of {total}
</span>
```

This is a Server-renderable component (pure presentational). Timer display comes from a prop (elapsed seconds formatted by parent), not a `setInterval` here.

---

### `src/components/diagnostic/DiagnosticQuestionCard.tsx` (component, request-response — NEW)

**Analog:** `src/components/lessons/SubComponentList.tsx` — orchestrator component that renders child items. This is the parent card for either `MCOptionButton` or `FillInInput`.

**Card container token pattern** (UI-SPEC §DiagnosticQuestionCard, LevelCard lines 48–52):
```typescript
// bg-surface-container-low border border-outline-variant rounded-[16px] p-6
// No shadow — tonal depth only (CLAUDE.md design rule 6)
```

**Question stem** (UI-SPEC):
```typescript
<p className="font-body text-[18px] text-on-surface leading-8">
  {question.question_text}
</p>
```

This component receives `question` (without `correct_answer`), `onAnswerSubmit`, and `submittedResult` props. It conditionally renders `MCOptionButton` list or `FillInInput` based on `question.type`. Not a client component itself — the interactive children carry `'use client'` where needed.

---

### `src/components/diagnostic/MCOptionButton.tsx` (component, event-driven — NEW)

**Analog:** `src/components/lessons/SubComponentItem.tsx` (lines 1–146) — `'use client'` interactive item with multi-state styling.

**Client directive** (analog line 1):
```typescript
'use client'
```

**Multi-state className pattern** (analog lines 54–62 — `isCompleted` drives class switching):
```typescript
// Mirror the state table from UI-SPEC §MCOptionButton:
const optionClass = [
  'w-full min-h-[44px] px-4 py-3 rounded-[8px] border-2 transition-colors',
  'text-left font-body text-[16px] text-on-surface',
  state === 'default'   ? 'bg-surface-container border-outline-variant' : '',
  state === 'selected'  ? 'bg-surface-container-low border-primary' : '',
  state === 'correct'   ? 'bg-tertiary/10 border-tertiary' : '',
  state === 'incorrect' ? 'bg-error/10 border-error' : '',
  state === 'disabled'  ? 'bg-surface-container border-outline-variant opacity-60 cursor-not-allowed' : '',
].filter(Boolean).join(' ')
```

**Icon pattern** (analog lines 64–97 — SVG icons inline; for Phase 4 use Lucide per UI-SPEC):
```typescript
import { Check, X } from 'lucide-react'
// Check (16px, text-tertiary) on correct; X (16px, text-error) on incorrect
// aria-hidden="true" on icons — result conveyed via text
```

**aria-pressed pattern** (analog line 52):
```typescript
// Options: use role="radio" in a role="radiogroup", or styled buttons with aria-pressed
// Prefer role="radio" within radiogroup for native semantics
```

---

### `src/components/diagnostic/FillInInput.tsx` (component, event-driven — NEW)

**Analog:** `src/components/lessons/SubComponentItem.tsx` — `'use client'` component with state-driven border styling.

**Client directive** (analog line 1):
```typescript
'use client'
```

**Input token pattern** (UI-SPEC §FillInInput, inherits LoginForm pattern):
```typescript
// Base: border border-outline rounded px-3 py-2 bg-surface-container-low
// Focus: focus:outline-none focus:border-b-[3px] focus:border-primary transition-all
// Correct post-submit: border-tertiary border-b-[3px]
// Incorrect post-submit: border-error border-b-[3px]
// min-h-[44px] for touch target (UI-SPEC §Spacing — Exceptions)
```

**Soft accent note pattern** (UI-SPEC §FillInInput):
```typescript
{result?.accentNote && (
  <p
    className="font-label text-[13px] text-secondary mt-1"
    aria-describedby="fill-in-input"  // associate with input via aria-describedby
  >
    Correct — watch the accents: {result.accentNote}, not {submittedValue}
  </p>
)}
```

**Error/alert pattern** (SubComponentList line 97–99):
```typescript
// role="alert" for error messages (matches LoginForm + SubComponentList pattern)
{saveError && (
  <p className="font-label text-[13px] text-error" role="alert">
    {saveError}
  </p>
)}
```

---

### `src/components/diagnostic/DiagnosticResult.tsx` (component, request-response — NEW)

**Analog:** `src/components/lessons/SubComponentList.tsx` lines 119–129 — "all done" completion block pattern.

**Guillemet heading pattern** (LevelCard lines 68–73, UI-SPEC §DiagnosticResult):
```typescript
// Placement result heading: « French 1 » or « French 2 »
<h1 className="font-heading text-[28px] font-semibold text-on-surface">
  <span className="text-primary font-heading" aria-hidden="true">« </span>
  {levelName}
  <span className="text-primary font-heading" aria-hidden="true"> »</span>
</h1>
```

**Completion block token pattern** (SubComponentList lines 121–129):
```typescript
// Container: bg-surface-container-low rounded-[16px] p-8 border border-outline-variant
// No raw percentage shown (D-P05) — encouraging message only
```

**Primary CTA button pattern** — consistent across all diagnostic screens:
```typescript
// bg-primary text-white (CLAUDE.md rule 4: primary button fill = #a03e40 with white text)
// hover:bg-primary/90, rounded-[8px], px-6 py-3, font-label font-semibold
```

---

### `src/components/diagnostic/DiagnosticResultFail.tsx` (component, request-response — NEW)

**Analog:** `src/components/lessons/SubComponentList.tsx` — orchestrator with conditional sections.

**Score line** (UI-SPEC §DiagnosticResultFail):
```typescript
// "You got {N} of 10 right." — font-label text-[13px] text-on-surface-variant
// No percentage (D-P05 extended to fail flow — correct count only)
```

**Weak-area review section** (UI-SPEC §DiagnosticResultFail, guillemet heading):
```typescript
<h2 className="font-heading text-[18px] font-semibold text-on-surface">
  <span className="text-primary" aria-hidden="true">« </span>
  Review these topics
  <span className="text-primary" aria-hidden="true"> »</span>
</h2>
<ul>
  {weakTopicLessons.map(lesson => (
    <li key={lesson.id}>
      <Link
        href={`/levels/${lesson.levelSlug}/lessons/${lesson.id}`}
        className="font-body text-[16px] text-primary hover:underline"
      >
        {lesson.title}
      </Link>
    </li>
  ))}
</ul>
```

**Cooldown block** (UI-SPEC §DiagnosticResultFail):
```typescript
// bg-surface-container border border-outline-variant rounded-[8px] p-6
// Contains CooldownCountdown client component + retry button
// Retry button: disabled when cooldown active (opacity-40 cursor-not-allowed)
// Retry button: enabled state = standard primary button
```

---

### `src/components/diagnostic/CooldownCountdown.tsx` (component, event-driven — NEW)

**No direct analog** — first timer/interval component in the codebase.

**Client directive required** (`'use client'` — uses `setInterval`):
```typescript
'use client'

import { useState, useEffect } from 'react'
import { formatCooldownRemaining, isCooldownActive } from '@/lib/diagnostics/gating'

interface CooldownCountdownProps {
  cooldownUntil: string   // ISO timestamp from DB
  onExpire: () => void    // called when countdown reaches 0 (re-enables retry button)
}

export default function CooldownCountdown({ cooldownUntil, onExpire }: CooldownCountdownProps) {
  const [remaining, setRemaining] = useState(
    formatCooldownRemaining(new Date(cooldownUntil))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const until = new Date(cooldownUntil)
      if (!isCooldownActive(until)) {
        clearInterval(interval)
        setRemaining('')
        onExpire()
        return
      }
      setRemaining(formatCooldownRemaining(until))
    }, 60_000)   // update every minute (no seconds shown per UI-SPEC)
    return () => clearInterval(interval)
  }, [cooldownUntil, onExpire])

  // aria-live="polite" — screen readers announce when timer reaches 0 (UI-SPEC §Accessibility)
  return (
    <span aria-live="polite" className="font-heading text-[28px] text-on-surface">
      {remaining}
    </span>
  )
}
```

---

### `__tests__/diagnostic/scoring.test.ts` (test, transform — NEW)

**Analog:** `__tests__/lessons/level.test.ts` (lines 1–37) — pure-function test, no mocks, no Supabase.

**File header pattern** (level.test.ts lines 1–7):
```typescript
// DIAG-01: scoring pure functions — normalizeFillin, gradeAnswer, computeScore,
//           derivePlacement, derivePassFail, drawQuestions
//
// Pure-function tests — no mocks, no Supabase client.

import { normalizeFillin, gradeAnswer, computeScore, derivePlacement, derivePassFail, drawQuestions } from '@/lib/diagnostics/scoring'
```

**Test describe + case pattern** (level.test.ts lines 10–37):
```typescript
describe('normalizeFillin', () => {
  test('strips accents: café → cafe', () => { ... })
  test('lowercases', () => { ... })
  test('trims whitespace', () => { ... })
  test('blank input returns empty string', () => { ... })
})

describe('gradeAnswer — fill_in', () => {
  test('café == cafe == Cafe all correct (D-D03)', () => { ... })
  test('blank submission always incorrect (Pitfall 6)', () => { ... })
  test('returns accentNote when normalized match but raw differs', () => { ... })
  test('exact match — no accentNote', () => { ... })
})

describe('gradeAnswer — mc', () => {
  test('correct when submitted === correct_answer', () => { ... })
  test('incorrect when submitted !== correct_answer', () => { ... })
})
```

---

### `__tests__/diagnostic/gating.test.ts` (test, transform — NEW)

**Analog:** `__tests__/lessons/level.test.ts` — pure-function test pattern.

```typescript
// DIAG-02: gating pure functions — computeCooldownUntil, isCooldownActive,
//           formatCooldownRemaining, deriveAllLessonsComplete

import { computeCooldownUntil, isCooldownActive, formatCooldownRemaining, deriveAllLessonsComplete } from '@/lib/diagnostics/gating'
```

---

### `__tests__/diagnostic/actions.test.ts` (test, request-response — NEW)

**Analog:** `__tests__/lessons/actions.test.ts` (lines 1–152) — exact mock pattern for Server Actions.

**Mock setup pattern** (analog lines 1–78 — copy structure verbatim):
```typescript
// Mock next/navigation
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (url: string) => { mockRedirect(url); throw new Error(`NEXT_REDIRECT:${url}`) },
}))

// Mock next/cache
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({ revalidatePath: (path: string) => mockRevalidatePath(path) }))
```

**Admin client mock** (new — not in analog, needed for unlock tests):
```typescript
// Mock admin client separately from server client — they are different modules
const mockAdminUpdate = jest.fn()
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      update: mockAdminUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  })),
}))
```

**Security contract test pattern** (analog lines 132–151):
```typescript
test('never accepts user_id from caller — resolves via getUser()', async () => { ... })
test('uses admin client (not server client) for profile unlock write', async () => {
  // Assert createAdminClient() was called, NOT createClient() for the profile update
  expect(mockAdminUpdate).toHaveBeenCalled()
})
test('rejects when unauthenticated', async () => {
  mockGetUserResult = { data: { user: null }, error: null }
  await expect(submitDiagnosticAnswer({ ... })).rejects.toThrow('NEXT_REDIRECT:/login')
})
```

**Dynamic import pattern** (analog lines 84, 101, 111 — import inside each test for mock hoisting):
```typescript
const { submitDiagnosticAnswer } = await import('@/actions/diagnostic')
```

---

## Shared Patterns

### Authentication Guard
**Source:** `src/app/levels/[levelSlug]/page.tsx` lines 60–67, `src/app/lessons/actions.ts` lines 26–31
**Apply to:** All new Server Components and Server Actions

Server Components:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login?next=<current-path>')
```

Server Actions:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Admin Client for Unlock Writes
**Source:** `src/lib/supabase/admin.ts` (full file, 10 lines)
**Apply to:** `src/actions/diagnostic.ts` — all writes to `profiles.unlocked_through_level_number` and `profiles.current_level_id`

```typescript
// NEVER import from client components
// NEVER use createClient() for these writes — RLS blocks authenticated role
import { createAdminClient } from '@/lib/supabase/admin'
const adminClient = createAdminClient()
```

### Zod Input Validation
**Source:** `src/app/lessons/actions.ts` lines 18–23
**Apply to:** All Server Actions in `src/actions/diagnostic.ts`

```typescript
const Schema = z.object({ ... })
const parsed = Schema.safeParse(raw)
if (!parsed.success) throw new Error('Invalid input')
// Use parsed.data for all subsequent DB calls (never raw input)
```

### Design Token Discipline
**Source:** `src/components/lessons/LevelCard.tsx` lines 47–101, `src/components/lessons/SubComponentItem.tsx` lines 44–133
**Apply to:** All components in `src/components/diagnostic/`

Rules extracted from analogs:
- Cards: `border border-outline-variant rounded-[16px] p-6 bg-surface-container-low` (no shadow)
- Labels: `font-label text-[13px] text-on-surface-variant`
- Body text: `font-body text-[16px] text-on-surface`
- Headings: `font-heading text-[28px] font-semibold text-on-surface`
- Primary button: `bg-primary text-white` (CLAUDE.md rule 4)
- Green (`text-tertiary`/`bg-tertiary`): correct-answer feedback ONLY
- Error: `text-error` / `bg-error/10` — wrong-answer states and error messages
- Guillemet active marker: `font-heading text-primary` with `aria-hidden="true"`

### RLS Policy Structure
**Source:** `supabase/migrations/20260622_phase3_lessons.sql` lines 110–130
**Apply to:** `diagnostic_attempts` and `diagnostic_answers` tables in Phase 4 migration

Use `(select auth.uid())` subquery form — not `auth.uid()` directly — for stable per-statement evaluation (not per-row). Mirror sub_component_progress pattern exactly.

### Error Display
**Source:** `src/components/lessons/SubComponentList.tsx` lines 96–99
**Apply to:** All interactive diagnostic client components

```typescript
{error && (
  <p className="font-label text-[13px] text-error" role="alert">
    {error}
  </p>
)}
```

### Progress Bar
**Source:** `src/components/lessons/SubComponentList.tsx` lines 75–93
**Apply to:** `src/components/diagnostic/DiagnosticProgress.tsx`

4px height, `bg-primary` fill, `bg-surface-container-high` track, `role="progressbar"` with `aria-valuenow`/`aria-valuemax`/`aria-label`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/diagnostic/CooldownCountdown.tsx` | component | event-driven | No timer/interval client component exists in the codebase. First `setInterval` usage. Pattern sourced from RESEARCH.md §Code Examples (pure `useEffect` + `setInterval`). |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/app/`, `src/components/`, `__tests__/`, `supabase/migrations/`
**Files read:** 12 source files
**Pattern extraction date:** 2026-06-22
