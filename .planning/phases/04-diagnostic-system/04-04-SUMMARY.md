---
phase: 04-diagnostic-system
plan: 04
wave: 2
status: complete
requirements: [DIAG-01, DIAG-03]
---

# 04-04 Summary — Watermark lock model + placement gate (DIAG-03)

## What was built

The consumer side of the watermark: generalized level locking to the numeric
`unlocked_through_level_number` watermark, and a forced placement gate on the
dashboard + level pages for first-time students.

## Key files

- **modified** `src/lib/lessons/locking.ts` — `deriveIsLevelLocked` adds optional
  `unlockedThroughLevelNumber`; locks when `levelNumber > watermark` (no ceiling),
  falls back to the Phase 3 UUID rule when the watermark is null.
- **modified** `__tests__/lessons/level.test.ts` — +4 watermark cases, 3 fallback
  cases preserved (10/10).
- **created** `src/components/diagnostic/DiagnosticGate.tsx` — mandatory placement
  interstitial (guillemet heading, single CTA, no skip), fresh + resume copy.
- **modified** `src/app/dashboard/page.tsx` — placement gate guard + watermark in profile select.
- **modified** `src/app/levels/[levelSlug]/page.tsx` — placement gate guard; passes
  watermark into `deriveIsLevelLocked`.

## Decisions

- **No hard-coded level ceiling** (D-S02): rule is `levelNumber > watermark`, extends
  to any number of future levels. French 2 placement keeps French 1 accessible (D-P04).
- **Graceful null fallback** (A3): profiles predating the watermark backfill keep the
  Phase 3 behaviour, so nothing regresses.
- **Gate is a Server Component check, not middleware** (Pitfall 4 / T-04-EoP-04):
  middleware cannot do the RLS read of `diagnostic_attempts`; the dashboard + level
  pages read placement state and render `DiagnosticGate` when no completed placement.
- **Existing lock UI reused unchanged** — `LevelCard`/`LockBadge` are driven by the
  derived `isLocked`; no UI rewrite.

## Verification

- `npx jest --testPathPattern="lessons/level"` → 10 passed (watermark + fallback).
- `npx tsc --noEmit` → no errors in the gate or the two modified pages.
- `npx jest` full suite → 117 passed, 3 skipped, 0 failed.
- grep confirms `DiagnosticGate` wired into both pages and watermark passed to `deriveIsLevelLocked`.

## Commits

- `c423171` watermark generalization of deriveIsLevelLocked + tests
- `579f431` DiagnosticGate + dashboard/level page gate guards

## Self-Check: PASSED
