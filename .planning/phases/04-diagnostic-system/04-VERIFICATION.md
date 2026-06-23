---
phase: 04-diagnostic-system
verified: 2026-06-23T17:15:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "First-time student sees DiagnosticGate on dashboard visit"
    expected: "DiagnosticGate interstitial renders with 'Start placement diagnostic' CTA; no lesson content visible"
    why_human: "Server Component gate logic is correct in code but render behavior on a live session needs visual confirmation"
  - test: "Complete placement diagnostic and verify level lock state"
    expected: "After scoring < 80%, student is placed at French 1; navigating to /levels/french-2 shows LockBadge and locked-unlock prompt"
    why_human: "Lock derivation from watermark is a DB-driven render path; requires a real authenticated session to exercise"
  - test: "Pass end-of-level diagnostic and verify French 2 unlocks"
    expected: "After passing (≥ 80%), /levels/french-2 no longer shows LockBadge; end-of-level page shows 'Level complete' with 'Continue to next level' link"
    why_human: "Watermark advance is a write via adminClient that requires a live Supabase session to verify"
  - test: "Fail end-of-level diagnostic and verify cooldown + weak-area review"
    expected: "DiagnosticResultFail shows score (e.g. '6 of 10 right'), weak lessons listed, retry button disabled with countdown"
    why_human: "Requires a live session and a real attempt with known wrong answers to exercise the weak-area derivation path"
  - test: "Verify correct_answer never appears in browser network tab"
    expected: "No PostgREST response from /diagnostic_questions includes a correct_answer field"
    why_human: "Column-level grant is enforced at the DB layer — cannot confirm via grep; requires DevTools network inspection on a live session"
---

# Phase 4: Diagnostic System Verification Report

