---
phase: 09-ux-polish-performance
plan: "01"
subsystem: ux-loading
tags: [skeleton-loaders, guillemet, active-lesson, next-loading-convention]
dependency_graph:
  requires: []
  provides:
    - skeleton loaders for all five data-fetching routes
    - activeLessonId computation wired to LevelCard.isActive
  affects:
    - src/app/levels/[levelSlug]/page.tsx
    - src/app/dashboard/page.tsx (loading.tsx co-located)
    - src/app/diagnostic/placement/page.tsx (loading.tsx co-located)
    - src/app/diagnostic/end-of-level/[levelSlug]/page.tsx (loading.tsx co-located)
    - src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx (loading.tsx co-located)
tech_stack:
  added: []
  patterns:
    - Next.js App Router loading.tsx convention (automatic Suspense boundary)
    - animate-pulse + motion-reduce:animate-none for accessible skeleton animation
    - Server-side IIFE for activeLessonId derivation from existing completedSet
key_files:
  created:
    - src/app/levels/[levelSlug]/loading.tsx
    - src/app/levels/[levelSlug]/lessons/[lessonId]/loading.tsx
    - src/app/dashboard/loading.tsx
    - src/app/diagnostic/placement/loading.tsx
    - src/app/diagnostic/end-of-level/[levelSlug]/loading.tsx
  modified:
    - src/app/levels/[levelSlug]/page.tsx
decisions:
  - "aria-hidden on outer wrapper div (not main) to keep main landmark accessible while hiding skeleton content"
  - "activeLessonId IIFE includes isLocked guard — locked levels return null regardless of completedSet"
  - "Skeleton files import nothing — pure JSX with Tailwind classes only, zero JS bundle impact"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-28"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
---

# Phase 09 Plan 01: Skeleton Loaders + Guillemet Active Marker Summary

Five loading.tsx skeleton files with warm animate-pulse animation plus server-side activeLessonId computation wired to the LevelCard guillemet marker.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create five loading.tsx skeleton files | f7715f6 | 5 new files |
| 2 | Wire activeLessonId on level page | f7715f6 | page.tsx +11 lines |

## What Was Built

### Task 1 — Five skeleton loaders

All five routes now have a `loading.tsx` file co-located with their `page.tsx`. Next.js App Router automatically renders these while the Server Component suspends, giving users on slow Chromebooks an immediate warm structural skeleton instead of a blank page.

Each skeleton:
- Wraps content in `<div aria-hidden="true">` inside `<main className="min-h-screen bg-background">` — the `main` landmark remains accessible; skeletons inside are hidden from screen readers
- Uses `bg-surface-container-high` for all blocks (warm bone token, no ad-hoc hex)
- Applies `animate-pulse motion-reduce:animate-none` to every block (respects prefers-reduced-motion)
- Imports nothing — pure JSX + Tailwind, zero JS bundle contribution
- Mirrors the real page's structural layout (same container widths, grid, proportions)

Route-specific fidelity:
- Level page: `max-w-[1040px]`, 2-column card grid (`grid grid-cols-1 md:grid-cols-2 gap-4`), 4 cards at `h-[120px] rounded-[16px]`
- Lesson page: `max-w-[720px]`, back link + title + time estimate + progress bar + 4 item blocks at `h-[52px]`
- Dashboard: `max-w-[1040px]`, greeting block + 2 card blocks at `h-[80px] rounded-[16px]`
- Placement diagnostic: `max-w-[720px]`, question block + 4 option blocks at `h-[48px]`
- End-of-level diagnostic: identical to placement skeleton

### Task 2 — Guillemet active-lesson marker

Added `activeLessonId` IIFE to `src/app/levels/[levelSlug]/page.tsx` immediately after the `completedSet` assignment (line 142). The computation:
- Returns `null` immediately if `isLocked === true` (locked levels show no active marker)
- Iterates `lessons` in existing position-sorted order (no re-sort needed)
- Returns the first lesson id where any sub-component id is absent from `completedSet`
- Returns `null` when all lessons are complete

Replaced `isActive={false}` (hardcoded) with `isActive={lesson.id === activeLessonId}` in the `LevelCard` render (line 201). The `LevelCard.isActive` prop and `«` guillemet rendering were already implemented — this plan simply wires real progress data to it.

## Verification

All plan success criteria met:

- [x] All five loading.tsx files exist at exact paths
- [x] Every skeleton block uses `bg-surface-container-high` (no ad-hoc hex)
- [x] Every skeleton block has both `animate-pulse` AND `motion-reduce:animate-none`
- [x] All skeleton outer wrappers have `aria-hidden="true"`
- [x] Level page skeleton: `max-w-[1040px]`, `grid grid-cols-1 md:grid-cols-2 gap-4`, 4 cards at `h-[120px] rounded-[16px]`
- [x] Lesson page skeleton: `max-w-[720px]`, 4 item blocks at `h-[52px]`
- [x] Diagnostic skeletons: `max-w-[720px]`, 4 option blocks at `h-[48px]`
- [x] `isActive={false}` removed (0 matches in grep)
- [x] `activeLessonId` at 2 locations in level page (declaration + isActive prop)
- [x] `npm run build` passes — TypeScript clean, 14 routes compiled

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stub patterns introduced in this plan. Loading skeletons are structural placeholders by design (not data stubs); they are replaced entirely when the Server Component resolves.

## Threat Flags

None — loading.tsx files contain no user data (pure structural JSX). activeLessonId is derived server-side from RLS-enforced completedSet with no new DB query and no new trust boundary.

## Self-Check: PASSED

Files confirmed:
- `src/app/levels/[levelSlug]/loading.tsx` — FOUND
- `src/app/levels/[levelSlug]/lessons/[lessonId]/loading.tsx` — FOUND
- `src/app/dashboard/loading.tsx` — FOUND
- `src/app/diagnostic/placement/loading.tsx` — FOUND
- `src/app/diagnostic/end-of-level/[levelSlug]/loading.tsx` — FOUND
- `src/app/levels/[levelSlug]/page.tsx` (modified) — FOUND

Commit f7715f6 verified in git log.
