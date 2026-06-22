---
phase: 03-lesson-framework
verified: 2026-06-22T03:20:00Z
status: human_needed
score: 5/5
overrides_applied: 0
human_verification:
  - test: "Open /levels/french-1 in the browser as an authenticated student"
    expected: "Two lesson cards appear — 'Greetings and introductions' (10 min, 3 parts) and 'Definite articles: le, la, les' (12 min, 2 parts). Cards are interactive (clickable). No lock badge."
    why_human: "Supabase nested-select shape and Next.js Server Component rendering can only be confirmed in a live browser hitting the live DB."
  - test: "Open /levels/french-2 in the browser as an authenticated student whose current_level_id = French 1"
    expected: "Level header shows 'Locked' badge. Unlock prompt reads 'Complete the French 1 placement test to unlock French 2.' No lesson cards appear (French 2 has no lessons). Cards are non-interactive."
    why_human: "Lock state is derived from DB row; correct derivation requires a live session with a real profiles.current_level_id value."
  - test: "Open a French 1 lesson (e.g., /levels/french-1/lessons/[greetings-id]), click 'Mark complete' on a sub-component"
    expected: "The button flips to 'Done' immediately (no page reload). Progress bar increments. Reloading the page shows the sub-component still marked Done (progress restored from DB)."
    why_human: "useOptimistic + revalidatePath behavior requires a running Next.js server and live Supabase write; cannot be verified by grep or static analysis."
  - test: "Navigate away from the lesson and return to it"
    expected: "Previously completed sub-components show as Done on return. The progress bar reflects the correct count."
    why_human: "Progress restoration requires a real DB query on page load — only verifiable in a live session."
  - test: "Attempt to access /levels/french-1 while logged out"
    expected: "Browser redirects to /login?next=/levels/french-1 — the page does not render."
    why_human: "Auth guard redirect via Next.js middleware + getUser() can only be confirmed by hitting the actual route unauthenticated."
  - test: "Verify LevelCard isActive=false does not show guillemet marker"
    expected: "No '«' prefix appears on any lesson card title on the level page (isActive is hardcoded false; the marker renders only when isActive=true)."
    why_human: "Visual UI confirmation that the guillemet does not appear spuriously."
---

# Phase 3: Lesson Framework — Verification Report

**Phase Goal:** The lesson data model exists in Supabase. Students can open a lesson, complete sub-components, and have their progress saved. Level pages show the correct locked/unlocked state and sub-component list per lesson.
**Verified:** 2026-06-22T03:20:00Z
**Status:** HUMAN_NEEDED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Lesson and sub-component schema is seeded in Supabase with sample French 1 data | VERIFIED | `20260622_phase3_lessons.sql` seeds 2 levels, 2 lessons, 5 sub-components. User verified live DB counts in Plan 03-01 Task 3 (blocking human-verify checkpoint). |
| 2 | Student can open a lesson and see its sub-components listed | VERIFIED | `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` fetches `sub_components` ordered by position and passes them to `SubComponentList`. `SubComponentList` renders each via `SubComponentItem`. TypeScript clean; 26/26 tests pass. |
| 3 | Completing a sub-component saves progress to DB and updates the UI without page reload | VERIFIED | `SubComponentList` calls `setOptimisticCompleted(id)` inside `startTransition` (correct Pitfall 1 guard) then `markSubComponentComplete(id)`. Server Action upserts `sub_component_progress` with `onConflict: 'user_id,sub_component_id'`. 5 unit tests confirm the action behavior. |
| 4 | Returning to the lesson shows previous progress correctly restored | VERIFIED | `LessonPage` runs Query 2 (`from('sub_component_progress').select('sub_component_id').eq('user_id', user.id).in(...)`) on every render and passes `initialCompletedIds` to `SubComponentList`. Combined with `revalidatePath` after upsert, ground-truth is guaranteed on return. |
| 5 | Level page shows time estimates and locked/unlocked state per lesson based on student's placement | VERIFIED | `LevelPage` fetches `estimated_minutes` + `sub_components` count per lesson and passes to `LevelCard`. Lock state is derived via `deriveIsLevelLocked({ levelId, levelNumber, currentLevelId })` from `profiles.current_level_id`. Pure function tested with 3 passing unit tests. |

