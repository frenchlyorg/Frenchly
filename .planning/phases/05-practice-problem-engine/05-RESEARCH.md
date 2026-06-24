# Phase 5: Practice Problem Engine — Research

**Researched:** 2026-06-23
**Domain:** Client-side graded interactive problems embedded in Next.js lesson sub-components
**Confidence:** HIGH

---

## Summary

Phase 5 delivers four auto-graded problem types (multiple choice, fill-in-the-blank, conjugation table, matching) rendered inside `kind='practice'` sub-components. All grading is client-side TypeScript — no network call, no AI, no cost. The problem data model is the central decision: store structured JSON in the existing `content` column (Option A) or add a `practice_problems` table (Option B). Research concludes Option A (JSON in `content`) is the correct choice for this phase. The full rationale is in the Data Model section.

The codebase already provides `MCOptionButton`, `FillInInput`, and `markSubComponentComplete` — all reusable directly. `normalizeFillin` in `src/lib/diagnostics/scoring.ts` already implements accent-insensitive normalization via `String.prototype.normalize('NFD')` and diacritic stripping; the practice grading logic should import and re-use this function rather than re-implementing it. `SubComponentItem` currently renders `kind='practice'` as title-only — the phase adds a router below the title row.

**Primary recommendation:** Store practice problem data as JSON in `sub_components.content` with a typed discriminated union. Add `practice_problems_schema` as a Zod schema in `src/lib/practice/` to parse and validate at query time. No new table, no new RLS policy, no migration for Option A — a `ALTER TABLE` to add a `problem_type` column is the only schema change needed to make the content column's role unambiguous.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Two conjugation sub-types: full table (6-form, any submission completes) and single blank (reuses FillInInput, correct-only completes).
- **D-02:** Explainer sub-components for conjugation lessons MUST include the full paradigm table in their markdown content.
- **D-03:** Matching uses click-to-pair interaction.
- **D-04:** Matching feedback appears all at once after "Check" button press.
- **D-05:** "Check" in matching auto-completes the sub-component regardless of score.
- **D-06:** Auto-complete rules by type: MC=correct answer; fill-in/single conjugation=correct answer; conjugation table=any submission; matching=any submission.
- **D-07:** Incorrect MC and fill-in answers do NOT auto-complete — retry until correct.
- **D-08:** MC and fill-in reset clean on retry — no pre-filled wrong answer.
- **D-09:** Conjugation table and matching: single submission, no retry.

### Claude's Discretion
None specified — all major decisions were locked during discuss-phase.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROB-01 | Multiple choice problems checked instantly by code (no AI, no cost) | MCPracticeCard wraps existing MCOptionButton; grading is a simple string equality check client-side |
| PROB-02 | Fill-in-the-blank problems checked instantly by code | FillInPracticeCard wraps existing FillInInput; grading reuses `normalizeFillin` from `src/lib/diagnostics/scoring.ts` |
| PROB-03 | Conjugation problems checked instantly by code | ConjugationTableCard (6-form) and single-blank via FillInPracticeCard; same normalizeFillin grading |
| PROB-04 | Matching problems checked instantly by code | MatchingCard compares student pairs to answer pairs client-side using index/key lookup |
| PROB-05 | All auto-gradable problems show immediate right/wrong feedback with correct answer | All four card components show per-item correct/incorrect state; incorrect states reveal correct answer per UI-SPEC |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Problem grading logic | Browser / Client | — | Pure function, no secrets, no network needed; instant feedback requirement means it must be synchronous client-side |
| Problem data storage | Database / Storage | — | `sub_components.content` column already exists; JSON stored there at seed/authoring time |
| Problem data parsing | Frontend Server (SSR) | Browser / Client | Parsed on the server during the lesson page query; the typed shape is passed as props to client components |
| Progress persistence | API / Backend | — | `markSubComponentComplete` Server Action (already exists); practice completion calls it via `onComplete` callback |
| Interactive UI state | Browser / Client | — | All card components are `'use client'` — selection state, retry state, completed state are React state |
| SubComponentItem routing | Browser / Client | — | `kind` prop already available; new branch added for `kind='practice'` renders PracticeCardRouter |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (already installed) | 19.x | Client component state for problem cards | Project standard |
| TypeScript (already installed) | 5.x | Discriminated union types for problem data | Project standard |
| Zod (already installed) | 3.x | Runtime validation of JSON problem data at parse time | Already used for Server Action input validation; same pattern |
| Lucide React (already installed) | latest | Check/X icons in correct/incorrect states | Already used by MCOptionButton |

[ASSUMED] No new packages are required for this phase. All necessary libraries are already installed.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `String.prototype.normalize('NFD')` (built-in) | — | Unicode normalization for accent stripping | Already used in `normalizeFillin`; re-use directly |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON in `content` column | New `practice_problems` table | Table is safer long-term but adds migration, RLS policy, join query, and seeding complexity for no Phase 5 benefit |
| Re-using `normalizeFillin` from scoring.ts | New copy in lib/practice/ | Duplication; function is already correct and tested |

**Installation:** No new packages needed.

---

## Package Legitimacy Audit

