# Phase 6: AI Writing Checker — Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 9 new/modified files
**Analogs found:** 8 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/practice/WrittenCard.tsx` | component | request-response | `src/components/practice/FillInPracticeCard.tsx` | exact |
| `src/app/api/check-writing/route.ts` | route | request-response | `src/app/lessons/actions.ts` (Server Action) | role-match |
| `src/lib/practice/types.ts` (modify) | model | — | `src/lib/practice/types.ts` | exact (self) |
| `src/lib/practice/schema.ts` (modify) | model | — | `src/lib/practice/schema.ts` | exact (self) |
| `src/components/practice/PracticeCardRouter.tsx` (modify) | component | — | `src/components/practice/PracticeCardRouter.tsx` | exact (self) |
| `src/components/lessons/SubComponentItem.tsx` (modify) | component | — | `src/components/lessons/SubComponentItem.tsx` | exact (self) |
| `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` (modify) | component | CRUD | `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` | exact (self) |
| `supabase/migrations/20260624_phase6_writing.sql` | migration | CRUD | `supabase/migrations/20260622_phase3_lessons.sql` | exact |
| `src/__tests__/practice/WrittenCard.test.tsx` | test | — | `src/__tests__/practice/schema.test.ts` | role-match |

---

## Pattern Assignments

### `src/components/practice/WrittenCard.tsx` (component, request-response)

**Analog:** `src/components/practice/FillInPracticeCard.tsx`

**Imports pattern** (lines 1–21):
```typescript
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FillInProblem, ConjugationSingleProblem } from '@/lib/practice/types'
// WrittenCard will import:
// import { markSubComponentComplete } from '@/app/lessons/actions'
// import type { WrittenProblem } from '@/lib/practice/types'
```

**Props interface pattern** (lines 22–28):
```typescript
interface FillInPracticeCardProps {
  problem: FillInProblem | ConjugationSingleProblem
  id: string
  isCompleted: boolean
  onComplete: (id: string) => void
}
// WrittenCard adds: initialFeedback?: string | null
```

**isCompleted-on-mount guard pattern** (lines 35–49):
```typescript
// Initialize state from isCompleted prop — prevents blank card on revisit (Pitfall 6 guard)
const [inputValue, setInputValue] = useState<string>(isCompleted ? problem.correctAnswer : '')
const [gradeResult, setGradeResult] = useState<GradeResult | null>(
  isCompleted ? { correct: true } : null
)
// Keep state in sync when isCompleted changes (e.g. server state loads late)
useEffect(() => {
  if (isCompleted && gradeResult === null) {
    setGradeResult({ correct: true })
  }
}, [isCompleted, gradeResult])
```
WrittenCard mirrors this: `useState<string | null>(initialFeedback ?? null)` and `useState(isCompleted)`.

**useCallback submit pattern** (lines 51–58):
```typescript
const handleSubmit = useCallback(() => {
  if (inputValue.trim() === '') return
  const result = gradeFillin(inputValue, problem.correctAnswer)
  setGradeResult(result)
  if (result.correct) {
    onComplete(id)
  }
}, [inputValue, problem.correctAnswer, onComplete, id])
```
WrittenCard replaces `gradeFillin` with a `fetch('/api/check-writing', ...)` call, wraps in try/catch, sets loading state (D-04), and calls `onComplete` in `finally` (D-05/D-06/D-07).

**Card container + prompt pattern** (lines 84–88):
```typescript
<div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
  <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>
```
WrittenCard uses identical container. Prompt text rendered the same way.

**Primary button pattern** (lines 104–114):
```typescript
{gradeResult === null && (
  <button
    type="button"
    disabled={!submitEnabled}
    onClick={handleSubmit}
    className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Submit answer
  </button>
)}
```
WrittenCard button text = "Check my writing" (D-03). Adds spinner during `loading` state (D-04). Button disabled when `text.trim() === ''` or `loading` or `done`.

**Textarea styling — reference: `src/components/diagnostic/FillInInput.tsx`** (lines 56–61):
```typescript
className={[
  'w-full min-h-[44px] rounded px-3 py-2 font-body text-[16px]',
  'bg-surface-container-low text-on-surface border outline-none',
  borderClasses,  // focus:border-b-[3px] focus:border-primary
].join(' ')}
```
Textarea copies these tokens. Add `resize-none` and use `onInput` for auto-resize (D-01). Disabled when `loading || done` (D-04/D-08).

**Feedback display — warm neutral, NOT green** (from RESEARCH.md Pattern 8):
```tsx
<div className="mt-4 rounded-lg bg-surface-container border border-outline-variant px-4 py-3">
  <p className="font-body text-[16px] text-on-surface">{feedback}</p>
