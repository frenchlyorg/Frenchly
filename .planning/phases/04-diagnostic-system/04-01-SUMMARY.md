---
phase: 04-diagnostic-system
plan: 01
wave: 1
status: complete
requirements: [DIAG-01, DIAG-02]
---

# 04-01 Summary — Diagnostic domain types + pure scoring/gating functions

## What was built

The foundation/contract layer for the diagnostic system: domain types and the
pure, DB-free scoring and gating functions that Plans 04-03/04-04/04-05 import
and reuse. Written test-first (Wave 0 seams from 04-VALIDATION.md).

## Key files

- **created** `src/lib/diagnostics/types.ts` — `QuestionType`, `AttemptStatus`,
  `DiagnosticType`, `DiagnosticQuestion`, `DiagnosticAttempt`, `GradeResult`.
  `correct_answer` documented as server-only (Pitfall 1).
- **created** `src/lib/diagnostics/scoring.ts` — `normalizeFillin`, `gradeAnswer`,
  `computeScore`, `derivePlacement`, `derivePassFail`, `drawQuestions`.
- **created** `src/lib/diagnostics/gating.ts` — `computeCooldownUntil`,
  `isCooldownActive`, `formatCooldownRemaining`, `deriveAllLessonsComplete`.
- **created** `__tests__/diagnostic/scoring.test.ts`, `__tests__/diagnostic/gating.test.ts`.

## Decisions / notes

- Fill-in leniency strips combining diacritics via `NFD` + `replace(/[̀-ͯ]/g)`;
  blank guard runs first so empty answers never benefit from leniency (Pitfall 6).
- `accentNote` carries the canonical spelling only when a correct answer's raw
  form differs from canonical (case/accent). Never affects scoring.
- Placement and pass/fail share the exact 0.8 threshold (D-P03 / D-E02).
- `drawQuestions` uses Fisher-Yates on a copy; `count > pool` returns the whole pool.
- `formatCooldownRemaining` rounds minutes up so the countdown never shows `0m`
  while time remains; returns `''` once expired.

## Verification

- `npx jest --testPathPattern="diagnostic"` → 28 passed, 2 suites.
- `npx jest` (full suite) → 105 passed, 3 skipped, 0 failed (no regression).
- Purity grep: scoring.ts / gating.ts have zero `@/lib/supabase` or `next/*` imports.

## Commits

- `f649068` test(04-01): domain types + Wave 0 RED test scaffolds
- `a4610b5` feat(04-01): implement scoring + gating pure functions

## Self-Check: PASSED
