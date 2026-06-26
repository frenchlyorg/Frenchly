---
phase: 06-ai-writing-checker
reviewed: 2026-06-26T23:44:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/api/check-writing/route.ts
  - src/lib/practice/types.ts
  - src/lib/practice/schema.ts
  - src/components/practice/WrittenCard.tsx
  - src/components/practice/PracticeCardRouter.tsx
  - src/components/lessons/SubComponentItem.tsx
  - src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx
  - src/components/lessons/SubComponentList.tsx
findings:
  critical: 5
  warning: 4
  info: 1
  total: 10
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-26T23:44:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Phase 06 adds the AI writing checker: a server-side `/api/check-writing` route, `WrittenCard` client component, wiring through `PracticeCardRouter` and `SubComponentItem`, and lesson-page integration querying `writing_submissions` for revisit state. The overall architecture is sound — auth is correctly server-side, the Anthropic API key never reaches the client, and Zod validation gates the request body. However, five critical defects were found that affect data integrity, cost control, and authorization; four warnings address correctness edge cases.

---

## Critical Issues

### CR-01: Authorization gap — sub_component_id ownership never verified

**File:** `src/app/api/check-writing/route.ts:352`
**Issue:** The route validates that `subComponentId` is a UUID (Zod), and the `user_id` is always taken from the authenticated session. However, the route never checks that the requested `sub_component_id` belongs to a lesson the authenticated user is permitted to access. Any authenticated student can craft a POST body with an arbitrary valid UUID belonging to another student's lesson (or any row in `sub_components`) and the route will call Anthropic and write a `writing_submissions` row for it. This violates CLAUDE.md's authorization contract: "Students read/write only their own rows."

**Fix:**
```typescript
// After parsing subComponentId, verify the sub-component exists and
// belongs to a lesson the user can see. Simplest approach: confirm the
// sub_component_id exists in sub_components (RLS on lessons handles access).
const { data: scRow, error: scError } = await supabase
  .from('sub_components')
  .select('id')
  .eq('id', subComponentId)
  .single()

if (scError || !scRow) {
  return NextResponse.json({ error: 'Sub-component not found' }, { status: 404 })
}
```

---

### CR-02: Race condition — rate limit is not atomically enforced

**File:** `src/app/api/check-writing/route.ts:358-386`
**Issue:** The rate limit is implemented as SELECT COUNT → (if below limit) call Anthropic → INSERT. There is no transaction or row-level lock between the count check and the insert. If a student fires multiple concurrent requests (e.g., double-tap, retry under slow network), all concurrent requests read the same count below 10 and all proceed to call the Anthropic API and insert rows. The daily cap of 10 is silently exceeded. This is both a cost-control failure (unbounded Anthropic spend) and a violation of CLAUDE.md's rate-limiting requirement.

**Fix:**
Use a database-side atomic counter or enforce the limit via a unique partial index / PostgreSQL advisory lock. The simplest safe pattern for Supabase is to move the rate-limit check into the DB as a function that increments and checks atomically, or to accept slight over-limit on burst while adding a hard server-side per-minute cap via an in-memory token bucket (e.g., `lru-cache`). At minimum, add a short-circuit guard using `created_at >= now() - interval '1 second'` to reject obvious bursts:

```typescript
// Option: enforce idempotency by rejecting a second request within
// a short window for the same (user_id, sub_component_id) pair.
// Full fix requires a DB-side atomic counter or advisory lock.
```

---

### CR-03: Data loss — rate-limit audit upsert blocks future legitimate feedback storage

**File:** `src/app/api/check-writing/route.ts:371-385`
**Issue:** When the rate limit is exceeded, the route inserts an audit row via:
```typescript
await supabase.from('writing_submissions').upsert(
  { user_id, sub_component_id, feedback_text: null, created_at: ... },
  { onConflict: 'user_id,sub_component_id', ignoreDuplicates: true }
)
```
This inserts a row with `feedback_text: null` and no `submission_text`. The happy-path upsert at line 418 also uses `ignoreDuplicates: true`. Therefore: if a student hits the rate limit on their first attempt for a given exercise, the audit row is written. The next day, when they submit legitimately, the happy-path upsert silently does nothing — the `(user_id, sub_component_id)` conflict is hit and ignored. Their actual submission text and feedback are **never stored**. On revisit, `initialFeedback` is `null` and `initialSubmissionText` is `null` — the exercise shows the default fallback message despite the student having received real feedback.

**Fix:**
Remove the rate-limit audit upsert entirely (it records an artificial row that corrupts future writes), or change both upserts to `ignoreDuplicates: false` and use `UPDATE` semantics to overwrite with the latest values:

```typescript
// Remove the rate-limit audit upsert block (lines 371-385).
// The rate-limited response is sufficient feedback to the client.
// Alternatively, use a separate rate_limit_audit table that does not
// conflict with the writing_submissions unique constraint.
```

---

### CR-04: Double `markSubComponentComplete` call for every writing submission

**File:** `src/components/practice/WrittenCard.tsx:94` and `src/components/lessons/SubComponentList.tsx:57`
**Issue:** `WrittenCard.handleSubmit` does two things in `finally`:
1. Calls `onComplete(subComponentId)` — which resolves to `SubComponentList.handleComplete` → which calls `markSubComponentComplete(id)` (SubComponentList line 57).
2. Also directly calls `await markSubComponentComplete(subComponentId)` (WrittenCard line 94).

Every writing submission therefore fires `markSubComponentComplete` twice in rapid succession. If the server action is not perfectly idempotent (e.g., it does an INSERT rather than UPSERT, logs an event, or has side effects), this double-fire causes incorrect behavior. Even if currently idempotent, it creates two redundant network round-trips per submission. Other card types (`MCPracticeCard`, `FillInPracticeCard`) call `onComplete` only and rely on `SubComponentList.handleComplete` to call the server action — `WrittenCard` breaks this contract.