</div>
```
Green (`text-tertiary`, `border-tertiary`) is forbidden here — reserved for correct-answer states only (CLAUDE.md rule 3).

---

### `src/app/api/check-writing/route.ts` (route, request-response)

**Analog:** `src/app/lessons/actions.ts` (closest existing auth+DB pattern; no existing API route to copy from)

**Auth pattern** (actions.ts lines 26–31):
```typescript
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) redirect('/login')
// API route uses: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
Rule: always `getUser()`, never `getSession()`. `user_id` derived server-side, NEVER from request body.

**Zod validation pattern** (actions.ts lines 18–23):
```typescript
const SubComponentIdSchema = z.string().uuid()

const parsed = SubComponentIdSchema.safeParse(subComponentId)
if (!parsed.success) throw new Error('Invalid sub-component ID')
```
API route extends this: `RequestSchema = z.object({ subComponentId: z.string().uuid(), text: z.string().min(1).max(4000) })` with `safeParse` + `NextResponse.json({ error: 'Invalid request' }, { status: 400 })`.

**Supabase parameterized query pattern** (actions.ts lines 34–38, 49–60):
```typescript
// Verify existence before write — prevent phantom rows
const { data: sc } = await supabase
  .from('sub_components')
  .select('id, lesson_id')
  .eq('id', parsed.data)
  .single()

// Idempotent upsert on composite PK
const { error } = await supabase
  .from('sub_component_progress')
  .upsert(
    { user_id: user.id, sub_component_id: parsed.data, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,sub_component_id' }
  )
```
API route rate-limit query:
```typescript
const today = new Date(); today.setUTCHours(0, 0, 0, 0)
const { count } = await supabase
  .from('writing_submissions')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', today.toISOString())
```
Then insert with `supabase.from('writing_submissions').insert({ ... })`.

**createClient() import** (server.ts lines 1–27):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { ... } } }
  )
}
```
API route imports `createClient` from `@/lib/supabase/server` — same factory as the Server Action.

**Next.js App Router route shape** (no existing analog — from RESEARCH.md Pattern 5):
```typescript
import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) { ... }
```
File must live at `src/app/api/check-writing/route.ts`. Directory does not exist yet — create in Wave 0.

**Anthropic SDK pattern** (from RESEARCH.md Pattern 4):
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Module-level const — byte-for-byte identical every call
const GRADING_SYSTEM_PROMPT = `...`  // Must exceed 4,096 tokens for Haiku cache hits

try {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 80,
    system: [{ type: 'text', text: GRADING_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: text }],
  })
  feedbackText = response.content[0]?.type === 'text' ? response.content[0].text : null
} catch (err) {
  console.error('Anthropic API error', err)
  // feedbackText stays null — graceful fallback (D-06)
}
```
No `anthropic-beta` header required (SDK 0.106.0+, caching is GA).

---

### `src/lib/practice/types.ts` (modify — add WrittenProblem)

**Analog:** `src/lib/practice/types.ts` (self)

**Discriminated union extension pattern** (lines 45–50):
```typescript
export type ProblemData =
  | MCProblem
  | FillInProblem
  | ConjugationTableProblem
  | ConjugationSingleProblem
  | MatchingProblem
  // Add: | WrittenProblem
```

**New type to add** (mirrors existing type shapes):
```typescript
export type WrittenProblem = {
  type: 'written'
  prompt: string   // Writing task instruction shown to the student
}
```
Minimal fields — `type` discriminant + `prompt`. No `correctAnswer` (AI grades open-ended text).

---

### `src/lib/practice/schema.ts` (modify — add WrittenSchema)

**Analog:** `src/lib/practice/schema.ts` (self)

**Schema addition pattern** (lines 10–55):
```typescript
// Each variant: z.object({ type: z.literal('...'), ... })
const MatchingSchema = z.object({
  type: z.literal('matching'),
  prompt: z.string(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2).max(6),
})

// Add WrittenSchema alongside:
const WrittenSchema = z.object({
  type: z.literal('written'),
  prompt: z.string(),
})

// Add to discriminatedUnion array:
export const ProblemDataSchema = z.discriminatedUnion('type', [
  MCSchema, FillInSchema, ConjTableSchema, ConjSingleSchema, MatchingSchema,
  WrittenSchema,  // add
])
```
`parseProblemContent()` function is unchanged — already handles all union members via `ProblemDataSchema.parse()`.

---

### `src/components/practice/PracticeCardRouter.tsx` (modify — add 'written' case)

**Analog:** `src/components/practice/PracticeCardRouter.tsx` (self)

