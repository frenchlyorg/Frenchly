---
phase: 10-security-quality
plan: "03"
subsystem: testing
tags: [sec-05, test-coverage, diagnostic-unlock, watermark]
dependency_graph:
  requires: []
  provides: [SEC-05]
  affects: []
tech_stack:
  added: []
  patterns: ["Jest 29 unit tests", "supabase mock FIFO queues", "admin client mock for watermark writes"]
key_files:
  created: []
  modified: []
decisions:
  - "Watermark-advance assertion was pre-existing in actions.test.ts (lines 158-160 and 249-251) — no code change required; plan executed as verification only"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-06-28"
---

# Phase 10 Plan 03: SEC-05 Test Suite Verification Summary

Verified and confirmed the three SEC-05 critical-path automated tests are green. The diagnostic-unlock test already contained explicit watermark-advance assertions — no code was added.

## Task Results

### Task 1: Verify the three SEC-05 paths pass and confirm the watermark-advance assertion

**Status:** PASSED (verification only — no code changes needed)

#### Per-path test results

| SEC-05 Path | Test File | Tests | Result |
|-------------|-----------|-------|--------|
| Login flow | `__tests__/auth/login.test.ts` | 4 tests (signIn success, wrong password, role redirect, admin redirect) | PASS |
| Save-progress | `__tests__/lessons/actions.test.ts` | 5 tests (upsert, auth guard, UUID validation, revalidatePath, user_id from server) | PASS |
| Diagnostic-unlock | `__tests__/diagnostic/actions.test.ts` | 9 tests (security contract, placement guard, end-of-level grading) | PASS |

#### Watermark-advance assertion location

The explicit `unlocked_through_level_number: 2` assertion is present in TWO locations in `__tests__/diagnostic/actions.test.ts`:

1. **Line 158-160** — `submitDiagnosticAnswer — security contract` describe block, test "on completion: scores from DB answers and unlocks via the ADMIN client with server-derived user_id":
   ```
   expect(mockAdminUpdate).toHaveBeenCalledWith(
     expect.objectContaining({ unlocked_through_level_number: 2, current_level_id: 'level-2-uuid' })
   )
   ```
   **Status: PRE-EXISTING**

2. **Line 249-251** — `startEndOfLevelDiagnostic + end-of-level grading (DIAG-02)` describe block, test "passing advances the watermark to level_number + 1 via the ADMIN client":
   ```
   expect(mockAdminUpdate).toHaveBeenCalledWith(
     expect.objectContaining({ unlocked_through_level_number: 2, current_level_id: 'level-2-uuid' })
   )
   ```
   **Status: PRE-EXISTING**

Both assertions were already present before this plan ran. No code was added.

#### Full suite result

```
Test Suites: 18 passed, 18 total
Tests:       3 skipped, 156 passed, 159 total
Time:        6.417 s
```

All 18 suites green. 3 skipped tests are pre-existing (unrelated to SEC-05).

## Deviations from Plan

None — plan executed exactly as written. The assertion was pre-existing; the task required no code changes.

## Known Stubs

None.

## Threat Flags

None — this plan introduced no new runtime trust boundaries (verification only).

## Self-Check: PASSED

- `__tests__/auth/login.test.ts` — exists, 4 tests PASS
- `__tests__/lessons/actions.test.ts` — exists, 5 tests PASS
- `__tests__/diagnostic/actions.test.ts` — exists, 9 tests PASS
- `unlocked_through_level_number: 2` assertion present at lines 158-160 and 249-251
- Full suite: 18 suites green, 156 passing
