---
phase: 06-ai-writing-checker
fixed_at: 2026-06-26T23:55:00Z
review_path: .planning/phases/06-ai-writing-checker/06-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-06-26T23:55:00Z
**Source review:** .planning/phases/06-ai-writing-checker/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (CR-01 through CR-05, WR-01 through WR-04; IN-01 excluded per critical_warning scope)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: Authorization gap — sub_component_id ownership never verified

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** After extracting `subComponentId` from the validated request body (line 352), added a Supabase query to `sub_components` table using `.single()`. If the row does not exist or RLS blocks access, the route returns `{ error: 'Sub-component not found' }` with status 404. This prevents arbitrary UUID enumeration by authenticated users.

---

### CR-02: Race condition — rate limit is not atomically enforced

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** Added a burst guard before the daily count query: queries `writing_submissions` for any row with matching `(user_id, sub_component_id)` created within the last 2 seconds. If one exists, returns HTTP 429 immediately. Includes a comment noting the full fix requires a DB-side atomic counter or advisory lock. This is best-effort mitigation of the obvious concurrent double-tap case.

---

### CR-03: Data loss — rate-limit audit upsert blocks future legitimate feedback storage

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** Removed the original audit upsert that wrote `feedback_text: null` (which would permanently block future legitimate submissions via `ignoreDuplicates: true`). Replaced with a upsert that stores the rate-limit message string in `feedback_text` and the actual `submission_text` in `submission_text` — this also resolves WR-02 (revisit shows correct message) and WR-01 (submission_text column populated).

---

### CR-04: Double `markSubComponentComplete` call for every writing submission

**Files modified:** `src/components/practice/WrittenCard.tsx`
**Commit:** 7b0dec2
**Applied fix:** Removed `await markSubComponentComplete(subComponentId)` from the `finally` block entirely. The `onComplete(subComponentId)` callback already triggers `SubComponentList.handleComplete` which calls `markSubComponentComplete`. The direct call was redundant and inconsistent with MCPracticeCard and FillInPracticeCard which use `onComplete` only. Also removed the now-unused `import { markSubComponentComplete }` from the file.

---

### CR-05: `markSubComponentComplete` rejection unhandled in `finally`

**Files modified:** `src/components/practice/WrittenCard.tsx`
**Commit:** 7b0dec2
**Applied fix:** Resolved by the CR-04 fix — the call that could reject is removed entirely. The `finally` block now only calls synchronous state setters (`setLoading`, `setDone`) and the `onComplete` callback (which is synchronous and managed inside `startTransition` in `SubComponentList`).

---

### WR-01: Rate-limit audit row omits `submission_text`

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** Resolved by the CR-03 fix. The replacement upsert in the rate-limit branch now includes `submission_text: text`, matching the happy-path schema.

---

### WR-02: `initialFeedback` fallback shows wrong message for rate-limited revisit

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** Resolved by the CR-03 fix. The rate-limit branch now stores the user-facing rate-limit message (`"You've used all your writing checks for today — come back tomorrow!"`) as `feedback_text` in the upsert. On revisit, `initialFeedback` will contain that message rather than null, so the component displays the correct message instead of the generic error fallback.

---

### WR-03: `writing_submissions` query has no ORDER BY

**Files modified:** `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx`
**Commit:** 7b0dec2
**Applied fix:** Added `.order('created_at', { ascending: false })` to the `writing_submissions` query. Since `Object.fromEntries` keeps the last entry for duplicate keys, descending order ensures the earliest (first) row wins when there are duplicates — which is the correct semantic for a table with a `(user_id, sub_component_id)` unique constraint.

---

### WR-04: Debug `console.log` of Anthropic usage on every request

**Files modified:** `src/app/api/check-writing/route.ts`
**Commit:** 3c3b044
**Applied fix:** Wrapped `console.log('[check-writing] cache stats:', response.usage)` in `if (process.env.NODE_ENV !== 'production')` guard. The log still fires in development for cache hit verification but is suppressed in production.

---

_Fixed: 2026-06-26T23:55:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