**Fix:**
Remove the direct `markSubComponentComplete` call from `WrittenCard.finally`. The `onComplete` callback already handles DB persistence through `SubComponentList`:

```typescript
// WrittenCard.tsx — finally block
} finally {
  setLoading(false)
  setDone(true)
  onComplete(subComponentId)
  // REMOVE: await markSubComponentComplete(subComponentId)
  // SubComponentList.handleComplete already calls markSubComponentComplete
  // when onComplete is fired.
}
```

---

### CR-05: `markSubComponentComplete` rejection unhandled in `finally` — unhandled promise rejection

**File:** `src/components/practice/WrittenCard.tsx:94`
**Issue:** The `finally` block contains `await markSubComponentComplete(subComponentId)`. The surrounding `try/catch` does not cover code in `finally` — if `markSubComponentComplete` rejects, the rejection propagates out of `handleSubmit` as an unhandled promise rejection. In React 18+, unhandled rejections in event handlers can crash the component tree or surface as console errors that are invisible to the user, while the UI is left in an inconsistent state (`done: true`, textarea disabled, but progress not actually saved).

**Fix:**
Wrap the call in its own try/catch, or (per CR-04 fix) remove it entirely:
```typescript
} finally {
  setLoading(false)
  setDone(true)
  onComplete(subComponentId)
  // If keeping the direct call (not recommended — see CR-04):
  try {
    await markSubComponentComplete(subComponentId)
  } catch (err) {
    console.error('[WrittenCard] markSubComponentComplete failed:', err)
  }
}
```

---

## Warnings

### WR-01: Rate-limit audit row omits `submission_text` — incomplete DB row

**File:** `src/app/api/check-writing/route.ts:371-381`
**Issue:** The upsert inside the rate-limit branch does not include `submission_text`. The happy-path upsert at line 418 does include it. If the `submission_text` column has a NOT NULL constraint in the DB schema, this audit upsert will silently fail (the error is caught and logged at line 429 but the route still returns 200 to the client). If the column is nullable, the row is written with `submission_text = null`, producing an audit row with no record of what the student actually tried to submit. Both outcomes are incorrect.

**Fix:**
Pass `submission_text: text` in the rate-limit audit upsert to match the happy-path schema, or remove the audit upsert (see CR-03).

---

### WR-02: `initialFeedback` fallback shows wrong message for rate-limited revisit

**File:** `src/components/practice/WrittenCard.tsx:47-49`
**Issue:** If a student was rate-limited on their first attempt (`rateLimited: true` returned), the WrittenCard shows `"You've used all your writing checks for today"` in-session. On the next day, when they revisit the lesson page, `isCompleted` is `true` (the sub-component was marked done by `finally`) but `initialFeedback` is `null` (because CR-03 means no feedback row was ever persisted, or the audit row stored `null`). The component therefore initializes to:
```tsx
initialFeedback ?? (isCompleted ? "We couldn't check that right now — keep going!" : null)
// → "We couldn't check that right now — keep going!"
```
The student sees the error-fallback message instead of the rate-limit message. Their writing was never actually checked; the exercise is permanently marked done; and the message displayed is misleading.

**Fix:** This is a downstream consequence of CR-03. Fixing CR-03 (preserving the rate-limit message in `feedback_text`) resolves this. Alternatively, store a `rate_limited: boolean` column so the revisit state can display the correct message.

---

### WR-03: `writing_submissions` query has no ORDER BY — non-deterministic row selection on multi-row edge case

**File:** `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx:118-123`
**Issue:** The query fetches `writing_submissions` with `.in('sub_component_id', writingIds)` but no `.order()`. The `feedbackMap` and `submissionTextMap` are built via `Object.fromEntries`, which in JavaScript takes the last entry for any duplicate key. If the DB unique constraint on `(user_id, sub_component_id)` ever allows or allowed duplicates (e.g., before the constraint was applied, or if the table uses soft deletes), the displayed feedback is non-deterministic. The most recent feedback is not guaranteed to be shown.

**Fix:**
```typescript
await supabase
  .from('writing_submissions')
  .select('sub_component_id, feedback_text, submission_text')
  .eq('user_id', user.id)
  .in('sub_component_id', writingIds)
  .order('created_at', { ascending: false })
```

---

### WR-04: Debug `console.log` of Anthropic usage on every request

**File:** `src/app/api/check-writing/route.ts:405`
**Issue:** `console.log('[check-writing] cache stats:', response.usage)` fires on every successful Anthropic call. In production this floods server logs with token counts for every student submission, making meaningful error signals harder to find. The comment marks it as "monitoring" but it is implemented as an unstructured log statement rather than a proper metric emission.

**Fix:**
Remove or gate behind a debug flag:
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('[check-writing] cache stats:', response.usage)
}
```
Or replace with a structured metric if a logging/observability stack is added later.

---

## Info

### IN-01: `aria-label` on `role="presentation"` element has no effect

**File:** `src/components/lessons/SubComponentItem.tsx:69`
**Issue:** The non-interactive spacer div has both `role="presentation"` and `aria-label="... — answer to complete"`. Per the ARIA specification, `role="presentation"` removes all semantic roles from the element, which also causes `aria-label` to be ignored by assistive technologies. Screen reader users receive no indication that this exercise requires an answer to complete.

**Fix:**
Either remove `aria-label` (it has no effect) or use a visually-hidden `<span>` adjacent to the spacer to provide accessible context:
```tsx
<div role="presentation" tabIndex={-1} className="...">
  {/* spacer */}
</div>
<span className="sr-only">{title} — answer to complete</span>
```

---

_Reviewed: 2026-06-26T23:44:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
