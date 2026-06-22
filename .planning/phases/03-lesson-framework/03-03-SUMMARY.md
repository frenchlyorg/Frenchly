---
phase: 03-lesson-framework
plan: "03"
subsystem: lesson-view
tags: [server-action, optimistic-ui, useOptimistic, progress-save, rls, tdd, lesson-page]
status: complete

dependency_graph:
  requires:
    - "03-01 (sub_components, sub_component_progress tables; French 1 seed)"
    - "03-02 (level page, LevelCard — back-link target)"
  provides:
    - "src/app/lessons/actions.ts — markSubComponentComplete Server Action (LESSON-03)"
    - "src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx — lesson view Server Component"
    - "src/components/lessons/SubComponentList.tsx — useOptimistic progress list"
    - "src/components/lessons/SubComponentItem.tsx — per-item toggle with aria-pressed"
    - "__tests__/lessons/actions.test.ts — 5 real LESSON-03 tests (was 5 test.todo)"
  affects:
    - "Phase 4 diagnostic system (progress writing pattern established)"
    - "Phase 5 problem types (SubComponentItem kind=practice/writing rendering)"

tech_stack:
  added: []
  patterns:
    - "useOptimistic + startTransition: setOptimistic MUST be inside startTransition (Pitfall 1)"
    - "Two-query Server Component: content query + user-data query, separate for RLS clarity"
    - "Server Action security: validate → getUser() → existence check → idempotent upsert → revalidatePath"
    - "Idempotent upsert: onConflict 'user_id,sub_component_id' on composite PK"
    - "TDD RED/GREEN: test scaffold (5 todos) → action impl → 5 passing tests"
    - "Supabase many-to-one join: level data returned as array in joined select; normalise defensively"

key_files:
  created:
    - src/app/lessons/actions.ts
    - src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx
    - src/components/lessons/SubComponentList.tsx
    - src/components/lessons/SubComponentItem.tsx
  modified:
    - __tests__/lessons/actions.test.ts

decisions:
  - "revalidatePath derives path from DB: fetch lessons+level after sc lookup to build /levels/[levelSlug]/lessons/[lessonId]"
  - "Level display name for back-link derived from slug at render time (no extra DB query)"
  - "Supabase join type for levels returned as array; normalised with Array.isArray guard rather than forced cast"
  - "Error revert on Server Action throw: useState saveError + try/catch in startTransition callback"

metrics:
  duration_minutes: ~25
  completed_date: "2026-06-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 1
---

# Phase 3 Plan 03: Lesson View + Real-Time Progress Save — Summary

**One-liner:** Lesson view vertical slice — useOptimistic + Server Action upsert delivers instant "Mark complete" flips persisted to sub_component_progress without a page reload; progress restores on return via two-query Server Component.

---

## Status: COMPLETE

All three tasks done and committed. Tests green: 11 suites, 77 passed, 3 skipped, 0 failed. TypeScript clean. Commits 04fc786, 0b74d6d, 7ae6a46.

---

## Tasks Completed

### Task 1: markSubComponentComplete Server Action + complete actions.test.ts — commit `04fc786`

**TDD RED:** Converted 5 `test.todo` stubs to real failing tests (module did not exist). Mock infrastructure extended: `mockSingle` chains per-call for sub_components existence check vs lessons slug lookup.

**TDD GREEN:** Created `src/app/lessons/actions.ts`:
- `'use server'` at top; imports: createClient, revalidatePath, redirect, z
- `SubComponentIdSchema = z.string().uuid()` — validates before any DB call (T-03-11)
- `getUser()` server-side — never accepts user_id from caller (T-03-09)
- Existence check: `from('sub_components').select('id, lesson_id').eq('id', parsed.data).single()` — throws 'Sub-component not found' if null (T-03-10)
- Idempotent upsert: `onConflict: 'user_id,sub_component_id'` (T-03-12)
- Lesson slug + level slug fetched for `revalidatePath('/levels/[levelSlug]/lessons/[lessonId]')` (Pitfall 2 guard)

Test result: 5/5 passing. No test.todo remaining.

### Task 2: SubComponentItem + SubComponentList components — commit `0b74d6d`

**`src/components/lessons/SubComponentItem.tsx`:**
- `'use client'`, props: `{ id, title, kind, isCompleted, onComplete }`
- 48px touch target button (`min-h-[48px] min-w-[48px]`); `aria-pressed={isCompleted}`; `disabled={isCompleted}`
- Filled `bg-primary` circle + SVG checkmark when complete; outline circle + dash when incomplete
- Kind chip: explainer→"reading" (`bg-surface-container-high`), practice/writing (`bg-surface-container-highest`), `text-on-surface-variant`
- Completed title: `text-on-surface-variant` (muted) — no strikethrough, no green
- Action label: "Mark complete" / "Done" (sentence case)