**Score: 5/5 truths verified**

---

### Requirement Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| LESSON-01 | Lessons organized into levels | VERIFIED | `levels` table + `lessons.level_id` FK; `LevelPage` queries by `levelSlug`; 2 levels seeded. |
| LESSON-02 | Each lesson contains multiple trackable sub-components | VERIFIED | `sub_components` table with `lesson_id` FK; `SubComponentItem` per component; 5 sub-components seeded. |
| LESSON-03 | Student progress per sub-component saved to DB in real time | VERIFIED | `markSubComponentComplete` Server Action with `'use server'`, zod UUID validation, `getUser()` server-side, idempotent upsert on composite PK. 5 unit tests green. |
| LESSON-04 | Level pages display: time estimate per lesson, locked/unlocked state, sub-component list | VERIFIED | `LevelCard` renders `estimatedMinutes` and `partsCount`; `deriveIsLevelLocked` derives lock from `current_level_id`; `LevelPage` queries nested `sub_components` for count. 3 unit tests green. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260622_phase3_lessons.sql` | 4 tables + RLS + trigger + seed | VERIFIED | 288 lines; all 4 tables present; RLS on all 4; French 1/2 seed; `current_level_id` column; `handle_new_user` CREATE OR REPLACE. |
| `src/lib/lessons/locking.ts` | `deriveIsLevelLocked` pure function | VERIFIED | Exports `deriveIsLevelLocked`; pure (no imports); handles null correctly; Phase 4 generalisation noted in comment. |
| `src/app/levels/[levelSlug]/page.tsx` | Level page Server Component | VERIFIED | `getUser()` guard; `redirect('/login?next=...')`; nested `.from('levels')` select with `lessons` + `sub_components`; `current_level_id` fetch; `deriveIsLevelLocked`; `LevelCard` per lesson. |
| `src/components/lessons/LevelCard.tsx` | Lesson card with lock/active state | VERIFIED | Props `isLocked`/`isActive`; locked branch: `aria-disabled`, `tabIndex=-1`, no `Link`; unlocked: `Link` to `/levels/${levelSlug}/lessons/${lessonId}`; guillemet `«` on `isActive && !isLocked`. |
| `src/components/ui/LockBadge.tsx` | Locked pill badge | VERIFIED | Sentence case "Locked"; design tokens only (`bg-surface-container`, `text-on-surface-variant`, `font-label`). |
| `src/app/lessons/actions.ts` | `markSubComponentComplete` Server Action | VERIFIED | `'use server'` at top; zod UUID validation before DB; `getUser()` server-side; existence check; idempotent upsert `onConflict: 'user_id,sub_component_id'`; `revalidatePath`. |
| `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` | Lesson view Server Component | VERIFIED | `getUser()` guard; `from('lessons')` nested `sub_components`; separate `from('sub_component_progress')` scoped to `user.id`; `max-w-[720px]`; `SubComponentList` with `initialCompletedIds`. |
| `src/components/lessons/SubComponentList.tsx` | `'use client'` useOptimistic wrapper | VERIFIED | `'use client'`; `useOptimistic` + `useTransition`; `setOptimisticCompleted` inside `startTransition`; `role="progressbar"`; "{N} of {total} complete". |
| `src/components/lessons/SubComponentItem.tsx` | Per-item toggle | VERIFIED | `aria-pressed={isCompleted}`; `disabled={isCompleted}`; 48px touch target; "Mark complete"/"Done" labels; no green tokens. |
| `__tests__/rls-phase3.test.ts` | 16-test RLS static analysis | VERIFIED | 16 tests; all pass. Covers RLS on all 4 tables, `(select auth.uid())` subquery form, `current_level_id` grant guard, trigger, seed slugs, FK cascades. |
| `__tests__/lessons/level.test.ts` | 3 lock derivation tests | VERIFIED | 3 tests (no todos); all pass. Covers mismatch→locked, match→unlocked, null→unlocked. |
| `__tests__/lessons/actions.test.ts` | 5 LESSON-03 Server Action tests | PARTIAL | 5 tests pass. Missing: explicit test for phantom `sub_component_id` (existence check path). See gap below. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sub_component_progress.user_id` | `auth.users` | `references auth.users on delete cascade` | VERIFIED | Line 95 of migration. |
| `sub_component_progress` RLS | `auth.uid()` | `USING ((select auth.uid()) = user_id)` subquery form | VERIFIED | Lines 113–130 of migration; all 3 policies. |
| `handle_new_user` trigger | `levels.level_number = 1` | Selects French 1 id on profile insert | VERIFIED | Lines 273–287 of migration. |
| `LevelPage` | `levels + lessons` Supabase | `from('levels').select(... lessons (...))` nested | VERIFIED | Line 70–77 of level page. |
| `LevelPage` | `profiles.current_level_id` | `select current_level_id` + passed to `deriveIsLevelLocked` | VERIFIED | Lines 80–93 of level page. |
| `LevelCard` | Lesson view route | `Link` to `/levels/${levelSlug}/lessons/${lessonId}` | VERIFIED | Lines 110–115 of `LevelCard.tsx`. |
| `SubComponentList` | `markSubComponentComplete` | `startTransition(async () => { setOptimisticCompleted(id); await markSubComponentComplete(id) })` | VERIFIED | Lines 47–55 of `SubComponentList.tsx`. |
| `actions.ts` | `sub_component_progress` upsert | `upsert({ onConflict: 'user_id,sub_component_id' })` | VERIFIED | Lines 52–59 of `actions.ts`. |
| `LessonPage` | `sub_component_progress` own rows | `from('sub_component_progress').select(...).eq('user_id', user.id).in(...)` | VERIFIED | Lines 88–95 of lesson page. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `LevelPage` | `level.lessons[].sub_components` | `from('levels').select(... lessons ( ... sub_components ( id, position ) ))` | Yes — nested Supabase query | FLOWING |
| `LevelPage` | `profile.current_level_id` | `from('profiles').select('current_level_id').eq('id', user.id)` | Yes — row-scoped DB read | FLOWING |
| `LessonPage` | `subComponents` | `from('lessons').select(... sub_components (...))` nested | Yes — nested Supabase query | FLOWING |
| `LessonPage` | `completedIds` | `from('sub_component_progress').eq('user_id', user.id).in(...)` | Yes — scoped to authenticated user | FLOWING |
| `SubComponentList` | `completedIds` (optimistic) | `useOptimistic(new Set(initialCompletedIds), ...)` seeded from Server Component prop | Yes — seeded from real DB data | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 3 Phase 3 test files pass | `npx jest --testPathPattern="rls-phase3|lessons/level|lessons/actions"` | 26 passed, 0 failed | PASS |
| Full test suite green | `npx jest --no-coverage` | 77 passed, 3 skipped, 0 failed (11 suites) | PASS |
| TypeScript clean | `npx tsc --noEmit` | No output (zero errors) | PASS |
| Migration has all 4 tables | `node -e "..."` (plan task verify) | `migration OK` | PASS |
| `current_level_id` NOT in authenticated update grant | Regex check via rls-phase3 test | Test passes | PASS |

