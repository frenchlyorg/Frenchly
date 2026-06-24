---
phase: 05-practice-problem-engine
plan: "01"
subsystem: practice-engine
tags: [types, zod, grading, migration, tdd, pure-functions]
dependency_graph:
  requires: [04-diagnostic-system]
  provides: [ProblemData, parseProblemContent, gradeFillin, gradeConjugationTable, gradeMatching]
  affects: [05-02-components, 05-03-integration]
tech_stack:
  added: []
  patterns: [discriminated-union, zod-safe-parse, tdd-red-green]
key_files:
  created:
    - src/lib/practice/types.ts
    - src/lib/practice/schema.ts
    - src/lib/practice/grading.ts
    - src/__tests__/practice/grading.test.ts
    - src/__tests__/practice/schema.test.ts
    - supabase/migrations/20260623_phase5_practice.sql
  modified: []
decisions:
  - "JSON stored in existing sub_components.content column (Option A) — no new table, no new RLS"
  - "normalizeFillin imported from diagnostics/scoring.ts — not re-implemented"
  - "parseProblemContent wraps Zod parse in try/catch — never uses 'as ProblemData' type cast"
  - "problem_type column added to sub_components for DB-level queries and authoring-time validation"
  - "Seed positions 10-19 to avoid collision with Phase 3 seed rows"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  tests_added: 24
  files_created: 6
---

# Phase 5 Plan 01: Practice Problem Engine Foundation Summary

**One-liner:** Discriminated union types, Zod safe parser, and pure grading functions for 5 French practice problem types — all tested TDD RED/GREEN with 24 passing tests and a DB migration adding `problem_type` column + 10 seed rows.

---

## What Was Built

### src/lib/practice/types.ts
Exports the `ProblemData` discriminated union covering all 5 sub-types:
- `MCProblem` — multiple choice with 2–4 options
- `FillInProblem` — single blank answer
- `ConjugationTableProblem` — 6-pronoun grid (je/tu/il/nous/vous/ils)
- `ConjugationSingleProblem` — single conjugation form
- `MatchingProblem` — left↔right pair array (2–6 pairs)

### src/lib/practice/schema.ts
Zod discriminated union schema (`ProblemDataSchema`) and `parseProblemContent(raw: string | null): ProblemData | null`. Returns null for null input, empty string, malformed JSON, or Zod schema rejection. Never uses `as ProblemData` type cast.

### src/lib/practice/grading.ts
Three pure grading functions:
- `gradeFillin(submitted, correctAnswer): GradeResult` — blank guard first, then accent-insensitive via imported `normalizeFillin`, sets `accentNote` when correct but raw form differed
- `gradeConjugationTable(submitted, answers): Record<string, GradeResult>` — grades all 6 pronoun cells, absent keys treated as blank
- `gradeMatching(submitted, pairs): Record<string, boolean>` — builds answer map from pairs, compares per left key

Zero Supabase/Next.js imports. Pure functions only.

### supabase/migrations/20260623_phase5_practice.sql
- `ALTER TABLE public.sub_components ADD COLUMN IF NOT EXISTS problem_type text` with check constraint (NULL or one of 5 valid type values)
- Column comment documenting discriminant role
- DO $$ block seeding 10 practice rows (2 per type), positions 10–19 (no collision with Phase 3 rows)

---

## Test Results

**Wave 0 (RED/GREEN TDD):**

| File | Tests | Result |
|------|-------|--------|
| src/__tests__/practice/grading.test.ts | 13 | PASS |
| src/__tests__/practice/schema.test.ts | 11 | PASS |
| **Total practice** | **24** | **PASS** |

**Full suite (regressions check):**
- 16 test suites, 145 tests passed, 3 skipped, 0 failed
- No regressions from prior phases

**TypeScript:** Zero errors in practice files (`npx tsc --noEmit --skipLibCheck`)

**Purity check:** `grep -rn "from '@/lib/supabase\|from 'next"` returns nothing for `src/lib/practice/`

---

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | e57e67f — `test(05-01): add Wave 0 failing tests + types + Zod schema (RED)` | PASS — grading.test.ts failed with "Cannot find module" as expected |
| GREEN | b59fa6a — `feat(05-01): implement grading pure functions + DB migration (GREEN)` | PASS — all 24 tests pass |

---

## Deviations from Plan

None — plan executed exactly as written.

The plan's `<done>` criteria for Task 1 specified that `schema.test.ts` passes while `grading.test.ts` fails with "Cannot find module '@/lib/practice/grading'" — both confirmed before RED commit.

---

## Known Stubs

None. The grading functions are complete implementations with no placeholder logic. The migration SQL is file-only (not applied) per plan instructions — this is intentional, not a stub.

---

## Threat Flags

No new threat surface beyond what the plan's `<threat_model>` covers:
- `parseProblemContent` is wrapped in try/catch (T-05-02 mitigated)
- No network endpoints created
- No auth paths modified

---

## Self-Check: PASSED

Files exist:
- FOUND: src/lib/practice/types.ts
- FOUND: src/lib/practice/schema.ts
- FOUND: src/lib/practice/grading.ts
- FOUND: src/__tests__/practice/grading.test.ts
- FOUND: src/__tests__/practice/schema.test.ts
- FOUND: supabase/migrations/20260623_phase5_practice.sql

Commits exist:
- FOUND: e57e67f (RED — test + types + schema)
- FOUND: b59fa6a (GREEN — grading + migration)
