---
phase: 04-diagnostic-system
plan: 05
wave: 3
status: complete
requirements: [DIAG-02]
---

# 04-05 Summary — End-of-level diagnostic + cooldown (DIAG-02)

## What was built

The advancement gate: after completing all lessons in a level, a student takes
the end-of-level diagnostic; passing advances the watermark (unlocks the next
level), failing shows the score + weak-area review + a 3-hour cooldown with a
live countdown, and retry re-draws from the pool.

## Key files

- **modified** `src/actions/diagnostic.ts` — `startEndOfLevelDiagnostic` (per-level
  cooldown re-check, fresh re-draw, resume) + end-of-level grading branch in
  `submitDiagnosticAnswer` (pass → admin watermark advance to level_number+1; fail →
  3h cooldown_until, no advance).
- **modified** `__tests__/diagnostic/actions.test.ts` — +4 end-of-level cases (9/9 total).
- **created** `src/components/diagnostic/CooldownCountdown.tsx` — live per-minute timer.
- **created** `src/components/diagnostic/DiagnosticResultFail.tsx` — fail screen.
- **created** `src/app/diagnostic/end-of-level/[levelSlug]/page.tsx` — flow + pass/fail render.
- **modified** `src/app/levels/[levelSlug]/page.tsx` — gated end-of-level CTA.

## Decisions

- **Pass advances watermark to `level_number + 1`** via the admin client; next level
  id resolved by query (no hard-coded literal). Max level reached → still completes,
  watermark advances harmlessly. [D-E02 / D-P04 / T-04-EoP-05]
- **Fail sets a 3-hour per-level cooldown** (`computeCooldownUntil`) and does NOT
  advance the watermark. [D-E03]
- **Cooldown re-checked server-side** in `startEndOfLevelDiagnostic`
  (`isCooldownActive`) — the client countdown is display-only; a tampered clock
  cannot bypass it. [T-04-Tamp-06]
- **Retry re-draws** a fresh set via `drawQuestions` (D-E04); the partial unique index
  guards concurrent starts.
- **Weak-area review derived from `lesson_tag`** of incorrectly-answered questions
  (joined `is_correct=false`), mapped to lessons by slug — the answer key is never
  read for this. [D-D05 / T-04-ID-04]
- **CTA gated by `!isLocked && deriveAllLessonsComplete`** (Pitfall 7) — never on a
  locked or incomplete level.
- Fail flow uses no green tokens (CLAUDE.md rule 3).

## Verification

- `npx jest --testPathPattern="diagnostic"` → all green (scoring + gating + 9 actions).
- `npx jest` full suite → 121 passed, 3 skipped, 0 failed.
- `npx tsc --noEmit` → no errors in the new components, the end-of-level page, the
  modified level page, or the action branch.
- `npx next build` → green; `/diagnostic/end-of-level/[levelSlug]` route compiles.
- `grep -c correct_answer` on the end-of-level page → 0 (answer key never projected).

## Commits

- `21dab04` end-of-level action branch + cooldown
- `ff614c7` CooldownCountdown + DiagnosticResultFail
- `7f455bc` end-of-level page flow + gated level-page CTA

## Self-Check: PASSED