---

### Security Spot-Check

| Concern | Requirement | Finding | Status |
|---------|-------------|---------|--------|
| user_id never from client | CLAUDE.md + T-03-09 | `markSubComponentComplete` accepts only `subComponentId`; `user.id` from `supabase.auth.getUser()` exclusively. Asserted in test #5. | VERIFIED |
| RLS on all 4 lesson tables | CLAUDE.md + T-03-02/05 | Migration lines 23, 52, 87, 109: `enable row level security` on every table. Asserted by `rls-phase3.test.ts`. | VERIFIED |
| `current_level_id` withheld from authenticated UPDATE grant | T-03-01 | No `grant update (... current_level_id ...)` in migration. Regex asserted in `rls-phase3.test.ts` test "current_level_id is NOT in any authenticated update grant". | VERIFIED |
| Content tables authenticated-only (not anon) | T-03-03 | Policies: `to authenticated using (true)` — no `to anon`. Asserted by "no content SELECT policy targets anon role" test. | VERIFIED |
| Zod UUID validation before DB call | T-03-11 | `SubComponentIdSchema.safeParse(subComponentId)` at line 22 of `actions.ts`, before `createClient()` is called. | VERIFIED |
| No API keys in client code | CLAUDE.md SEC-01 | `createClient` imported from `@/lib/supabase/server` (server-only); no Anthropic key referenced in any Phase 3 file. | VERIFIED |
| Parameterized queries only | CLAUDE.md SEC-03 | All DB calls use Supabase JS client with `.eq()`, `.in()`, `.upsert()` — no string-built SQL. | VERIFIED |

