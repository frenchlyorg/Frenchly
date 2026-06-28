---
phase: 09-ux-polish-performance
plan: "02"
subsystem: lessons
tags: [accordion, post-lesson-bar, ux-polish, accessibility, animation]
dependency_graph:
  requires: [09-01]
  provides: [accordion-lesson-layout, post-lesson-loading-bar]
  affects: [SubComponentItem, SubComponentList, lesson-page]
tech_stack:
  added: []
  patterns:
    - max-height CSS transition for accordion open/close (no JS measurement, no Radix)
    - requestAnimationFrame defer for CSS width transition animation
    - useRef guard against StrictMode double router.push
    - useMemo for stable random message selection
key_files:
  created: []
  modified:
    - src/components/lessons/SubComponentItem.tsx
    - src/components/lessons/SubComponentList.tsx
    - src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx
decisions:
  - "Explainer Mark complete button moved into content region (not header) to prevent nested button HTML"
  - "Practice/writing spacer inside header button is plain div — no role/tabIndex (Pitfall 4)"
  - "openId is useState not derived — prevents reset on optimistic update (Pitfall 6)"
  - "requestAnimationFrame defers barWidth(100) one frame so CSS 0→100% transition fires (Pitfall 2)"
  - "navigatedRef.current guard prevents double router.push in React StrictMode (Pitfall 3)"
  - "PostLessonBar uses bg-primary (coral) — no ad-hoc hex, no green (UX-10)"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-28T14:20:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 09 Plan 02: Accordion Lesson Layout + Post-Lesson Loading Bar Summary

**One-liner:** Collapsible accordion per-item lesson layout with auto-advance and a 1.5s coral fill bar navigating to the level page on completion.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add accordion shell to SubComponentItem | 561af3c | SubComponentItem.tsx |
| 2 | Add accordion state + PostLessonBar to SubComponentList; thread levelSlug | 561af3c | SubComponentList.tsx, page.tsx |

## What Was Built

### Task 1 — SubComponentItem accordion shell

`SubComponentItem` refactored into two sections:

**Accordion header `<button>`** (`id=header-${id}`, `aria-expanded={isOpen}`, `aria-controls=content-${id}`, `onClick={onToggle}`):
- Full-width (`w-full text-left`), 48px min touch target
- Contains completion circle (presentational only), title, kind chip, and action label
- For `kind === 'explainer'`: circle is a `<div aria-hidden="true">` — no onClick, no aria-pressed, no tabIndex
- For `kind === 'practice'|'writing'`: spacer is a plain `<div>` — no role, no tabIndex, no aria-label

**Collapsible content region** (`id=content-${id}`, `role="region"`, `aria-labelledby=header-${id}`):
- `overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none`
- Closed: `max-h-0` | Open: `max-h-[2000px]`
- Explainer: markdown content + **"Mark complete" button** (inside region, not header — no nested buttons)
- Practice/writing: existing PracticeCardRouter panel unchanged

### Task 2 — SubComponentList accordion state + PostLessonBar + levelSlug

**Accordion state:**
- `openId: useState<string | null>` initialised to `subComponents[0].id` (first item open)
- `onToggle` on each item: opens if closed, closes all if already open (one-open-at-a-time)
- `handleComplete`: derives `nextIncomplete` synchronously before `startTransition`, calls `setOpenId(nextIncomplete?.id ?? null)`

**PostLessonBar (fires when `allDone === true`):**
- `fixed top-0 left-0 right-0 z-50` — does not shift page content
- 4px track (`bg-surface-container-high`) + fill (`bg-primary`, CSS `transition-all duration-[1500ms]`)
- `requestAnimationFrame` defers `setBarWidth(100)` one frame so browser paints 0 before animating
- `setTimeout(1500)` fires `router.push('/levels/${levelSlug}')` after fill completes
- `navigatedRef.current` guard prevents double-fire in React StrictMode
- Random message from 5-item pool via `useMemo` (sentence case, `font-label text-[13px] text-on-surface-variant`)
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-label="Loading next lesson"`

**Removed:** old `{allDone && <div className="mt-8 p-6...">Lesson complete</div>}` static card (D-PL-07)

**Lesson page:** `levelSlug={levelSlug}` added to `<SubComponentList>` render call (line 173)

## Verification Results

| Check | Result |
|-------|--------|
| `aria-expanded` on accordion header button | PASS |
| `aria-controls` with `content-${id}` pattern | PASS |
| `role="region"` on content div | PASS |
| `max-h-[2000px]` / `max-h-0` present | PASS |
| No `tertiary` class tokens in modified files | PASS (only in comments) |
| No `role="presentation"` or `tabIndex={-1}` in SubComponentItem | PASS |
| Old "Lesson complete" static card removed | PASS |
| `role="progressbar"` on PostLessonBar | PASS |
| `levelSlug` in SubComponentList render call | PASS |
| `npm run build` | PASS (0 TypeScript errors) |
| `npm test` | PASS (18 suites, 156 tests, 0 failures) |

## Deviations from Plan

None — plan executed exactly as written.

All architectural decisions (accordion max-height pattern, RAF defer, navigatedRef guard, explainer button placement) matched the RESEARCH.md patterns exactly.

## Known Stubs

None. All data flows are wired: `levelSlug` comes from server page params, `completedIds` from Supabase progress query, `subComponents` from lesson data.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are client-side UI state (`openId`, `barWidth`) or prop threading (`levelSlug`). The `navigatedRef` guard mitigates T-09-02-DD (double navigation).

## Self-Check: PASSED

- `src/components/lessons/SubComponentItem.tsx` — modified, exists
- `src/components/lessons/SubComponentList.tsx` — modified, exists
- `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — modified, exists
- Commit `561af3c` — confirmed in git log
