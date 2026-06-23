---
phase: 04-diagnostic-system
plan: 03
wave: 2
status: complete
requirements: [DIAG-01]
---

# 04-03 Summary — Placement diagnostic vertical slice (DIAG-01)

## What was built

The end-to-end placement path: a first-time student starts the placement
diagnostic, answers 10 server-drawn questions one at a time, the server grades +
scores + places them, and a result screen shows the level (no percentage).

## Key files

- **created** `src/actions/diagnostic.ts` — `startPlacementDiagnostic`,
  `submitDiagnosticAnswer` Server Actions.
- **created** `__tests__/diagnostic/actions.test.ts` — 5 security-contract tests.
- **created** `src/app/diagnostic/placement/page.tsx` — placement Server Component flow.
- **created** 5 components: `DiagnosticProgress`, `MCOptionButton`, `FillInInput`,
  `DiagnosticQuestionCard`, `DiagnosticResult`.

## Security decisions (the point of the slice)

- **Answer key never reaches the client.** `correct_answer` is fetched via the ADMIN
  client inside the action (authenticated lacks the column grant, Plan 02); page/RSC
  queries project only id/question_text/type/options/lesson_tag. [T-04-ID-02]
- **Score never trusted from client.** `submitDiagnosticAnswer` recomputes the score
  via `computeScore` over DB-stored answers; the input schema has no score field. [T-04-Tamp-03]
- **Unlock is admin-only.** The watermark/`current_level_id` write goes through
  `createAdminClient()`; tests assert the admin update ran with the server-derived
  user_id. [T-04-EoP-02]
- **One-time placement.** A completed attempt blocks `startPlacementDiagnostic`
  (→ /dashboard) and the page redirects completed visits to /dashboard unless on the
  post-submit `?result=1` landing. [T-04-EoP-03 / D-P02]
- **Phantom-answer guard.** Inputs validated as UUID (zod) before any DB call;
  questionId must be in the attempt's drawn set; answers written under the RLS join.

## UI decisions

- Bespoke components, DESIGN tokens only. Green (tertiary) appears only in
  correct-answer states; soft accent note uses text-secondary. a11y:
  progressbar / radiogroup / radio / alert roles. Result uses the guillemet motif,
  no percentage (D-P05).
- Completion redirects to `/diagnostic/placement?result=1` so the result shows once
  while keeping the D-P02 dashboard guard for later visits.

## Verification

- `npx jest --testPathPattern="diagnostic"` → 33 passed (scoring + gating + actions).
- `npx tsc --noEmit` → no errors in src/actions, src/components/diagnostic,
  src/app/diagnostic, __tests__/diagnostic. (Pre-existing script-scope tsc noise in
  auth/lessons/middleware test files is unrelated and jest-green.)
- `npx jest` full suite → 110 passed, 3 skipped, 0 failed.
- grep confirms `correct_answer` never appears in the placement page projection.

## Deferred to phase verification

- `next build` (RSC/client-server boundary) — run once after Wave 2 (04-04) so the
  level/dashboard pages and the placement flow build together.
- Browser UAT (fresh account ≥80% → French 2; <80% → French 1) per 04-VALIDATION.md.

## Commits

- `8949dc4` Server Actions + security tests
- `fd4994b` UI components + completion result flow
- `1c6db98` placement page flow

## Self-Check: PASSED