**Import + case addition pattern** (lines 13–17, 74–82):
```typescript
// Add import alongside existing card imports:
import WrittenCard from '@/components/practice/WrittenCard'

// Add case before default:
case 'written':
  return (
    <WrittenCard
      problem={problemData}
      subComponentId={subComponentId}
      isCompleted={isCompleted}
      onComplete={onComplete}
    />
  )

default:
  // TypeScript exhaustiveness: unreachable when ProblemData union is complete
  return null
```
Note: `WrittenCard` also needs `initialFeedback` prop. The router receives it from `SubComponentItem` which gets it from the lesson page query. Add `initialFeedback?: string | null` to `PracticeCardRouterProps` and pass through.

---

### `src/components/lessons/SubComponentItem.tsx` (modify — add writing branch)

**Analog:** `src/components/lessons/SubComponentItem.tsx` (self)

**kind branch pattern** (lines 59–95 — practice spacer; lines 191–214 — practice panel):
```typescript
// Toggle spacer: extend the practice-branch condition to include writing
{kind === 'practice' ? (    // change to: kind === 'practice' || kind === 'writing' ?
  <div role="presentation" tabIndex={-1} ... >
    {isCompleted && <svg ...checkmark />}
  </div>
) : (
  <button type="button" onClick={() => onComplete(id)} ... />
)}
```

**Action label** (lines 182–185):
```typescript
{kind === 'practice'
  ? isCompleted ? 'Done' : 'In progress'
  : isCompleted ? 'Done' : 'Mark complete'}
// Change to:
{(kind === 'practice' || kind === 'writing')
  ? isCompleted ? 'Done' : 'In progress'
  : isCompleted ? 'Done' : 'Mark complete'}
```

**Content block exclusion** (line 191):
```typescript
{content && kind !== 'practice' && (   // change to: kind !== 'practice' && kind !== 'writing'
```

**Writing panel — mirrors practice panel** (lines 199–214):
```typescript
{/* Add writing panel after practice panel */}
{kind === 'writing' && (
  <div className="mt-4 sm:ml-[60px]" aria-label={`Writing exercise: ${title}`}>
    {problemData ? (
      <PracticeCardRouter
        problemData={problemData}
        subComponentId={id}
        isCompleted={isCompleted}
        onComplete={onComplete}
        initialFeedback={initialFeedback}   // new prop from lesson page
      />
    ) : (
      <p className="font-body text-[16px] text-on-surface-variant">
        This writing exercise isn&apos;t available yet.
      </p>
    )}
  </div>
)}
```
`SubComponentItemInternalProps` must add `initialFeedback?: string | null`.

---

### `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` (modify — add writing_submissions query)

**Analog:** `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` (self)

**Two-query pattern to extend** (lines 68–107):
```typescript
// Query 1 (content): already fetches sub_components
// Query 2 (user data): currently fetches sub_component_progress only

// Add Query 3 (writing feedback): fetch stored feedback for completed writing sub-components
const writingIds = subComponents
  .filter((sc) => sc.kind === 'writing')
  .map((sc) => sc.id)

const { data: writingRows } =
  writingIds.length > 0
    ? await supabase
        .from('writing_submissions')
        .select('sub_component_id, feedback_text')
        .eq('user_id', user.id)
        .in('sub_component_id', writingIds)
    : { data: [] }

const feedbackMap = Object.fromEntries(
  (writingRows ?? []).map((r) => [r.sub_component_id, r.feedback_text])
)
```

**SubComponentRow interface extension** (lines 29–37):
```typescript
interface SubComponentRow {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  position: number
  problemData?: ProblemData | null
  initialFeedback?: string | null   // add: loaded from writing_submissions on revisit
}
```

**parseProblemContent call extension** (lines 90–93):
```typescript
const subComponents = (lesson.sub_components ?? []).map((sc) => ({
  ...sc,
  problemData: sc.kind === 'practice' ? parseProblemContent(sc.content) : null,
  // Add for writing kind:
  problemData: (sc.kind === 'practice' || sc.kind === 'writing') ? parseProblemContent(sc.content) : null,
  initialFeedback: sc.kind === 'writing' ? (feedbackMap[sc.id] ?? null) : null,
}))
```

---

### `supabase/migrations/20260624_phase6_writing.sql` (new migration)

**Analog:** `supabase/migrations/20260622_phase3_lessons.sql`