---

### Design System Spot-Check

| Rule | Finding | Status |
|------|---------|--------|
| All colors from DESIGN.md tokens | All components use `bg-surface-container-low`, `text-on-surface`, `text-primary`, `border-outline-variant`, etc. No ad-hoc hex found via grep. | VERIFIED |
| Green (`text-tertiary`/`bg-tertiary`) reserved for correct-answer feedback only | Grep on all 4 component files: only in comments ("banned"). No actual green token usage. | VERIFIED |
| Sentence case for all UI copy | "Locked", "Mark complete", "Done", "Start lesson", "Continue", "Back to French 1", "Lesson complete" — all sentence case. | VERIFIED |
| Primary button fill `#a03e40` / design tokens | `bg-primary` used for completion state and progress bar fill — consistent with token. | VERIFIED |
| Lesson content max-width 720px | `LessonPage` uses `max-w-[720px]`. | VERIFIED |
| Dashboard container 1040px | `LevelPage` uses `max-w-[1040px]`. | VERIFIED |
| Guillemet motif for active-lesson marker | `LevelCard`: `{isActive && !isLocked && <span className="font-heading text-primary mr-1">«</span>}` — wired but `isActive` is hardcoded `false` (see isActive stub section below). | WIRED / NOT LIT |
| No heavy drop shadows | No `shadow-` utilities found in Phase 3 components. | VERIFIED |

---

### isActive Stub Assessment

**Finding:** `LevelPage` passes `isActive={false}` to every `LevelCard` (line 152 of `level/page.tsx`). The guillemet «  marker is implemented and wired in `LevelCard` but will never render in the current build.

**Is this a blocker?** No — and here is the reasoning:

The Phase 3 ROADMAP success criteria do not include "active-lesson guillemet marker renders correctly." LESSON-04 requires "time estimate per lesson, locked/unlocked state, sub-component list" — all three are delivered. UX-06 ("guillemet motif as active-lesson marker") is assigned to Phase 9, not Phase 3.

`isActive` requires surfacing per-student in-progress lesson state. That requires knowing which lessons have *partial* completion (at least one sub-component done, not all). The `sub_component_progress` data exists in Phase 3 but the level page does not query it — this is by design. Phase 9 (UX Polish) is the appropriate place to add this query and pass real `isActive` values.

**Verdict:** ACCEPTABLE MVP DEFERRAL — not a gap for Phase 3 verification. The marker is scaffolded correctly; Phase 9 only needs to add the progress query to the level page and pass real values.

---

