---
phase: 05-practice-problem-engine
plan: "02"
subsystem: practice-components
tags: [practice, mc, fill-in, conjugation-single, router, SubComponentItem, client-components]
dependency_graph:
  requires: [05-01]
  provides: [MCPracticeCard, FillInPracticeCard, PracticeCardRouter, SubComponentItem-practice-branch]
  affects: [05-03-integration, lesson-view]
tech_stack:
  added: []
  patterns: [discriminated-union-routing, pitfall-6-guard, retry-reset-pattern, non-interactive-spacer]
key_files:
  created:
    - src/components/practice/MCPracticeCard.tsx
    - src/components/practice/FillInPracticeCard.tsx
    - src/components/practice/PracticeCardRouter.tsx
  modified:
    - src/components/lessons/SubComponentItem.tsx
decisions:
  - "PracticeCardRouter returns null with TODO comments for conjugation-table and matching — Plan 03 fills these in"
  - "FillInPracticeCard handles both fill-in and conjugation-single (same UI, different prompt)"
  - "SubComponentItem internal API extended with optional problemData prop — external API unchanged"
  - "Focus management on retry uses querySelector on container ref (MCOptionButton lacks forwardRef)"
  - "Pitfall 6 guard: isCompleted=true on mount initializes submitted=true/gradeResult={correct:true}"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-24"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 5 Plan 02: Practice Card Components Summary

**One-liner:** MCPracticeCard (wraps MCOptionButton), FillInPracticeCard (wraps FillInInput, handles fill-in + conjugation-single), PracticeCardRouter (type switch), and SubComponentItem with practice branch — all wired for select/submit/retry and auto-complete on correct answer.

---

## What Was Built

### src/components/practice/MCPracticeCard.tsx
Client component wrapping `MCOptionButton`. Props: `{ problem: MCProblem; id: string; isCompleted: boolean; onComplete: (id: string) => void }`.

State machine:
- `selectedOption: string | null` — initialized to `problem.correctAnswer` when `isCompleted=true` (Pitfall 6 guard)
- `submitted: boolean` — initialized to `isCompleted`

Behavior:
- Options rendered in `role="radiogroup"` with correct/incorrect/default states post-submit
- "Submit answer" button disabled until option selected; enabled on first selection
- Correct submission → `onComplete(id)` fires immediately (D-06)
- Incorrect submission → "Try again" button shown; retry resets `selectedOption=null, submitted=false` (D-08, Pitfall 5)
- Focus returns to first option via `querySelector` on container ref after retry
- No green colors outside MCOptionButton's correct state (UX-10)

### src/components/practice/FillInPracticeCard.tsx
Client component wrapping `FillInInput`. Handles both `FillInProblem` ('fill-in') and `ConjugationSingleProblem` ('conjugation-single') — same UI, different prompt copy.

State machine:
- `inputValue: string` — resets to '' on retry (Pitfall 5)
- `gradeResult: GradeResult | null` — initialized to `{ correct: true }` when `isCompleted=true` (Pitfall 6 guard)

Behavior:
- Calls `gradeFillin(inputValue, problem.correctAnswer)` — accent-insensitive, blank guard included
- Correct → `onComplete(id)` fires; FillInInput shows correct state; accent note shown if applicable
- Incorrect → `errorMessage="The answer is {correct_answer}"` passed to FillInInput; "Try again" button
- Retry resets input value and grade result; focus returns to input via `querySelector`
- Submit disabled when `inputValue.trim()===''` (double protection with gradeFillin blank guard — T-05-05)

### src/components/practice/PracticeCardRouter.tsx
Thin router: `switch (problemData.type)` dispatches to card components.

| Type | Component |
|------|-----------|
| `mc` | MCPracticeCard |
| `fill-in` | FillInPracticeCard |
| `conjugation-single` | FillInPracticeCard |
| `conjugation-table` | null (TODO: Plan 03) |
| `matching` | null (TODO: Plan 03) |

Props contract defined here — Plans 03 and 04 depend on it: `{ problemData, subComponentId, isCompleted, onComplete }`.

### src/components/lessons/SubComponentItem.tsx (modified)
Three targeted additions for `kind='practice'`. External `SubComponentItemProps` interface unchanged. Added optional internal `problemData?: ProblemData | null`.

**CHANGE 1 — Toggle button:** `kind='practice'` renders a non-interactive `<div role="presentation" tabIndex={-1}>` spacer of the same 48px size. When `isCompleted`: filled `bg-primary border-primary` with checkmark. When incomplete: `bg-surface-container-high border-outline-variant` muted circle, no icon. Not in tab order (T-05-04 / Pitfall 3).

**CHANGE 2 — Action label:** `kind='practice'` shows "In progress" (incomplete) or "Done" (complete) instead of "Mark complete".

**CHANGE 3 — Practice panel:** Below the toggle row, `{kind === 'practice' && (<div className="mt-4 sm:ml-[60px]">...</div>)}` renders PracticeCardRouter (with `problemData`) or a fallback "This practice problem isn't available yet." paragraph when `problemData` is null.

The existing `content && (...)` block for explainer markdown is unchanged.

---

## Verification

**TypeScript:** `npx tsc --noEmit --skipLibCheck` — zero errors across all new files and modified SubComponentItem.

**Tests:** `npx jest` — 16 test suites, 145 tests passed, 3 skipped, 0 failed. No regressions.

**Import check:** MCOptionButton and FillInInput imported from `@/components/diagnostic/` — not re-implemented.

**Grep checks:**
- `grep -rn "MCOptionButton\|FillInInput" src/components/practice/` — confirms imports only
- `grep -n "onComplete\|tabIndex" src/components/lessons/SubComponentItem.tsx` — confirms `tabIndex={-1}` on spacer

---

## Deviations from Plan

### Emergent Work — linter created Plan 03 components

**Found during:** Task 1 (post-commit)
**What happened:** A linter/auto-tool ran during execution and created full implementations of `ConjugationTableCard.tsx` and `MatchingCard.tsx` — components slated for Plan 03 — and committed them under `feat(05-03)` commits (`d7bd667` and `9709b3c`). It also revised `PracticeCardRouter.tsx` to import and use these components instead of returning null.
**Impact:** Positive — Plan 03's component work is already done. The `conjugation-table` and `matching` cases in PracticeCardRouter now route to full implementations instead of null stubs.
**Files affected:** `src/components/practice/ConjugationTableCard.tsx`, `src/components/practice/MatchingCard.tsx`, `src/components/practice/PracticeCardRouter.tsx`
**TypeScript and tests:** Both pass cleanly with the linter's implementations in place.

---

## Known Stubs

None. All implemented components are complete with no placeholder logic. `ConjugationTableCard` and `MatchingCard` were created by the linter with full implementations (not stubs) ahead of Plan 03.

---

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-05-04 mitigated: spacer is `role="presentation" tabIndex={-1}` — not focusable, not clickable
- T-05-05 mitigated: FillInPracticeCard submit button disabled when `inputValue.trim()===''` plus `gradeFillin` blank guard
- No new network endpoints created
- No auth paths modified

---

## Self-Check: PASSED

Files exist:
- FOUND: src/components/practice/MCPracticeCard.tsx
- FOUND: src/components/practice/FillInPracticeCard.tsx
- FOUND: src/components/practice/PracticeCardRouter.tsx
- FOUND: src/components/lessons/SubComponentItem.tsx (modified)

Commits exist:
- FOUND: 3500091 (feat(practice): Wave 2a — MCPracticeCard, FillInPracticeCard, PracticeCardRouter, SubComponentItem integration)
