---
phase: 03-lesson-framework
plan: "02"
subsystem: ui-level-page
tags: [level-page, locking, server-component, tdd, design-tokens, rls]
status: complete

dependency_graph:
  requires:
    - "03-01 (levels, lessons, sub_components tables; current_level_id on profiles; French 1 seed)"
  provides:
    - "src/lib/lessons/locking.ts — pure deriveIsLevelLocked helper (LESSON-04)"
    - "src/app/levels/[levelSlug]/page.tsx — protected level page Server Component"
    - "src/components/lessons/LevelCard.tsx — lesson card with lock/active state"
    - "src/components/ui/LockBadge.tsx — warm-tonal locked pill badge"
    - "__tests__/lessons/level.test.ts — 3 real passing tests (was 3 todos)"
  affects:
    - "03-03 (lesson view page links back to /levels/[levelSlug])"
    - "Phase 4 diagnostic system (deriveIsLevelLocked signature stable for generalization)"

tech_stack:
  added: []
  patterns:
    - "Pure lock-derivation function: levelId !== currentLevelId; null → unlocked"
    - "TDD RED/GREEN: test scaffold before implementation"
    - "Server Component nested Supabase select: .from('levels').select('... lessons ( ... sub_components ( ... ) )')"
    - "referencedTable order: .order('position', { referencedTable: 'lessons' })"
    - "Lock state derived server-side from profiles.current_level_id; never client-derived"
    - "Locked card: aria-disabled, tabIndex=-1, no Link/onClick (T-03-07)"

key_files:
  created:
    - src/lib/lessons/locking.ts
    - src/app/levels/[levelSlug]/page.tsx
    - src/components/lessons/LevelCard.tsx
    - src/components/ui/LockBadge.tsx
  modified:
    - __tests__/lessons/level.test.ts

decisions:
  - "levelNumber carried in deriveIsLevelLocked signature but unused in Phase 3 — Phase 4 will generalize to levelNumber > unlockedThroughNumber"
  - "isActive hardcoded to false on all lesson cards (Phase 3 has no progress tracking; Plan 03-03 will wire real progress)"
  - "Lock text glyph (Unicode lock emoji) used for LockBadge — no icon library per UI-SPEC §Registry Safety"
  - "D-L04 applied: no per-lesson sequential gating — all French 1 lessons are freely jumpable"

metrics:
  duration_minutes: ~5
  completed_date: "2026-06-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 1
---

# Phase 3 Plan 02: Level Page Vertical Slice — Summary

**One-liner:** Level page Server Component with pure lock-derivation helper and warm design-token cards — French 1 unlocked and freely jumpable; French 2 visibly locked via profiles.current_level_id.

---

## Status: COMPLETE

All three tasks done. Tests green (72 passing, 5 todo, 3 skipped — all suite-level). TypeScript clean. Commits a87da3b, 48732ff, 9bc27a1.

---

## Tasks Completed

### Task 1: Lock-derivation helper + complete level.test.ts — commit `a87da3b`

**TDD RED:** Converted 3 `test.todo` stubs to real failing tests importing `@/lib/lessons/locking` (module did not exist).

**TDD GREEN:** Created `src/lib/lessons/locking.ts` — pure `deriveIsLevelLocked` function:
- `currentLevelId == null` → `false` (Pitfall 3 guard: new/edge user treated as French 1)
- `levelId !== currentLevelId` → `true` (locked)
- `levelId === currentLevelId` → `false` (unlocked)
- `levelNumber` in signature but unused — Phase 4 will generalize to `levelNumber > unlockedThroughNumber`

Test result: 3/3 passing.

### Task 2: LockBadge + LevelCard components — commit `48732ff`

**`src/components/ui/LockBadge.tsx`:** Pill badge, `bg-surface-container text-on-surface-variant rounded-full font-label text-[11px]`, sentence case "Locked". No icon library (text glyph). Server-renderable, no `'use client'`.

**`src/components/lessons/LevelCard.tsx`:** Lesson card with:
- `font-heading text-[24px]` title; `font-label text-[13px] text-on-surface-variant` metadata
- Guillemet `«` active-lesson marker in `text-primary` (isActive && !isLocked)
- Time estimate `{N} min` and parts count `{N} parts`
- **Locked branch:** `opacity-60`, `aria-disabled="true"`, `tabIndex={-1}`, descriptive `title` attr, `<LockBadge />`, no Link/onClick
- **Unlocked branch:** `<Link href="/levels/[levelSlug]/lessons/[lessonId]">` with CTA "Start lesson" / "Continue"
- Design tokens only; no `text-tertiary`/`bg-tertiary`; no raw hex

TypeScript: clean.

### Task 3: Level page Server Component — commit `9bc27a1`

**`src/app/levels/[levelSlug]/page.tsx`:**
- Async Server Component; `await params` (Next.js 15+ pattern)
- `getUser()` guard → `redirect('/login?next=/levels/[slug]')` (T-03-06 defense-in-depth)
- Nested Supabase select: `levels + lessons ( sub_components )` ordered by `referencedTable: 'lessons'`
- Profile fetch: `select('current_level_id')`
- `deriveIsLevelLocked({ levelId, levelNumber, currentLevelId })` → `isLocked`
- D-L04: `isLocked` applied to entire level (not per-lesson) — all French 1 lessons freely jumpable
- Layout: `max-w-[1040px] mx-auto px-5 md:px-6 py-20`; `grid grid-cols-1 md:grid-cols-2 gap-4`
- Level header: display-lg (48px) name, body-md description, LockBadge when locked
- Locked level copy: "Complete the French 1 placement test to unlock French 2."
- Handles null level (not-found) and empty lessons array safely

TypeScript: clean.

---

## Deviations from Plan

**None** — plan executed exactly as written.

---

## Known Stubs

`isActive` is hardcoded to `false` on all LevelCard instances in the level page. This is intentional for Phase 3: there is no in-progress tracking yet (Plan 03-03 wires sub-component completion, but `isActive` requires reading the progress table to determine which lesson is partially done). Phase 3 Plan 03 or Phase 4 will wire real `isActive` state from `sub_component_progress`.

Effect: the guillemet `«` marker is never shown in production in Phase 3. The feature is fully implemented in LevelCard — it just needs the level page to compute and pass a real `isActive` value.

---

## Threat Flags

No new security surface beyond what was planned. All three STRIDE mitigations implemented:

- **T-03-06** (Information Disclosure): `getUser()` guard + `redirect('/login?next=...')` — implemented
- **T-03-07** (Elevation of Privilege): Lock state derived server-side; locked card has no `Link`/`onClick`, `aria-disabled`, and `tabIndex={-1}` — implemented
- **T-03-08** (Tampering): Slug used only in parameterized `.eq('slug', levelSlug)` — no string building; unknown slug → "level not found" — implemented

---

## Self-Check

**Files created/modified:**
- [x] `src/lib/lessons/locking.ts` — FOUND
- [x] `__tests__/lessons/level.test.ts` — FOUND (modified)
- [x] `src/components/ui/LockBadge.tsx` — FOUND
- [x] `src/components/lessons/LevelCard.tsx` — FOUND
- [x] `src/app/levels/[levelSlug]/page.tsx` — FOUND

**Commits:**
- [x] `a87da3b` — Task 1 lock helper + tests
- [x] `48732ff` — Task 2 LockBadge + LevelCard
- [x] `9bc27a1` — Task 3 level page

**Tests:** 11 suites, 72 passed, 5 todo, 3 skipped, 0 failed.
**TypeScript:** `npx tsc --noEmit` clean.

## Self-Check: PASSED