No new external packages are installed in this phase. All dependencies (React, TypeScript, Zod, Lucide React, Jest, ts-jest) are already present in `package.json` and were vetted in prior phases.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Lesson page (Server Component)
  └── queries sub_components WHERE lesson_id = X
        └── for kind='practice': JSON.parse(content) → validated by Zod schema
              └── typed ProblemData passed as prop to SubComponentList
                    └── SubComponentItem (client component)
                          ├── kind='explainer' → LessonMarkdown (existing)
                          ├── kind='practice' → PracticeCardRouter (NEW)
                          │     ├── type='mc'                → MCPracticeCard
                          │     ├── type='fill-in'           → FillInPracticeCard
                          │     ├── type='conjugation-table' → ConjugationTableCard
                          │     ├── type='conjugation-single'→ FillInPracticeCard
                          │     └── type='matching'          → MatchingCard
                          │           └── on correct / on Check
                          │                 └── onComplete(id) → markSubComponentComplete (Server Action)
                          └── kind='writing' → placeholder (existing)
```

Data flow:
- Entry: lesson page server query
- Decision point: `kind` field routes to correct renderer
- Decision point: `type` field in parsed JSON routes to correct card component
- External boundary: `markSubComponentComplete` Server Action writes to Supabase `sub_component_progress`

### Recommended Project Structure

```
src/
├── lib/
│   └── practice/
│       ├── types.ts          # ProblemData discriminated union, ProblemType enum
│       ├── schema.ts         # Zod schemas for each problem type + parseProblemContent()
│       └── grading.ts        # gradeFillin(), gradeMC(), gradeConjugationTable(), gradeMatching()
├── components/
│   ├── diagnostic/
│   │   ├── MCOptionButton.tsx     # EXISTING — reuse directly
│   │   └── FillInInput.tsx        # EXISTING — reuse directly
│   └── practice/
│       ├── PracticeCardRouter.tsx       # NEW — routes to correct card by type
│       ├── MCPracticeCard.tsx           # NEW — wraps MCOptionButton
│       ├── FillInPracticeCard.tsx       # NEW — wraps FillInInput
│       ├── ConjugationTableCard.tsx     # NEW — 6-cell grid
│       └── MatchingCard.tsx             # NEW — two-column click-to-pair
└── app/
    └── levels/[levelSlug]/lessons/[lessonId]/
        └── page.tsx            # EXISTING — add parseProblemContent() call for practice items
```

### Pattern 1: Discriminated Union for Problem Data

**What:** A single TypeScript union type covers all five problem sub-types. The `type` field is the discriminant. Parsed once at the server layer; passed as typed props to client components.

**When to use:** Always — this is the single source of truth for problem shape.

```typescript
// src/lib/practice/types.ts
// [ASSUMED] — derived from UI-SPEC and CONTEXT.md, not from an external library

export type MCProblem = {
  type: 'mc'
  prompt: string
  options: string[]       // 2–4 options
  correctAnswer: string   // must be one of options
}

export type FillInProblem = {
  type: 'fill-in'
  prompt: string
  correctAnswer: string
}

export type ConjugationTableProblem = {
  type: 'conjugation-table'
  prompt: string                     // e.g. "Conjugate parler in the present tense."
  verb: string
  answers: {                         // keyed by pronoun
    je: string
    tu: string
    il: string
    nous: string
    vous: string
    ils: string
  }
}

export type ConjugationSingleProblem = {
  type: 'conjugation-single'
  prompt: string                     // e.g. "Je ___ (parler)"
  correctAnswer: string              // just the one form
}

export type MatchingProblem = {
  type: 'matching'
  prompt: string
  pairs: Array<{ left: string; right: string }>   // 4–6 pairs
}

export type ProblemData =
  | MCProblem
  | FillInProblem
  | ConjugationTableProblem
  | ConjugationSingleProblem
  | MatchingProblem
```

### Pattern 2: Accent-Insensitive Grading (Re-use normalizeFillin)

**What:** Import `normalizeFillin` from `src/lib/diagnostics/scoring.ts` directly. Do not duplicate it. The function already handles trim, lowercase, NFD normalization, and diacritic stripping.

**When to use:** All fill-in and conjugation grading.

```typescript
// src/lib/practice/grading.ts
// [ASSUMED] — pattern derived from existing scoring.ts

import { normalizeFillin } from '@/lib/diagnostics/scoring'

export type GradeResult = {
  correct: boolean
  accentNote?: string   // set when correct but raw form differed from canonical
}

/**
 * Grade a fill-in answer with accent leniency.
 * Blank submissions always fail (matches diagnostic behavior — Pitfall 6 guard).
 */
export function gradeFillin(submitted: string, correctAnswer: string): GradeResult {
  if (submitted.trim() === '') return { correct: false }
  const correct = normalizeFillin(submitted) === normalizeFillin(correctAnswer)
  if (!correct) return { correct: false }
  const rawDiffers = submitted.trim().toLowerCase() !== correctAnswer.toLowerCase()
  return rawDiffers ? { correct: true, accentNote: correctAnswer } : { correct: true }
}

/**
 * Grade a 6-form conjugation table. Returns per-pronoun results.
 * Accent leniency applied per cell. Table always auto-completes regardless of score (D-06).
 */
export function gradeConjugationTable(
  submitted: Record<string, string>,
  answers: Record<string, string>
): Record<string, GradeResult> {
  const pronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const
  const results: Record<string, GradeResult> = {}
  for (const p of pronouns) {
    results[p] = gradeFillin(submitted[p] ?? '', answers[p] ?? '')
  }
  return results
}

/**
 * Grade matching pairs. Returns per-left-item correctness.
 * Always auto-completes (D-05/D-06).
 */
