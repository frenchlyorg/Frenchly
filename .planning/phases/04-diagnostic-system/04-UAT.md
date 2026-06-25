---
status: testing
phase: 04-diagnostic-system
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
  - 04-04-SUMMARY.md
  - 04-05-SUMMARY.md
started: 2026-06-23
updated: 2026-06-23
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold start smoke test
expected: |
  With the dev server running (`npm run dev`) and the phase-4 migration applied
  to the live DB, the app boots with no errors and you can load it logged out
  (login page) and logged in (dashboard) without server errors.
awaiting: user response

## Tests

### 1. Cold start smoke test
expected: Dev server starts clean; app loads logged out and logged in with no console/server errors; the phase-4 tables exist (migration already pushed).
result: [pending]

### 2. Placement gate for a first-time student
expected: On a FRESH account (no completed placement), visiting /dashboard (and /levels/french-1) shows the "« Before you begin »" gate with a single "Start placement diagnostic" button — NOT lesson content, and no skip/dismiss link.
result: [pending]

### 3. Placement flow end-to-end
expected: From the gate, clicking start opens the placement diagnostic; you answer 10 questions ONE at a time (MC or fill-in), with a progress bar; after the last answer a result screen shows your placed level inside guillemets ("« French 1 »" / "« French 2 »") with encouraging copy and NO percentage.
result: [pending]

### 4. Placement outcome locks/unlocks correctly
expected: Scoring ≥80% places you at French 2 (French 2 accessible, French 1 still accessible); scoring <80% places you at French 1 (French 2 shows a lock badge). The locked/unlocked state matches your score.
result: [pending]

### 5. Placement is one-time
expected: After completing placement, navigating back to /diagnostic/placement redirects you to /dashboard — you cannot retake it.
result: [pending]

### 6. End-of-level CTA gating
expected: The "Take the end-of-level diagnostic" CTA does NOT appear on /levels/french-1 until ALL French 1 lessons (every sub-component) are marked complete. Once all are complete (and the level is unlocked), the CTA appears.
result: [pending]

### 7. End-of-level pass unlocks the next level
expected: Taking the end-of-level diagnostic and scoring ≥80% shows "Level complete" / "Continue to next level"; afterward French 2's lock badge is gone (next level unlocked).
result: [pending]

### 8. End-of-level fail → feedback + cooldown
expected: Scoring <80% shows "Not quite yet", a "You got N of 10 right." line (no percentage), a "« Review these topics »" section linking the lessons behind missed questions, and a live cooldown countdown ("2h 14m" style) with the retry button disabled until it expires.
result: [pending]

### 9. Answer key never leaves the server (security)
expected: With browser DevTools → Network open during the diagnostic, no Supabase/PostgREST response for diagnostic_questions contains a `correct_answer` field. (Grading happens server-side via the admin client.)
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0

## Gaps

[none yet]