**Table + index + grant + RLS pattern** (phase3 lines 64–82):
```sql
create table public.sub_components (
  id          uuid        not null primary key default gen_random_uuid(),
  lesson_id   uuid        not null references public.lessons on delete cascade,
  ...
  created_at  timestamptz not null default now()
);

create index idx_sub_components_lesson_id on public.sub_components (lesson_id);

grant select on public.sub_components to authenticated;

alter table public.sub_components enable row level security;

create policy "Authenticated users can read all sub-components"
  on public.sub_components for select to authenticated using (true);
```

**User-scoped RLS pattern** (phase3 — sub_component_progress section):
```sql
create policy "Students can read own progress"
  on public.sub_component_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own progress"
  on public.sub_component_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
```
`writing_submissions` uses identical select + insert policies scoped to `auth.uid()`. Add a unique index on `(user_id, sub_component_id)` to enforce D-12 (one-shot).

---

### `src/__tests__/practice/WrittenCard.test.tsx` (new test file)

**Analog:** `src/__tests__/practice/schema.test.ts`

**Test file structure pattern** (schema.test.ts lines 1–8):
```typescript
/**
 * Wave 0 tests for parseProblemContent() Zod validation.
 * Covers PROB-05.
 */
import { parseProblemContent } from '@/lib/practice/schema'

describe('parseProblemContent', () => {
  it('null input → null (no throw)', () => {
    expect(parseProblemContent(null)).toBeNull()
  })
```
WrittenCard test uses `@testing-library/react` render pattern. Mock `fetch` for API call tests. Mock `markSubComponentComplete` (Server Action). Cover: render with prompt, submit triggers fetch, feedback renders, fallback on error, rate-limit message, disabled textarea when done.

**schema.test.ts — 'written' case to add** (after line 115):
```typescript
it('valid written JSON → returns typed WrittenProblem with type === "written"', () => {
  const raw = JSON.stringify({
    type: 'written',
    prompt: 'Write 2–3 sentences describing your daily routine in French.',
  })
  const result = parseProblemContent(raw)
  expect(result).not.toBeNull()
  expect(result!.type).toBe('written')
  if (result?.type === 'written') {
    expect(result.prompt).toBeTruthy()
  }
})
```

---

## Shared Patterns

### Authentication (getUser, never getSession)
**Source:** `src/app/lessons/actions.ts` lines 26–31
**Apply to:** `src/app/api/check-writing/route.ts`
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// API route: 401 response. Server Action: redirect('/login').
```

### Zod input validation
**Source:** `src/app/lessons/actions.ts` lines 18–23 and `src/lib/practice/schema.ts` lines 49–55
**Apply to:** `src/app/api/check-writing/route.ts`, `src/lib/practice/schema.ts` (WrittenSchema)
```typescript
const parsed = Schema.safeParse(input)
if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
```

### Supabase server client factory
**Source:** `src/lib/supabase/server.ts` lines 1–27
**Apply to:** `src/app/api/check-writing/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```
Use `createClient()` (not `createAdminClient()`) — RLS handles user-scoped isolation.

### Card container design tokens
**Source:** `src/components/practice/FillInPracticeCard.tsx` line 85
**Apply to:** `src/components/practice/WrittenCard.tsx`
```typescript
<div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
```

### Primary button tokens
**Source:** `src/components/practice/FillInPracticeCard.tsx` lines 107–113
**Apply to:** `src/components/practice/WrittenCard.tsx`
```typescript
className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
```

### Input focus state (coral bottom border)
**Source:** `src/components/diagnostic/FillInInput.tsx` lines 34, 56–60
**Apply to:** `src/components/practice/WrittenCard.tsx` textarea
```typescript
'border-outline focus:border-b-[3px] focus:border-primary'
// bg-surface-container-low text-on-surface border outline-none
```

### RLS policy structure (user-scoped select + insert)
**Source:** `supabase/migrations/20260622_phase3_lessons.sql` (sub_component_progress section)
**Apply to:** `supabase/migrations/20260624_phase6_writing.sql`
```sql
using ((select auth.uid()) = user_id);
with check ((select auth.uid()) = user_id);
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/api/check-writing/route.ts` (full route shape) | route | request-response | No existing Next.js App Router API route in `src/app/api/` — directory does not exist yet. Server Action (`actions.ts`) provides auth/DB patterns but not the `NextRequest`/`NextResponse` shape. Use RESEARCH.md Pattern 5 for route skeleton. |

---

## Metadata

**Analog search scope:** `src/components/practice/`, `src/components/lessons/`, `src/components/diagnostic/`, `src/lib/practice/`, `src/lib/supabase/`, `src/app/lessons/`, `src/app/levels/`, `src/__tests__/practice/`, `supabase/migrations/`
**Files scanned:** 18
**Pattern extraction date:** 2026-06-24