**`src/components/lessons/SubComponentList.tsx`:**
- `'use client'`; `useOptimistic` + `useTransition`; `useState` for saveError
- `setOptimisticCompleted(id)` called INSIDE `startTransition` (Pitfall 1 guard)
- try/catch in startTransition: revert error message "Couldn't save progress. Try again." in `text-error`
- 4px progress bar: `role="progressbar"`, `aria-valuenow/min/max`, `bg-primary` fill, `bg-surface-container-high` track
- "{N} of {total} complete" label in `font-label text-[13px] text-on-surface-variant`
- Empty list: "This lesson has no parts yet. Check back soon."
- All-done: "Lesson complete" / "Head back to French 1 to choose your next lesson."
- No green tokens anywhere

**Deviation (Rule 1 - Bug):** Supabase join for `level:levels(slug)` returned as `{ slug: any }[]` (array) in type inference, causing TS2352. Fixed with `Array.isArray` guard normalising the join result before using `slug`. No functional change.

TypeScript: clean.

### Task 3: Lesson view Server Component — commit `7ae6a46`

**`src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx`:**
- Async Server Component; `await params` (Next.js 15+ pattern)
- `getUser()` guard → `redirect('/login?next=/levels/[slug]/lessons/[id]')` (T-03-13)
- Query 1 (content): `from('lessons').select('id, slug, title, estimated_minutes, sub_components ( id, title, kind, position )').eq('id', lessonId).order('position', { referencedTable: 'sub_components' }).single<LessonRow>()`
- Query 2 (user data): `from('sub_component_progress').select('sub_component_id').eq('user_id', user.id).in('sub_component_id', subComponentIds)` — scoped to authenticated session; skipped when no sub-components
- Renders `<SubComponentList subComponents={subComponents} initialCompletedIds={completedIds} />`
- Layout: `max-w-[720px] mx-auto px-5 md:px-6 py-12` (lesson content width per CLAUDE.md)
- Back link: "Back to {LevelDisplayName}" in `text-primary font-body`; level name derived from slug
- Lesson title in `font-heading text-[32px]`; time estimate in `font-label text-[13px] text-on-surface-variant`
- Lesson-not-found handled gracefully

TypeScript: clean.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Supabase join type inference produces array not object for level relation**
- **Found during:** Task 1 (TypeScript check after writing actions.ts)
- **Issue:** `from('lessons').select('id, slug, level:levels(slug)')` — Supabase infers `level` as `{ slug: any }[]` (array shape), causing TS2352 on `lesson.level as { slug: string }`.
- **Fix:** Added `Array.isArray(levelData)` guard to handle both array and object forms; falls back to `levelSlug = ''` if neither.
- **Files modified:** `src/app/lessons/actions.ts`
- **Commit:** `0b74d6d` (included in Task 2 commit alongside component files)

---

## Known Stubs

None. All plan goals are achieved:
- Sub-components display in order with kind chips ✓
- Mark complete flips instantly via useOptimistic ✓
- Progress saves to DB via Server Action ✓
- Progress restores on return via two-query Server Component ✓

The "Lesson complete" state copies the level name from `levelSlug` string manipulation ("french-1" → "French 1") rather than DB lookup — this is intentional (avoids an extra query; sufficient for Phase 3 MVP; Phase 4 can pass the level name from a parent layout if needed).

---

## Threat Flags

No new security surface introduced beyond what was planned. All five STRIDE mitigations from the plan's threat register are implemented:

- **T-03-09** (Tampering — user_id): `user_id` from `getUser()` server-side, never from caller; asserted in actions.test.ts — implemented
- **T-03-10** (Tampering — phantom sub_component_id): existence check before upsert, throws 'Sub-component not found' — implemented
- **T-03-11** (Tampering — input validation): `z.string().uuid()` validates before any DB call — implemented
- **T-03-12** (DoS — double-tap): `onConflict: 'user_id,sub_component_id'` + `disabled={isCompleted}` in UI — implemented
- **T-03-13** (Information Disclosure — progress fetch): `eq('user_id', user.id)` + RLS SELECT policy — implemented

---

## Self-Check

**Files created:**
- [x] `src/app/lessons/actions.ts` — FOUND
- [x] `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — FOUND
- [x] `src/components/lessons/SubComponentList.tsx` — FOUND
- [x] `src/components/lessons/SubComponentItem.tsx` — FOUND

**Files modified:**
- [x] `__tests__/lessons/actions.test.ts` — FOUND

**Commits:**
- [x] `04fc786` — Task 1 Server Action + tests — FOUND
- [x] `0b74d6d` — Task 2 components — FOUND
- [x] `7ae6a46` — Task 3 lesson page — FOUND

**Tests:** 11 suites, 77 passed, 3 skipped, 0 failed.
**TypeScript:** `npx tsc --noEmit` clean (no output).

## Self-Check: PASSED