**Phase Goal:** First-time students take a placement diagnostic and are placed at the correct level. After completing a level, students take an end-of-level diagnostic; passing it unlocks the next level.
**Verified:** 2026-06-23T17:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | First-time user is prompted to take the placement diagnostic before accessing any lesson | VERIFIED | `dashboard/page.tsx:31-39` queries `diagnostic_attempts` for completed placement; returns `<DiagnosticGate>` when absent. `levels/[levelSlug]/page.tsx:82-91` mirrors the same guard. |
| 2 | Diagnostic result places student at French 1 or French 2 (based on score) | VERIFIED | `scoring.ts:58-60` `derivePlacement`: ≥ 0.8 → 2, else 1. `diagnostic.ts:251-279` computes score server-side from DB answers, calls `derivePlacement`, writes `unlocked_through_level_number` via admin client. |
| 3 | Student placed at French 1 sees French 2 as locked | VERIFIED | `locking.ts:26-44` `deriveIsLevelLocked`: when `unlockedThroughLevelNumber` is set, locked iff `levelNumber > watermark`. `levels/[levelSlug]/page.tsx:112-119` passes both the watermark and `levelId/levelNumber` to the function; renders `<LockBadge>` when locked. |
| 4 | Student who completes French 1 and passes the end-of-level diagnostic sees French 2 unlock | VERIFIED | `diagnostic.ts:314-333`: on `outcome === 'pass'`, the action resolves `levelNumber + 1`, writes `unlocked_through_level_number: levelNumber + 1` via `createAdminClient()`, revalidates `/dashboard`. End-of-level page `304-133` renders 'Level complete' with link to next level slug. |
| 5 | Student who fails the end-of-level diagnostic is shown feedback and can retry | VERIFIED | `diagnostic.ts:300-303`: on fail, `cooldown_until` set to `completedAt + 3h`. End-of-level page `137-167` fetches wrong question ids, derives weak lessons by `lesson_tag`, renders `<DiagnosticResultFail>` with score, weak-lesson links, and cooldown-gated retry button. `startEndOfLevelDiagnostic` re-draws a fresh set (D-E04). |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/diagnostics/types.ts` | Domain types | VERIFIED | `DiagnosticQuestion`, `DiagnosticAttempt`, `GradeResult`, `DiagnosticType`; `correct_answer` documented as SERVER-ONLY |
| `src/lib/diagnostics/scoring.ts` | Pure scoring functions | VERIFIED | `gradeAnswer`, `computeScore`, `derivePlacement` (≥0.8→F2), `derivePassFail`, `drawQuestions` (Fisher-Yates) |
| `src/lib/diagnostics/gating.ts` | Pure gating functions | VERIFIED | `computeCooldownUntil`, `isCooldownActive`, `formatCooldownRemaining`, `deriveAllLessonsComplete` |
| `src/lib/lessons/locking.ts` | Numeric watermark lock derivation | VERIFIED | `unlockedThroughLevelNumber` parameter added; no hard-coded ceiling; null fallback to Phase 3 UUID rule |
| `src/actions/diagnostic.ts` | Server Actions (start/submit/grade/place) | VERIFIED | 338 lines; `startPlacementDiagnostic`, `startEndOfLevelDiagnostic`, `submitDiagnosticAnswer`; user_id derived server-side; score computed from DB answers; watermark written via `createAdminClient()` only |
| `src/components/diagnostic/DiagnosticGate.tsx` | Mandatory placement interstitial | VERIFIED | 50 lines; guillemet heading; single Link CTA to `/diagnostic/placement`; no dismiss affordance |
| `src/components/diagnostic/DiagnosticResultFail.tsx` | Fail screen with weak-area review + cooldown | VERIFIED | Shows score, weak-lesson links, live cooldown countdown, retry button disabled when cooldown active |
| `src/app/diagnostic/placement/page.tsx` | Placement diagnostic page | VERIFIED | Auth guard; one-time guard (D-P02); answer key not projected (selects `id, question_text, type, options, lesson_tag`); result screen on `?result=1` |
| `src/app/diagnostic/end-of-level/[levelSlug]/page.tsx` | End-of-level diagnostic page | VERIFIED | Auth guard; start/in-progress/pass/fail states; weak-area derivation uses `lesson_tag + is_correct`, not answer key |
| `src/app/dashboard/page.tsx` | Dashboard with placement gate | VERIFIED | Placement gate wired at line 31-39; renders `<DiagnosticGate>` before any lesson content |
| `src/app/levels/[levelSlug]/page.tsx` | Level page with gate + watermark lock + EoL CTA | VERIFIED | Placement gate at line 82-91; `deriveIsLevelLocked` called with watermark; `showEndOfLevelCta` gated on `!isLocked && allSubComponentsComplete` |
| `supabase/migrations/20260622_phase4_diagnostic.sql` | 3 tables + watermark column + RLS + seed | VERIFIED | `diagnostic_questions`, `diagnostic_attempts`, `diagnostic_answers`; column-scoped GRANT excludes `correct_answer` from `authenticated`; concurrency guard unique index; `unlocked_through_level_number` added to profiles; 14 questions seeded per level |
| `__tests__/diagnostic/scoring.test.ts` | Scoring unit tests | VERIFIED | 37 tests across all 3 test files; all pass |
| `__tests__/diagnostic/gating.test.ts` | Gating unit tests | VERIFIED | Part of 37-test suite; all pass |
| `__tests__/diagnostic/actions.test.ts` | Action security-contract tests | VERIFIED | Tests: invalid UUID throws before DB call; unauthenticated redirects to /login; score computed from DB answers (not client); watermark write via admin client only; one-time guard blocks retake |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `dashboard/page.tsx` | `DiagnosticGate` | import + conditional render | WIRED | Line 3 import; line 39 `return <DiagnosticGate hasInProgress={!!inProgress} />` |
| `levels/[levelSlug]/page.tsx` | `DiagnosticGate` | import + conditional render | WIRED | Line 21 import; line 90 render |
| `levels/[levelSlug]/page.tsx` | `deriveIsLevelLocked` | import + call with watermark | WIRED | Line 16 import; line 112-119 call passing `unlockedThroughLevelNumber` |
| `levels/[levelSlug]/page.tsx` | `deriveAllLessonsComplete` | import + call | WIRED | Line 17 import; line 143 call; result feeds `showEndOfLevelCta` |
| `levels/[levelSlug]/page.tsx` | `startEndOfLevelDiagnostic` | import + form action bind | WIRED | Line 18 import; line 145 `.bind(null, {levelId})`; line 198 `<form action={startEndOfLevel}>` |
| `placement/page.tsx` | `startPlacementDiagnostic` | import + form action | WIRED | Line 17 import; line 89 `<form action={startPlacementDiagnostic}>` |
| `submitDiagnosticAnswer` | `gradeAnswer` | server-side call with admin-fetched question | WIRED | `diagnostic.ts:211` — answer key fetched via admin client, graded server-side |
| `submitDiagnosticAnswer` | `createAdminClient()` | watermark write | WIRED | `diagnostic.ts:272,329` — admin client used exclusively for profile watermark update |
| `DiagnosticResultFail` | `CooldownCountdown` | import + render | WIRED | `DiagnosticResultFail.tsx:18` import; line 87 `<CooldownCountdown ... onExpire={() => setActive(false)} />` |
| `end-of-level page` | `DiagnosticResultFail` | import + render on failed attempt | WIRED | Line 20 import; line 160 `<DiagnosticResultFail ... />` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `placement/page.tsx` | `attempt`, `question` | `supabase.from('diagnostic_attempts')`, `supabase.from('diagnostic_questions')` | Yes — DB queries scoped by `user_id` and drawn ids | FLOWING |
| `dashboard/page.tsx` | `completedPlacement` | `supabase.from('diagnostic_attempts')` filtered by `user_id + status` | Yes | FLOWING |
| `levels/[levelSlug]/page.tsx` | `isLocked` | `profile.unlocked_through_level_number` from `supabase.from('profiles')` | Yes — watermark column written by admin action | FLOWING |
| `end-of-level/[levelSlug]/page.tsx` | `weakLessons` | `diagnostic_answers` (is_correct=false) → `diagnostic_questions` (lesson_tag) → `level.lessons` | Yes — real DB join path | FLOWING |
| `submitDiagnosticAnswer` | `score` | `supabase.from('diagnostic_answers').select('question_id, is_correct')` then `computeScore` | Yes — DB-stored answers, never client score | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All diagnostic tests pass | `npx jest --testPathPattern="diagnostic"` | 37 tests, 3 suites — all PASS | PASS |
| Full test suite passes | `npx jest` | 121 passed, 3 skipped, 0 failed (14 suites) | PASS |
| TypeScript compilation clean | `npx tsc --noEmit` | Exit code 0, no output | PASS |

---

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| DIAG-01 | 04-01, 04-02, 04-03, 04-04 | Placement diagnostic: one-time, score server-side, admin unlock | SATISFIED | `startPlacementDiagnostic` + `submitDiagnosticAnswer` placement branch; one-time guard at `diagnostic.ts:69`; answer key via admin client at `diagnostic.ts:201-208`; watermark via `createAdminClient()` at `diagnostic.ts:272-279` |
| DIAG-02 | 04-01, 04-02, 04-05 | End-of-level diagnostic: pass→unlock, fail→cooldown+review, retry redraws | SATISFIED | `submitDiagnosticAnswer` end-of-level branch (`diagnostic.ts:291-336`); `startEndOfLevelDiagnostic` re-draws fresh set on each new attempt; `DiagnosticResultFail` weak-area + cooldown UI |
| DIAG-03 | 04-02, 04-04 | Watermark level locking: numeric, no ceiling, null fallback | SATISFIED | `locking.ts:33-34` numeric watermark; no hard-coded level number; null falls back to Phase 3 UUID rule; `levels/[levelSlug]/page.tsx:112-119` passes watermark to lock derivation |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/dashboard/page.tsx` | 58–65 | Placeholder lesson card with "coming soon" copy | Info | Not a phase 4 concern — dashboard lesson content is Phase 7 (French 1 Content). The placement gate and DiagnosticGate are fully implemented above this placeholder. No impact on DIAG-01/02/03. |

