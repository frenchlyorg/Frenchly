# Phase 5 Plan 04 — Summary

**Wave 3: Lesson integration + end-to-end wiring**
**Status:** Complete ✓
**Date:** 2026-06-24

---

## What was built

### Server-side parse (lesson page)
- `app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — calls `parseProblemContent` on each sub-component server-side; enriches the array with `problemData` before passing to the client.

### SubComponentList passthrough
- `src/components/lessons/SubComponentList.tsx` — added `problemData?: ProblemData | null` to the item type and passes it through to `SubComponentItem`.

### SubComponentItem practice panel
- `kind === 'practice'` now renders `PracticeCardRouter` below the title row instead of content markdown.
- Toggle button replaced by a non-interactive spacer (role="presentation") — completion driven by card result, not manual click.
- Action label: "In progress" / "Done" for practice kind.
- Guard: `{content && kind !== 'practice' && (` — prevents raw JSON from leaking above the card.

### Nav update
- Dashboard link added (shown when logged in).
- Username replaced by "My account" dropdown with Account settings, My progress, Log out.
- Click-outside close via `useRef` + `useEffect`. Mobile drawer has flat equivalent.

### Bug fixes shipped this wave
| Bug | Fix |
|-----|-----|
| Raw JSON rendered above practice card | `kind !== 'practice'` guard on content block |
| Missing `key` on `ConjugationTableCard` fragments | `<React.Fragment key={pronoun}>` + `import React` |
| Hydration mismatch on `MatchingCard` | Initialize unshuffled, shuffle in `useEffect` |
| Fill-in input empty after completion | `useState(isCompleted ? problem.correctAnswer : '')` |
| Duplicate conjugation-table DB row | Deleted by ID |
| Missing matching DB row | Re-inserted at position 21 |

### UX improvements
- Conjugation table split into 2-column layout (je/tu/il | nous/vous/ils).
- Matching card shows pair-number badges (1, 2, 3…) linking left ↔ right items.
- Completed fill-in shows correct answer in disabled input.

---

## Smoke test results (2026-06-24)

All 5 problem types verified in greetings lesson:
- [x] Multiple choice — select/submit/retry
- [x] Fill-in-the-blank — correct answer shown on completion
- [x] Conjugation single — accent-leniency working
- [x] Conjugation table — 2-column layout, per-cell grading
- [x] Matching — pair numbering, shuffle client-only (no hydration error)

Console: zero errors.

---

## Phase 5 complete ✓
