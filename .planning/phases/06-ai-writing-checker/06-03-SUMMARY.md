---
phase: 06-ai-writing-checker
plan: 03
subsystem: ui-component
tags: [react, client-component, fetch, server-action, testing-library, written-card]

# Dependency graph
requires:
  - phase: 06-02
    provides: WrittenProblem type, POST /api/check-writing (429 rate-limit contract), writing_submissions table

provides:
  - WrittenCard client component at src/components/practice/WrittenCard.tsx
  - PracticeCardRouter 'written' case — TypeScript exhaustiveness satisfied
  - SubComponentItem writing branch — spacer, label, content exclusion, writing panel

affects: [06-04-lesson-page-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "handleSubmit try/catch/finally: setFeedback in try/catch, onComplete+markSubComponentComplete in finally (D-05 ordering)"
    - "Auto-resize textarea via ref: style.height='auto' then scrollHeight+'px' on each change (D-01)"
    - "Rate-limit detection via res.status === 429 (matches 06-02 test contract — not data.rateLimited)"

key-files:
  created:
    - src/components/practice/WrittenCard.tsx
  modified:
    - src/components/practice/PracticeCardRouter.tsx
    - src/components/lessons/SubComponentItem.tsx

key-decisions:
  - "Rate-limit response detected by res.status === 429 (not data.rateLimited) — aligned with 06-02 deviation where route returns 429 not 200+rateLimited"
  - "Feedback display uses bg-surface-container + border-outline-variant — no tertiary/green tokens per CLAUDE.md rule 3"
  - "markSubComponentComplete called in finally block after setFeedback ensures feedback renders before completion (T-06-12)"

# Metrics
duration: 25min
completed: 2026-06-25
---

# Phase 06 Plan 03: WrittenCard Component + Router Wiring Summary

**WrittenCard client component built with auto-resize textarea, word count, 429-aware rate-limit handling, and wired through PracticeCardRouter and SubComponentItem; all 6 unit tests green**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-25T21:24:00Z
- **Completed:** 2026-06-25T21:49:00Z
- **Tasks:** 2
- **Files modified:** 3 (WrittenCard.tsx new, PracticeCardRouter.tsx, SubComponentItem.tsx)

## Accomplishments

- Created `WrittenCard` with auto-resizing textarea (ref-based scrollHeight), live word count, "Check my writing" button with spinner, try/catch/finally submit flow handling 429 rate-limit and network errors, and isCompleted-on-mount revisit case (shows initialFeedback, textarea disabled)
- Updated `PracticeCardRouter` with `WrittenCard` import, `initialFeedback?` prop, and `case 'written'` — TypeScript discriminated union exhaustiveness now satisfied for all 6 ProblemData variants
- Updated `SubComponentItem` with 5 changes: writing kind uses non-interactive spacer, "In progress"/"Done" label, excluded from markdown content block, writing panel renders PracticeCardRouter with initialFeedback pass-through, `initialFeedback?` added to internal props
- All 6 WrittenCard.test.tsx tests pass; full suite 156/156 tests green (18 suites); zero TypeScript errors

## Task Commits

1. **Task 1: WrittenCard component** — `ac8eae1` (feat)
2. **Task 2: Wire through PracticeCardRouter and SubComponentItem** — `21d1d99` (feat)

## Files Created/Modified

- `src/components/practice/WrittenCard.tsx` — Full client component: textarea, word count, fetch submit, rate-limit + error handling, feedback display
- `src/components/practice/PracticeCardRouter.tsx` — Added WrittenCard import, initialFeedback prop, case 'written' branch
- `src/components/lessons/SubComponentItem.tsx` — 5 changes for writing kind: spacer, label, content exclusion, writing panel, initialFeedback internal prop

## Decisions Made

- **Rate-limit detection uses res.status === 429**: Plan spec said `data.rateLimited`, but 06-02 deviated to return HTTP 429 with `{ error: 'rate_limited' }`. WrittenCard aligns with the actual API contract and test assertions. The `<important_contract_note>` in the execution prompt correctly flagged this; implementation uses `res.status === 429`.
- **Feedback box tokens**: `bg-surface-container border border-outline-variant` — no green tokens. Comment in source explicitly prohibits `text-tertiary`/`bg-tertiary`/`border-tertiary` per CLAUDE.md rule 3.
- **markSubComponentComplete in finally**: Called after try/catch sets feedback state. JavaScript's finally block executes after the catch block completes, so feedback state is set before the server action fires (T-06-12 mitigation satisfied).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rate-limit check uses res.status === 429, not data.rateLimited**
- **Found during:** Task 1 (pre-implementation review of test file and 06-02-SUMMARY)
- **Issue:** Plan spec and contract note specified `data.rateLimited` check, but 06-02 actually returns 429. The test file (line 78) confirms `status: 429` and `{ error: 'rate_limited' }`. Using `data.rateLimited` would miss the rate-limit case entirely.
- **Fix:** `handleSubmit` checks `res.status === 429` before calling `res.json()` — matches actual API contract.
- **Files modified:** `src/components/practice/WrittenCard.tsx`
- **Verification:** `on fetch returning 429, shows rate limit message` test passes

## Known Stubs

None — WrittenCard is fully wired to the real API route. The lesson page integration (Plan 04) will wire `initialFeedback` from the DB query; until then, `initialFeedback` defaults to null on fresh visits.

## Threat Flags

No new threat surface. All T-06-10 through T-06-12 mitigations implemented:
- T-06-10: WrittenCard body sends only `subComponentId` and `text` — user_id derived server-side in route
- T-06-11: Feedback box uses warm neutral tokens only — no tertiary/green
- T-06-12: finally block ordering ensures feedback state set before onComplete fires

## Self-Check: PASSED

- `src/components/practice/WrittenCard.tsx` — exists, created
- `src/components/practice/PracticeCardRouter.tsx` — exists, contains `case 'written'` (count: 1)
- `src/components/lessons/SubComponentItem.tsx` — exists, contains `kind === 'writing'` (count: 3)
- Commits `ac8eae1` and `21d1d99` — verified in git log
- Zero TypeScript errors
- 156/156 tests pass