No TBD, FIXME, or XXX markers found in any Phase 4 files. No stub implementations detected in diagnostic domain files.

---

### Human Verification Required

#### 1. DiagnosticGate renders for first-time student

**Test:** Sign up a fresh account, immediately navigate to `/dashboard`.
**Expected:** DiagnosticGate interstitial renders with guillemet heading "« Before you begin »" and "Start placement diagnostic" button; no lesson content visible beneath it.
**Why human:** Server Component conditional render — code is correct but visual render requires a live authenticated session.

#### 2. Placement result places student at French 1 and locks French 2

**Test:** Complete the placement diagnostic with low scores (answer incorrectly). Then navigate to `/levels/french-2`.
**Expected:** LockBadge appears on French 2; "Complete the French 1 placement test to unlock French 2" message is shown. `/levels/french-1` is accessible without a lock badge.
**Why human:** Requires a real DB session with `unlocked_through_level_number` written and level page rendering the watermark-derived lock state.

#### 3. Passing end-of-level diagnostic unlocks the next level

**Test:** As a French 1 student, complete all French 1 lessons (or use the admin client to mark them complete), then take and pass the end-of-level diagnostic (answer ≥ 8/10 correctly). Navigate to `/levels/french-2`.
**Expected:** LockBadge gone; French 2 lessons are accessible. End-of-level page shows "Level complete" with "Continue to next level" link.
**Why human:** Watermark advance is a live DB write via admin client; lock state derives from the updated `profiles.unlocked_through_level_number`.

#### 4. Failing end-of-level diagnostic shows feedback and cooldown

**Test:** Take the end-of-level diagnostic and deliberately fail (answer < 8/10). Observe the result screen.
**Expected:** Score displayed (e.g. "You got 5 of 10 right"), relevant weak-area lesson links shown, "Retry diagnostic" button disabled with a live countdown. After 3 hours (or by inspecting `cooldown_until` in DB), button enables.
**Why human:** Requires a real failed attempt with known wrong answers to verify weak-area derivation routes to the correct lesson links.

#### 5. Answer key (correct_answer) not exposed to browser

**Test:** Open DevTools Network tab, complete a placement diagnostic question, inspect the PostgREST response from `/diagnostic_questions`.
**Expected:** Response JSON does not contain a `correct_answer` field (column-scoped GRANT blocks it for `authenticated` role).
**Why human:** Column-level PostgreSQL grant enforcement cannot be verified by grep; requires live PostgREST inspection.

---

### Gaps Summary

No code gaps found. All 5 roadmap success criteria are implemented and verified at the code level. The dashboard contains a placeholder lesson card for future content (Phase 7) that is unrelated to phase 4 goals.

Human verification is required for 5 interactive/DB-live behaviors before this phase can be marked fully complete.

---

_Verified: 2026-06-23T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