### Anti-Pattern Scan

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/levels/[levelSlug]/page.tsx` | 152 | `isActive={false}` hardcoded | INFO | Guillemet marker never lights up. Intentional MVP deferral — Phase 9 wires real in-progress state. Not a stub; component accepts and renders the prop correctly. |
| `src/app/lessons/actions.ts` | 65–75 | Defensive `Array.isArray` guard on Supabase join result | INFO | Supabase type inference returns level join as array. Guard is correct and functional; not a stub. |

No `TBD`, `FIXME`, or `XXX` markers found in any Phase 3 source file.

---

### Test Gap (WARNING)

**Gap:** `__tests__/lessons/actions.test.ts` does not include an explicit test for the phantom sub-component path (existence check fails → throws `'Sub-component not found'`).

The plan's acceptance criteria listed this as one of 5 required cases. The implementation has the guard at `actions.ts` lines 33–40 (`if (!sc) throw new Error('Sub-component not found')`), but no unit test drives that code path.

**Severity:** WARNING (not BLOCKER). The security behavior (T-03-10) is implemented and code-reviewed. The missing test is a coverage gap, not a missing feature. The overall test suite is green. Recommend adding this test case before Phase 10 (Security & Quality) which mandates a full test suite.

---

### Human Verification Required

The following items require browser testing against the live Supabase + Next.js deployment and cannot be verified programmatically:

#### 1. Level page renders correct data for French 1

**Test:** Log in as a test student. Navigate to `/levels/french-1`.
**Expected:** Two lesson cards — "Greetings and introductions" (10 min, 3 parts) and "Definite articles: le, la, les" (12 min, 2 parts). Cards are interactive/clickable. No lock badge. No guillemet «  prefix on card titles.
**Why human:** Requires live Supabase DB + rendered Next.js Server Component.

#### 2. French 2 level renders locked state

**Test:** As a student with `current_level_id` = French 1, navigate to `/levels/french-2`.
**Expected:** Level header shows lock badge. Prompt "Complete the French 1 placement test to unlock French 2." appears. No lesson cards (French 2 has no lessons seeded). No clickable elements.
**Why human:** Lock derivation requires real `profiles.current_level_id` row.

#### 3. Mark complete — instant optimistic flip + DB persist

**Test:** Open a French 1 lesson. Click "Mark complete" on the first sub-component.
**Expected:** Button flips to "Done" immediately (no page reload, no spinner delay). Progress bar increments. Hard-reloading the page still shows the sub-component as Done.
**Why human:** `useOptimistic` + Server Action + `revalidatePath` interaction requires a running server.

#### 4. Progress restoration on return

**Test:** Complete one sub-component, navigate away to the level page, then return to the lesson.
**Expected:** Previously completed sub-component shown as Done. Progress bar reflects the correct count.
**Why human:** Requires a real DB round-trip from the lesson page's `sub_component_progress` query.

#### 5. Unauthenticated redirect

**Test:** Clear session cookies. Navigate directly to `/levels/french-1`.
**Expected:** Browser redirects to `/login?next=/levels/french-1`.
**Why human:** Proxy matcher + `getUser()` redirect requires a live Next.js server.

#### 6. Guillemet marker absent

**Test:** Observe the French 1 level page lesson cards.
**Expected:** No «  character appears before any lesson title (isActive is hardcoded false; the marker must not appear spuriously).
**Why human:** Visual confirmation that the guillemet condition is correctly guarded.

---

### Gaps Summary

No BLOCKER gaps were found. The implementation fully delivers all 4 LESSON requirements, all 5 ROADMAP success criteria, and passes all security checks.

**WARNING (non-blocking):**
- `__tests__/lessons/actions.test.ts` is missing a test for the phantom sub-component existence-check path (T-03-10). The guard is implemented at `actions.ts` line 38 but has no covering test case. This is a test coverage gap, not a missing feature. Recommend addressing before Phase 10.

**Deferred (by design):**
- `LevelCard.isActive` is hardcoded `false` — guillemet active-lesson marker never renders. This is an intentional Phase 9 (UX Polish) deferral; LESSON-04 success criteria do not require it, and UX-06 is explicitly Phase 9 scope.

---

_Verified: 2026-06-22T03:20:00Z_
_Verifier: Claude (gsd-verifier)_