export function gradeMatching(
  submitted: Record<string, string>,   // left → right (student's pairing)
  pairs: Array<{ left: string; right: string }>
): Record<string, boolean> {
  const answer = Object.fromEntries(pairs.map(p => [p.left, p.right]))
  const results: Record<string, boolean> = {}
  for (const left of Object.keys(submitted)) {
    results[left] = submitted[left] === answer[left]
  }
  return results
}
```

### Pattern 3: Zod Schema for JSON Parsing

**What:** Parse `sub_components.content` JSON at the server layer using a Zod schema. If parse fails (null content, malformed JSON, wrong shape), return `null` so `SubComponentItem` can render the empty problem state ("This practice problem isn't available yet.").

**When to use:** In the lesson page Server Component, after fetching sub-components.

```typescript
// src/lib/practice/schema.ts
// [ASSUMED]
import { z } from 'zod'

const MCSchema = z.object({
  type: z.literal('mc'),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctAnswer: z.string(),
})

// ... (one schema per type, similar pattern)

export const ProblemDataSchema = z.discriminatedUnion('type', [
  MCSchema, FillInSchema, ConjTableSchema, ConjSingleSchema, MatchingSchema
])

export function parseProblemContent(raw: string | null): ProblemData | null {
  if (!raw) return null
  try {
    return ProblemDataSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}
```

### Anti-Patterns to Avoid

- **Grading on the server for practice problems:** All four problem types must grade client-side (the requirement is instant feedback, no network latency). Do not create a Server Action for grading.
- **Duplicating normalizeFillin:** The function exists in `src/lib/diagnostics/scoring.ts`. Import it directly. A copy will diverge.
- **Storing problem type outside the JSON:** Adding a `problem_type` column separately from the JSON requires keeping two things in sync. Keep the discriminant inside the JSON.
- **Making the toggle button interactive for practice kind:** The toggle button MUST be replaced by a non-interactive spacer (`role="presentation" tabIndex={-1}`) per UI-SPEC. Do not leave the existing button clickable.
- **Shuffling matching pairs at data-storage time:** Right column must be shuffled at render time (client-side, each mount), not stored shuffled. Storing shuffled order means re-seeding to change it.

---

## Research Area 1: Data Model Decision

### Option A — JSON in `content` column (RECOMMENDED)

**Shape:** `sub_components.content` stores a JSON string conforming to `ProblemData`. The column is already `text` (nullable). For practice rows, it receives a JSON string. For explainer rows, it continues to receive markdown. The `kind` column disambiguates which.

**Migration required:** None for data storage. Optional: add a `problem_type` generated column or a check constraint to make the DB schema self-documenting. Minimum viable: no migration at all — the JSON is parsed in application code.

**Query pattern:** Same single query that already fetches sub-components. No join. Parse happens in the lesson page Server Component before passing props.

**RLS implications:** None. `sub_components` already has `SELECT` grant for `authenticated` with a policy scoped to all rows. No new grants, no new policies.

**Seeding ergonomics:** A SQL `INSERT` with a `content` value like `'{"type":"mc","prompt":"...","options":[...],"correctAnswer":"..."}'` is straightforward. Phase 7/8 content authors write JSON strings in their seed files.

**Phase 7/8 content authoring:** Authors write JSON in the `content` field. The Zod schema acts as the authoring contract — an invalid JSON object fails parsing gracefully with the empty-problem fallback. This is acceptable for a content-authoring workflow where authors run seed migrations directly.

**Verdict:** Correct choice. No migration complexity, no new RLS surface, no join overhead, consistent with how the schema already works for this phase's scale.

---

### Option B — New `practice_problems` table (NOT RECOMMENDED FOR THIS PHASE)

**Shape:** A new table `practice_problems` with columns: `id`, `sub_component_id` (FK), `problem_type`, `prompt`, `options` (jsonb), `correct_answer`, `pairs` (jsonb).

**Migration required:** `CREATE TABLE`, `GRANT SELECT`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`. Four SQL statements minimum.

**Query pattern:** Every lesson page query must `LEFT JOIN practice_problems ON sub_components.id = sub_component_id` or run a second query. More complex, more failure modes.

**RLS implications:** Adds a new table with its own RLS policy. Must mirror the `authenticated` select policy from `sub_components`. No user-writable data (students don't INSERT into this table), but the policy must still be correct.

**Seeding ergonomics:** INSERT into two tables per practice sub-component. More verbose seed files.

**Phase 7/8 benefit:** Structured columns are easier to query for analytics (e.g., "how many MC problems exist?"). This is a real Phase 7/8 benefit but is not needed in Phase 5.

**Verdict:** Premature for Phase 5. Adds 4+ migration statements, RLS complexity, and query complexity for no benefit this phase can use. Defer to Phase 7/8 if structured column queries become necessary.

---

## Research Area 2: Grading Logic — Accent-Insensitive French Comparison

### Existing Implementation (VERIFIED by reading source)

`normalizeFillin` in `src/lib/diagnostics/scoring.ts` (lines 16–22):

```typescript
export function normalizeFillin(raw: string): string {
  if (raw.trim() === '') return ''
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
```

**How it works:** `normalize('NFD')` decomposes accented characters into base character + combining diacritic. The regex `/[̀-ͯ]/g` then strips all combining marks. Result: `é→e`, `à→a`, `ç→c`, `ü→u`, etc. [VERIFIED: read source file]

**Unicode range:** U+0300 to U+036F covers all standard combining diacritical marks used in French (grave, acute, circumflex, cedilla, diaeresis/tréma). The regex in the existing code uses character class shorthand `[̀-ͯ]` which is the same range. [VERIFIED: read source file]

**Blank submission guard:** The function returns `''` for blank input. The caller (`gradeFillin`) must check for blank before calling normalize to prevent blank-as-correct (Pitfall 6 from Phase 4 diagnostics). The existing `gradeAnswer` function already does this — the practice `gradeFillin` must replicate this guard.

**Accent note:** When `normalizeFillin(submitted) === normalizeFillin(correctAnswer)` but `submitted.trim().toLowerCase() !== correctAnswer.toLowerCase()`, the answer is correct but the accent was wrong. Return `{ correct: true, accentNote: correctAnswer }`. `FillInInput` renders this as `"Correct — watch the accents: {correctAnswer}, not {submittedValue}"` in `text-secondary` (warm amber).

**Re-use decision:** Import `normalizeFillin` directly from `@/lib/diagnostics/scoring`. No duplication. [ASSUMED: the function has no diagnostic-specific coupling — it is a pure string utility]

---

## Research Area 3: Existing Component Audit

### MCOptionButton

**File:** `src/components/diagnostic/MCOptionButton.tsx`
**Export:** `export default function MCOptionButton` (default export)
**Named export:** `export type MCOptionState = 'default' | 'correct' | 'incorrect'`

**Props interface:**
```typescript
interface MCOptionButtonProps {
  option: string           // display text of this option
  selected: boolean        // whether this option is currently selected (pre-submit)
  state?: MCOptionState    // 'default' | 'correct' | 'incorrect' — post-submit state
  disabled?: boolean       // disables the button
  onSelect: (option: string) => void   // callback when clicked
}
```

**Behavior notes (VERIFIED by reading source):**
- `state='correct'` → `bg-tertiary/10 border-tertiary` + Check icon (green only here — UX-10 compliant)
- `state='incorrect'` → `bg-error/10 border-error` + X icon
- `selected=true` + `state='default'` → `border-primary border-2` (selected pre-submit)
- `disabled=true` → adds `cursor-default`, does not add visual muting (caller must set state for visual feedback)
- `role="radio"` + `aria-checked={selected}` — accessibility already built in
- `min-h-[44px]` touch target enforced

**Usage in MCPracticeCard:** Pass `selected={selectedOption === option}`, `state` derived from post-submit state machine, `disabled={submitted}`, `onSelect` updates `selectedOption` state.

---

### FillInInput

**File:** `src/components/diagnostic/FillInInput.tsx`
**Export:** `export default function FillInInput` (default export)
**Named export:** `export type FillInState = 'default' | 'correct' | 'incorrect'`

**Props interface:**
```typescript
interface FillInInputProps {
  value: string
  state?: FillInState      // 'default' | 'correct' | 'incorrect'
  disabled?: boolean
  accentNote?: string      // when set, renders "Correct — watch the accents: {accentNote}, not {value}"
  errorMessage?: string    // renders as role="alert" paragraph below input
  onChange: (value: string) => void
  onSubmit: () => void     // called on Enter keydown
}
```

**Behavior notes (VERIFIED by reading source):**
- `state='correct'` → `border-tertiary border-b-[3px]`
- `state='incorrect'` → `border-error border-b-[3px]`
- `state='default'` → `border-outline focus:border-b-[3px] focus:border-primary`
- `accentNote` renders the accent note paragraph in `text-secondary` (warm amber, NOT error color)
- `errorMessage` renders a `role="alert"` paragraph in `text-error` (red)
- `onSubmit` fires on Enter key — the parent card does NOT need a separate keydown handler
- `aria-label="Your answer"` hardcoded — acceptable for single-input cards
- `min-h-[44px]` touch target enforced
- `autoComplete="off"`, `autoCapitalize="off"`, `spellCheck={false}` — correct for French input

**Usage in FillInPracticeCard:** Pass `value={inputValue}`, `state` from grade result, `disabled={submitted && isCorrect}`, `accentNote={gradeResult?.accentNote}`, `errorMessage` for incorrect reveal (the UI-SPEC uses `errorMessage` for "The answer is {correct_answer}" per the FillInInput contract). On retry: clear `value`, reset `state` to `'default'`.

**Note on errorMessage vs. inline reveal:** The UI-SPEC states the incorrect feedback is `"The answer is {correct_answer}"` in `font-label text-[13px] text-error`. This matches `FillInInput`'s `errorMessage` prop behavior exactly. Pass the reveal string as `errorMessage` rather than building a separate paragraph below the component.

---

### SubComponentItem

**File:** `src/components/lessons/SubComponentItem.tsx`
**Export:** `export default function SubComponentItem` (default export)

**Props interface:**
```typescript
interface SubComponentItemProps {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  isCompleted: boolean
  onComplete: (id: string) => void
}
```

**Current `kind='practice'` behavior (VERIFIED by reading source):**
- The title row renders (toggle button + title + kind chip)
- The toggle button is a fully interactive `<button>` with `onClick={() => onComplete(id)}` and `aria-pressed={isCompleted}`
- The `content && (...)` block at line 139 only renders when `content` is truthy — practice rows have `content=null`, so NO content renders below the title
- The action label (line 124–133) reads "Mark complete" (incomplete) or "Done" (complete)
- The kind chip for `'practice'` uses `bg-surface-container-highest` background

**Changes needed in Phase 5:**
1. Add a branch for `kind === 'practice'` that passes `problemData` (parsed from `content`) into a `PracticeCardRouter` rendered below the title row, indented `sm:ml-[60px]` (matching the existing explainer indent at line 141)
2. Replace the toggle button with a non-interactive spacer for `kind='practice'` (per UI-SPEC SubComponentItem integration spec)
3. Change the action label for practice kind: "In progress" (incomplete) / "Done" (complete) — per UI-SPEC copywriting contract
4. The external props interface does NOT change — `onComplete`, `isCompleted`, `content` remain. Internal branching on `kind`.
5. The lesson page must parse `content` JSON before passing to `SubComponentItem`, OR `SubComponentItem` can accept an optional `problemData?: ProblemData | null` prop. The cleaner approach is adding `problemData` as an optional prop so `SubComponentItem` stays agnostic about JSON parsing.

---

### markSubComponentComplete Server Action

**File:** `src/app/lessons/actions.ts`
**Export:** `export async function markSubComponentComplete(subComponentId: string): Promise<void>`

**Signature:**
```typescript
export async function markSubComponentComplete(subComponentId: string): Promise<void>
```

**Security contract (VERIFIED by reading source):**
- `user_id` derived server-side via `getUser()` — never accepted from client
- `subComponentId` validated as UUID via Zod before any DB call
- Sub-component existence verified before upsert
- Idempotent upsert on composite PK `(user_id, sub_component_id)`
- Calls `revalidatePath` on the lesson page route

**How practice cards call it:** The `onComplete` prop on `SubComponentItem` is already `(id: string) => void`. In the lesson page, this is bound to a client-side wrapper that calls `markSubComponentComplete(id)` (the same pattern Phase 3 established). No changes to the Server Action. No changes to how `SubComponentItem` receives `onComplete`.

---

## Research Area 5: Migration Strategy

### Minimum SQL Migration (Option A — JSON in content)

Option A requires **no schema migration** for the data model itself. The `content text` column already exists and already accepts null values. Storing JSON there requires no DDL change.

**Optional enhancement (RECOMMENDED):** Add a `problem_type` text column with a check constraint so the DB is self-documenting and queryable without parsing JSON:

```sql
-- supabase/migrations/20260623_phase5_practice.sql

ALTER TABLE public.sub_components
  ADD COLUMN problem_type text
    CONSTRAINT sub_component_problem_type CHECK (
      problem_type IS NULL OR
      problem_type IN ('mc', 'fill-in', 'conjugation-table', 'conjugation-single', 'matching')
    );

-- No new grants needed: authenticated already has SELECT on sub_components.
-- No new RLS policies needed: existing policy covers all columns.

COMMENT ON COLUMN public.sub_components.problem_type IS
  'Discriminant for practice sub-components. NULL for explainer and writing kinds. '
  'Must match the "type" field in the content JSON when kind=''practice''.';
```

**Why add problem_type even with JSON in content:**
- Enables DB-level queries like `WHERE kind='practice' AND problem_type='mc'` without JSON parsing
- Provides a check constraint that validates at INSERT/UPDATE time (catches authoring errors in seed migrations)
- Makes Phase 7/8 content management queries trivial

**Alternative minimum:** Skip the migration entirely. Rely on application-layer Zod validation. Acceptable for Phase 5, but the `problem_type` column costs one line of SQL and pays dividends in Phase 7/8.

---

## Research Area 6: Seed Data Shape

Phase 5 needs 1–2 sample problems per type to exercise the full component surface during development. Phase 7/8 own real content; Phase 5 only needs smoke-test seed data.

The existing Phase 3 seed inserted two practice sub-components with `content=null`. These must be updated (or new ones inserted) to carry problem JSON.

**Seed update strategy:** Update existing null-content practice rows OR insert new ones. Recommend inserting new sub-components in the Phase 5 migration so existing IDs are not mutated.

**Sample seed shapes (one per type):**

```sql
-- In the Phase 5 migration, after the schema change:

DO $$
DECLARE
  v_lesson1_id uuid;
  v_lesson2_id uuid;
BEGIN
  -- Resolve existing lesson IDs (greetings and definite-articles)
  SELECT id INTO v_lesson1_id FROM public.lessons WHERE slug = 'greetings';
  SELECT id INTO v_lesson2_id FROM public.lessons WHERE slug = 'definite-articles';

  -- MC problem (greetings lesson)
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson1_id,
    'Practice: formal vs informal',
    'practice',
    'mc',
    '{"type":"mc","prompt":"Which greeting is appropriate for a teacher?","options":["Salut","Bonjour","Coucou","Hé"],"correctAnswer":"Bonjour"}',
    4
  );

  -- Fill-in problem (greetings lesson)
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson1_id,
    'Practice: good evening',
    'practice',
    'fill-in',
    '{"type":"fill-in","prompt":"How do you say \"good evening\" in French?","correctAnswer":"Bonsoir"}',
    5
  );

  -- Conjugation table problem (definite-articles lesson — parler as a test verb)
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson2_id,
    'Practice: conjugate parler',
    'practice',
    'conjugation-table',
    '{"type":"conjugation-table","prompt":"Conjugate parler (to speak) in the present tense.","verb":"parler","answers":{"je":"parle","tu":"parles","il":"parle","nous":"parlons","vous":"parlez","ils":"parlent"}}',
    3
  );

  -- Matching problem (definite-articles lesson)
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson2_id,
    'Practice: match the article',
    'practice',
    'matching',
    '{"type":"matching","prompt":"Match each noun to its correct definite article.","pairs":[{"left":"le livre","right":"masculine singular"},{"left":"la table","right":"feminine singular"},{"left":"les amis","right":"plural"},{"left":"l''école","right":"vowel/h"}]}',
    4
  );

  -- Conjugation single (greetings lesson — simple test case)
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson1_id,
    'Practice: je parle',
    'practice',
    'conjugation-single',
    '{"type":"conjugation-single","prompt":"Je ___ (parler). Fill in the correct form.","correctAnswer":"parle"}',
    6
  );
END;
$$;
```

**Note on existing null-content practice rows:** The Phase 3 seed inserted practice rows with `content=null` and `problem_type` will also be null (or the column won't exist pre-migration). `parseProblemContent(null)` returns `null`, which renders the empty-problem fallback ("This practice problem isn't available yet.") — correct behavior for pre-seeded rows.

---

## Research Area 7: Test Strategy

### Test Framework (VERIFIED by reading source)

| Property | Value |
|----------|-------|
| Framework | Jest (jest@latest) + ts-jest |
| Config file | `jest.config.ts` (root) |
| Setup file | `jest.setup.ts` (root) |
| Test match pattern | `**/__tests__/**/*.test.ts` and `**/__tests__/**/*.test.tsx` |
| Quick run command | `npx jest --testPathPattern=practice` |
| Full suite command | `npx jest` |
| Test environment | `jest-environment-jsdom` |

### Existing Tests

No test files exist in `src/__tests__/`. The test infrastructure (Jest, ts-jest, @testing-library/jest-dom, @testing-library/react) is installed and configured, but no tests have been written yet.

**Precedent:** `src/lib/diagnostics/scoring.ts` contains `normalizeFillin`, `gradeAnswer`, `computeScore`, `derivePlacement`, `derivePassFail`, `drawQuestions` — all pure functions. These were the intended test surface for Phase 4 but tests were not written. Phase 5 has the same pure-function opportunity.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROB-01 | MC grading: correct option returns `{ correct: true }` | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-01 | MC grading: wrong option returns `{ correct: false }` | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-02 | Fill-in exact match | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-02 | Fill-in accent-insensitive match (é→e) | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-02 | Fill-in accent match returns accentNote | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-02 | Fill-in blank submission returns incorrect | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-03 | Conjugation table: all correct | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-03 | Conjugation table: partial correct per-cell | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-03 | Conjugation single: same as fill-in | unit | `npx jest --testPathPattern=grading` (shared) | ❌ Wave 0 |
| PROB-04 | Matching: all correct | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-04 | Matching: partial correct | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-05 | parseProblemContent: valid JSON parses to typed shape | unit | `npx jest --testPathPattern=schema` | ❌ Wave 0 |
| PROB-05 | parseProblemContent: null input returns null | unit | `npx jest --testPathPattern=schema` | ❌ Wave 0 |
| PROB-05 | parseProblemContent: malformed JSON returns null | unit | `npx jest --testPathPattern=schema` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest --testPathPattern=practice --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/practice/grading.test.ts` — covers PROB-01 through PROB-04 grading pure functions
- [ ] `src/__tests__/practice/schema.test.ts` — covers PROB-05 parseProblemContent validation
- [ ] No framework install needed — Jest and ts-jest already installed and configured

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accent normalization | Custom regex / character map | `normalizeFillin` from `src/lib/diagnostics/scoring.ts` | Already correct, already tested (in principle), covers all French diacritics via NFD decomposition |
| JSON runtime validation | `JSON.parse` with `as ProblemData` type cast | Zod `ProblemDataSchema.parse()` | Type casts are silent failures; Zod throws on malformed data, enabling graceful fallback |
| Idempotent progress save | Custom duplicate-check logic | Existing `markSubComponentComplete` Server Action | Already handles idempotency, UUID validation, user auth, and `revalidatePath` |
| MC option button | New button component | Existing `MCOptionButton` | States, icons, aria attributes, touch target already built |
| Fill-in input | New input component | Existing `FillInInput` | Correct/incorrect borders, accent note, Enter-to-submit, aria already built |

**Key insight:** This phase's value is the router, the new card components (conjugation table and matching), and the data model wiring. Everything for MC and fill-in already exists at the component level.

---

## Common Pitfalls

### Pitfall 1: Blank Submission Graded as Correct
**What goes wrong:** If `normalizeFillin('')` is called before the blank guard, and `correctAnswer` is also empty or the comparison short-circuits, a blank submission could be marked correct.
**Why it happens:** `normalizeFillin` returns `''` for blank input. If `correctAnswer` is `''`, `normalizeFillin('') === normalizeFillin('')` is `true`.
**How to avoid:** Always check `submitted.trim() === ''` before calling `normalizeFillin`. Return `{ correct: false }` immediately. This is the Pitfall 6 pattern from Phase 4 diagnostics — replicate it in `gradeFillin`.
**Warning signs:** A passing test where the submitted answer is `''`.

### Pitfall 2: JSON Type Cast Without Validation
**What goes wrong:** `JSON.parse(content) as ProblemData` silently accepts malformed data, causing runtime errors when the component tries to access `problemData.options` on a fill-in shape.
**Why it happens:** TypeScript `as` casts are compile-time only — they do not validate at runtime.
**How to avoid:** Always use the Zod `ProblemDataSchema.parse()` path wrapped in try/catch. Return `null` on failure. Render the empty-problem fallback.
**Warning signs:** TypeScript compiles clean but the page crashes when a malformed practice row is loaded.

### Pitfall 3: Toggle Button Left Interactive for Practice Kind
**What goes wrong:** The existing `SubComponentItem` toggle button fires `onComplete(id)` on click. If left unchanged for `kind='practice'`, a student can manually mark a practice problem complete without solving it.
**Why it happens:** The current `SubComponentItem` code has no branching on `kind` — all kinds use the same toggle.
**How to avoid:** Replace the toggle button with a non-interactive spacer (`role="presentation" tabIndex={-1}`) when `kind === 'practice'`. The spacer shows the completion state visually but is not focusable or clickable.
**Warning signs:** A practice problem that can be marked complete without interacting with it.

### Pitfall 4: Matching Right Column Not Shuffled
**What goes wrong:** If right-column items render in the same order as left-column items (same index), the matching exercise is trivially solved by position rather than knowledge.
**Why it happens:** The naive approach maps `pairs.map(p => p.right)` directly to the right column.
**How to avoid:** Shuffle right-column items at render time using a Fisher-Yates shuffle on a copy of the `pairs` array. Store shuffled order in a `useState` initialized with the shuffle, not re-computed on every render.
**Warning signs:** Right-column item at index 0 always matches left-column item at index 0.

### Pitfall 5: Retry State Not Fully Reset
**What goes wrong:** After "Try again" click, the previous incorrect option or input value reappears — student sees their wrong answer pre-filled.
**Why it happens:** Resetting only the `submitted` flag without also clearing `selectedOption` (MC) or `inputValue` (fill-in).
**How to avoid:** On retry, reset: `submitted=false`, `selectedOption=null` (MC) or `inputValue=''` (fill-in), `gradeResult=null`. Move focus to first option (MC) or input field (fill-in) per UI-SPEC focus management.
**Warning signs:** The input or option shows a value immediately after "Try again" is clicked.

### Pitfall 6: Completed State Not Handled on Mount
**What goes wrong:** When a student returns to a lesson page after completing a practice problem, the problem card renders in default state (empty, interactive) instead of the completed visual state.
**Why it happens:** The `isCompleted` prop is not threaded into the card's initial state.
**How to avoid:** All four card components must accept an `isCompleted` prop and initialize their state machine to the completed/correct visual state when `isCompleted=true`. All inputs/options are disabled. No action button shown.
**Warning signs:** A previously completed problem appearing as unanswered on page reload.

---

## Code Examples

### Existing normalizeFillin (re-use as-is)

```typescript
// Source: src/lib/diagnostics/scoring.ts (VERIFIED)
export function normalizeFillin(raw: string): string {
  if (raw.trim() === '') return ''
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
```

### MCOptionButton usage in MCPracticeCard

```typescript
// [ASSUMED] — derived from MCOptionButton props contract (VERIFIED)
<div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-3">
  {problem.options.map((option) => (
    <MCOptionButton
      key={option}
      option={option}
      selected={selectedOption === option}
      state={
        submitted
          ? option === problem.correctAnswer
            ? 'correct'
            : option === selectedOption
            ? 'incorrect'
            : 'default'
          : 'default'
      }
      disabled={submitted}
      onSelect={submitted ? () => {} : setSelectedOption}
    />
  ))}
</div>
```

### FillInInput usage in FillInPracticeCard

```typescript
// [ASSUMED] — derived from FillInInput props contract (VERIFIED)
<FillInInput
  value={inputValue}
  state={gradeResult ? (gradeResult.correct ? 'correct' : 'incorrect') : 'default'}
  disabled={gradeResult?.correct === true}
  accentNote={gradeResult?.accentNote}
  errorMessage={
    gradeResult && !gradeResult.correct
      ? `The answer is ${problem.correctAnswer}`
      : undefined
  }
  onChange={setInputValue}
  onSubmit={handleSubmit}
/>
```

### PracticeCardRouter

```typescript
// [ASSUMED] — derived from UI-SPEC type routing table
import type { ProblemData } from '@/lib/practice/types'

interface PracticeCardRouterProps {
  problemData: ProblemData
  subComponentId: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function PracticeCardRouter({
  problemData, subComponentId, isCompleted, onComplete
}: PracticeCardRouterProps) {
  switch (problemData.type) {
    case 'mc':
      return <MCPracticeCard problem={problemData} id={subComponentId} isCompleted={isCompleted} onComplete={onComplete} />
    case 'fill-in':
    case 'conjugation-single':
      return <FillInPracticeCard problem={problemData} id={subComponentId} isCompleted={isCompleted} onComplete={onComplete} />
    case 'conjugation-table':
      return <ConjugationTableCard problem={problemData} id={subComponentId} isCompleted={isCompleted} onComplete={onComplete} />
    case 'matching':
      return <MatchingCard problem={problemData} id={subComponentId} isCompleted={isCompleted} onComplete={onComplete} />
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing structured data in separate table immediately | JSON-in-text-column for early-phase structured data | Phase 5 design decision | Avoids premature schema complexity; Zod validates at app layer |
| NFD normalization custom regex | `String.prototype.normalize('NFD')` built-in | ES2015+ | Browser/Node native; no library needed |

**Deprecated/outdated:**
- None applicable to this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `normalizeFillin` has no diagnostic-specific coupling and can be safely imported into `src/lib/practice/grading.ts` | Grading Logic | Low risk — function is a pure string utility with no imports beyond nothing; re-read confirmed |
| A2 | No new packages are needed for this phase | Standard Stack | Low — all identified tools are already installed; if a gap is found, it will be a dev dependency for testing |
| A3 | The `problem_type` column addition is the right migration boundary (vs. no migration) | Migration Strategy | Low — the check constraint catches authoring errors; skipping it is also valid |
| A4 | Adding `problemData?: ProblemData | null` as an optional prop to `SubComponentItem` is the right layer for JSON parsing handoff | Architecture | Medium — alternative is parsing inside `SubComponentItem` itself; the server-side parse is cleaner but requires the lesson page query to handle parsing |
| A5 | Shuffling matching right column via `useState` initialized from Fisher-Yates is sufficient (no persistence needed) | Architecture Patterns | Low — the shuffle is cosmetic; the correct answer is in the data, not the visual order |

---

## Open Questions

1. **Should `parseProblemContent` live in the lesson page query or in `SubComponentItem`?**
   - What we know: The lesson page Server Component fetches sub-components; `SubComponentItem` is a client component.
   - What's unclear: Whether passing `content: string | null` + adding `problemData?: ProblemData | null` prop is cleaner than parsing JSON in a client component.
   - Recommendation: Parse server-side in the lesson page (already a Server Component); pass typed `problemData` as an additional prop to `SubComponentItem`. This keeps JSON parsing out of client bundles and enables the empty-problem fallback before hydration.

2. **Should the existing null-content practice sub-components from Phase 3 seed be updated or left as-is?**
   - What we know: Phase 3 seeded two practice rows with `content=null`. `parseProblemContent(null)` returns null, showing the empty-problem fallback.
   - What's unclear: Whether Phase 5 should update those rows or leave them as fallback examples and add new rows.
   - Recommendation: Leave existing null rows in place (they demonstrate the fallback state); INSERT new practice rows alongside them in the Phase 5 migration.

---

## Environment Availability

No new external dependencies. All tools confirmed available:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, Jest | ✓ | runtime | — |
| Jest | Unit tests | ✓ | installed | — |
| ts-jest | TypeScript test transform | ✓ | installed | — |
| @testing-library/react | Component tests (if needed) | ✓ | installed | — |
| Supabase | Progress persistence | ✓ | existing project | — |

Step 2.6: No new external dependencies. All tools already available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npx jest --testPathPattern=practice` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROB-01 | MC grading correct/incorrect | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-02 | Fill-in exact, accent-insensitive, blank guard, accentNote | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-03 | Conjugation table per-cell grading; single-blank same as fill-in | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-04 | Matching correct/partial grading | unit | `npx jest --testPathPattern=grading` | ❌ Wave 0 |
| PROB-05 | Zod schema parses valid JSON; returns null for null/malformed | unit | `npx jest --testPathPattern=schema` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest --testPathPattern=practice --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/practice/grading.test.ts` — all grading pure functions
- [ ] `src/__tests__/practice/schema.test.ts` — `parseProblemContent` validation
- [ ] No framework install needed

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no new auth surface) |
| V3 Session Management | no | — (no new session surface) |
| V4 Access Control | no | — (no new access control; RLS unchanged) |
| V5 Input Validation | yes | Zod schema validates `problemData` at parse time; `markSubComponentComplete` already validates UUID |
| V6 Cryptography | no | — (no crypto; grading is pure comparison) |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client-reported "correct" score | Tampering | Grading is purely client-side display logic; the only server write is `markSubComponentComplete(id)` — no score is transmitted, only sub-component ID. RLS ensures students can only complete their own rows. |
| Malformed JSON in `content` causing crash | Denial of Service | `parseProblemContent` wraps parse in try/catch; Zod schema rejection returns `null`; empty-problem fallback renders without crash. |
| Student manually calling `markSubComponentComplete` for a practice sub-component without solving it | Tampering | This is intentionally acceptable — progress is binary (complete/incomplete) and the educational content is the learning goal, not gamification integrity. The Server Action already validates the sub-component exists and the user is authenticated. |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/diagnostics/scoring.ts` — `normalizeFillin` implementation verified by direct source read
- `src/components/diagnostic/MCOptionButton.tsx` — full props interface verified by direct source read
- `src/components/diagnostic/FillInInput.tsx` — full props interface verified by direct source read
- `src/components/lessons/SubComponentItem.tsx` — current `kind='practice'` behavior verified by direct source read
- `src/app/lessons/actions.ts` — `markSubComponentComplete` signature and security contract verified
- `supabase/migrations/20260622_phase3_lessons.sql` — `sub_components` schema (content column type, kind check constraint) verified
- `jest.config.ts` — test match patterns and environment verified
- `package.json` — all installed dependencies verified

### Secondary (MEDIUM confidence)
- `05-CONTEXT.md` — all D-01 through D-09 decisions
- `05-UI-SPEC.md` — component anatomy, states, and interaction contracts
- `REQUIREMENTS.md` — PROB-01 through PROB-05 requirements text

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified as already installed
- Architecture: HIGH — all integration points verified by source read; data model decision is well-reasoned with direct schema evidence
- Grading logic: HIGH — `normalizeFillin` verified in source; Unicode NFD approach is correct for French
- Component audit: HIGH — all prop interfaces extracted directly from source files
- Pitfalls: HIGH — grounded in verified source behavior (toggle button, retry state, blank guard)
- Seed data: MEDIUM — shapes are [ASSUMED] correct per the type definitions; actual seeding will be validated when migration runs

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (stable — no fast-moving dependencies)
