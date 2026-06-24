---
phase: 05-practice-problem-engine
plan: "03"
subsystem: practice-engine
tags: [conjugation-table, matching, component, grading, router]
dependency_graph:
  requires: [05-01-types-grading, 05-02-mc-fillin-router]
  provides: [ConjugationTableCard, MatchingCard, PracticeCardRouter-complete]
  affects: [05-04-lesson-integration]
tech_stack:
  added: []
  patterns: [discriminated-union-router, lazy-useState-initializer, fisher-yates-shuffle, per-cell-grading]
key_files:
  created:
    - src/components/practice/ConjugationTableCard.tsx
    - src/components/practice/MatchingCard.tsx
  modified:
    - src/components/practice/PracticeCardRouter.tsx
decisions:
  - "PracticeCardRouter patched (not recreated) — Plan 02 created the file; Plan 03 replaced null stubs with real components"
  - "ConjugationTableCard uses native <input> per-cell (not FillInInput) for direct grid control per spec"
  - "MatchingCard right column shuffled via lazy useState initializer — stable across re-renders (Pitfall 4 guard)"
  - "onComplete called immediately on Check for both components regardless of score (D-06/D-09)"
  - "isCompleted=true initializes both components to fully-filled completed visual state (Pitfall 6 guard)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  tests_added: 0
  files_created: 2
  files_modified: 1
---

# Phase 5 Plan 03: ConjugationTableCard, MatchingCard, PracticeCardRouter Complete Summary

**One-liner:** 6-cell conjugation grid (per-cell grading, auto-complete on Check) and click-to-pair matching card (Fisher-Yates shuffle, all-at-once feedback) completing the PracticeCardRouter switch over all 5 problem types.

---

## What Was Built

### src/components/practice/ConjugationTableCard.tsx

6-pronoun conjugation grid using `grid-cols-[auto_1fr]` layout per UI-SPEC. Features:
- Pronouns rendered in DOM order (je/tu/il/nous/vous/ils) for natural Tab navigation
- `gradeConjugationTable` imported from `@/lib/practice/grading` — not re-implemented
- `handleCheck`: grades all cells → sets cellResults → setChecked(true) → `onComplete(id)` immediately (D-06/D-09)
- Per-cell correct (`bg-tertiary/10 border-tertiary`) / incorrect (`bg-error/10 border-error`) states
- Incorrect cells show `Answer: {form}` label below via the grid layout
- Check button: disabled when all cells are empty (T-05-07 threat mitigation)
- Enter on last cell (ils) triggers Check via `onKeyDown`
- `role="group" aria-label="Conjugation table"` on grid; `aria-label="{pronoun} form"` on each input
- `role="status" aria-live="polite"` result summary: "N of 6 correct"
- isCompleted=true guard: initializes `cellValues=problem.answers`, `checked=true`, `cellResults=all-correct`

### src/components/practice/MatchingCard.tsx

Two-column click-to-pair matching card per UI-SPEC. Features:
- Fisher-Yates shuffle via lazy `useState(() => shuffleArray(...))` — stable, runs once at mount (Pitfall 4 guard)
- Full state machine: select left → pair right → re-select already-paired left (breaks prior pair, sets as selected)
- Right item click when already claimed: breaks prior pair, forms new pair with currently-selected left (D-03)
- Check disabled until `Object.keys(pairings).length >= problem.pairs.length` (T-05-06 threat mitigation)
- `gradeMatching` imported from `@/lib/practice/grading` — not re-implemented
- `handleCheck`: grades → setMatchResults → setChecked(true) → `onComplete(id)` immediately (D-05/D-06)
- No retry (D-09); items disabled after Check
- Incorrect pair reveals: `"{left}" pairs with "{correct_right}"` per incorrect pair, below the grid
- `role="status" aria-live="polite"` result: "N of M correct"
- isCompleted=true guard: initializes `pairings=all pairs`, `checked=true`, `matchResults=all true`

### src/components/practice/PracticeCardRouter.tsx (patched)

Plan 02 created this file with null stubs for `conjugation-table` and `matching`. Plan 03 patched it:
- Added imports for `ConjugationTableCard` and `MatchingCard`
- Replaced `case 'conjugation-table': return null` with `<ConjugationTableCard ...>`
- Replaced `case 'matching': return null` with `<MatchingCard ...>`
- Switch is now exhaustive over all 5 `ProblemData` types — no null cases remain

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit --skipLibCheck` | Zero errors |
| `npx jest` (16 suites, 145 tests) | All pass, 0 regressions |
| `gradeConjugationTable` import confirmed in ConjugationTableCard | PASS |
| `gradeMatching` import confirmed in MatchingCard | PASS |
| Fisher-Yates shuffle confirmed in MatchingCard | PASS |
| No null cases in PracticeCardRouter | PASS |

---

## Deviations from Plan

### Linter revert on PracticeCardRouter

During Task 2, the project linter reverted the Edit-based patches to `PracticeCardRouter.tsx` (restoring the null stubs). Resolved by writing the complete final file with Write tool, which the linter accepted. No behavioral change — final file is identical to what the plan specified.

No other deviations. All tasks executed as specified.

---

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-05-06 | MatchingCard Check disabled until all left items have a right partner |
| T-05-07 | ConjugationTableCard Check disabled when no cell has content |
| T-05-SC | No new packages installed |

---

## Known Stubs

None. Both components are complete implementations with real grading logic wired. The PracticeCardRouter switch is exhaustive with no null branches remaining.

---

## Threat Flags

No new threat surface beyond the plan's threat model. No new network endpoints, auth paths, or trust boundary changes.

---

## Self-Check: PASSED

Files exist:
- FOUND: src/components/practice/ConjugationTableCard.tsx
- FOUND: src/components/practice/MatchingCard.tsx
- FOUND: src/components/practice/PracticeCardRouter.tsx (patched, ConjugationTableCard + MatchingCard imported)

Commits exist:
- FOUND: d7bd667 (Task 1 — ConjugationTableCard)
- FOUND: 9709b3c (Task 2 — MatchingCard + PracticeCardRouter)
