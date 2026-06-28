# Phase 9: UX Polish & Performance — Context

**Gathered:** 2026-06-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver four concrete UX improvements before launch:
1. Skeleton loaders on all data-fetching pages
2. Animated post-lesson loading bar with encouraging message → navigate to level page
3. Guillemet « active-lesson marker driven by real progress data
4. Accordion lesson layout: sub-components collapse/expand, auto-advance on complete

Plus: WCAG AA contrast audit and Lighthouse ≥ 85 mobile pass.

No new features, no new levels, no new content types.

</domain>

<decisions>
## Implementation Decisions

### D-SK — Skeleton Loaders

- **D-SK-01:** All data-fetching pages get skeletons: level page, lesson page, dashboard, diagnostic placement, end-of-level diagnostic.
- **D-SK-02:** Animation style = Tailwind `animate-pulse` (opacity fade). No shimmer gradient.
- **D-SK-03:** Implementation via Next.js `loading.tsx` per route (app router convention). No Suspense wiring required.
- **D-SK-04:** Skeleton content = structural match to real layout — bone-colored rounded blocks that mirror the shape of actual cards/items. Level page: 2-column card grid skeleton. Lesson page: stacked item list skeleton.
- **D-SK-05:** Skeleton color = `bg-surface-container-high` (warm bone/charcoal — no ad-hoc hex).

### D-PL — Post-lesson Loading Bar

- **D-PL-01:** Trigger = automatic when `allDone` becomes true in `SubComponentList`. No button click.
- **D-PL-02:** Position = fixed top of viewport, full-width, 4px height (matches existing progress bar style in `SubComponentList`). Does not shift page content.
- **D-PL-03:** Duration = 1.5 seconds bar fill, then `router.push(/levels/[levelSlug])`.
- **D-PL-04:** Message pool (rotate randomly, ≤8 words each):
  1. "Well done! Loading your next lesson."
  2. "Nice job! Returning to your lessons."
  3. "Lesson complete. Keep up the momentum."
  4. "Très bien! Back to your level."
  5. "Great work. Heading to your next lesson."
- **D-PL-05:** Message appears below/beside the bar (or centered under it). Font = `font-label`, color = `text-on-surface-variant`. Sentence case.
- **D-PL-06:** Bar color = `bg-primary` (coral `#a03e40`). Fills left-to-right over 1.5s with CSS transition.
- **D-PL-07:** The existing "Lesson complete" static card in `SubComponentList` is REPLACED by the loading bar UI.

### D-GM — Guillemet Active-Lesson Marker

- **D-GM-01:** Definition of "active": first lesson (by position) where any sub-component is NOT in the completed set.
- **D-GM-02:** If all lessons in a level are complete → no active marker shows on any card.
- **D-GM-03:** Implementation: on level page, fetch progress for all sub-components (already done), then compute `activeLessonId` server-side by scanning `lessons` in position order and returning the first with at least one incomplete sub-component. Pass `isActive={lesson.id === activeLessonId}` to each `LevelCard`.
- **D-GM-04:** `LevelCard.isActive` prop and «  rendering already implemented — just needs real data passed in (currently hardcoded `false`).

### D-AC — Accordion Lesson Layout

- **D-AC-01:** Each sub-component becomes a collapsible accordion item. Triggered by user click on the header row OR by auto-advance.
- **D-AC-02:** Default open state when lesson first loads: first sub-component open, all others closed.
- **D-AC-03:** Auto-advance on complete: when a sub-component is marked complete, it auto-collapses and the next sub-component auto-opens.
- **D-AC-04:** No grouping by type. No "Load 5 more" (data doesn't justify it — 3–4 items per lesson max in v1). Simple per-item accordion.
- **D-AC-05:** Completed items can still be re-opened manually (click header to expand). Completion state (checkmark) remains visible on the collapsed header.
- **D-AC-06:** `SubComponentList` manages open-item state (`openId: string | null`). When `onComplete(id)` fires → set `openId` to next sub-component's id. When last item completes → post-lesson loading bar fires (D-PL-01).

### D-A11Y — Accessibility & Performance

- **D-A11Y-01:** WCAG AA automated check via Lighthouse accessibility audit (already in Chrome DevTools). Manual check for coral button `#a03e40` on white/cream background.
- **D-A11Y-02:** All interactive elements keyboard-navigable. Accordion toggle must be a `<button>` with `aria-expanded` and `aria-controls`.
- **D-A11Y-03:** Lighthouse performance target ≥ 85 mobile (throttled connection). Identify top regressions via report; fix largest wins only.
- **D-A11Y-04:** `prefers-reduced-motion` — `animate-pulse` respects Tailwind's `motion-reduce:animate-none` utility. Apply to all skeleton elements.

### Claude's Discretion

- Message position relative to top bar (above/below/centered) — Claude picks cleanest option
- Accordion open/close animation style (height transition vs display toggle) — Claude picks based on performance
- Exact skeleton block heights and proportions within the structural-match constraint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — Color tokens, typography, spacing. All colors must come from here. No ad-hoc hex.
- `CLAUDE.md` — Design rules (rules 1–10), lesson max-width (720px), dashboard container (1040px)

### Existing Components to Modify
- `src/components/lessons/SubComponentList.tsx` — Add accordion state, post-lesson bar, auto-advance logic
- `src/components/lessons/SubComponentItem.tsx` — Wrap in accordion shell (collapsible header + content)
- `src/components/lessons/LevelCard.tsx` — `isActive` prop already wired; just needs real data
- `src/app/levels/[levelSlug]/page.tsx` — Compute `activeLessonId` from existing progress data; add `loading.tsx`
- `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — Add `loading.tsx`

### Routes Needing loading.tsx
- `src/app/levels/[levelSlug]/loading.tsx` — new file
- `src/app/levels/[levelSlug]/lessons/[lessonId]/loading.tsx` — new file
- `src/app/dashboard/loading.tsx` — new file
- `src/app/diagnostic/placement/loading.tsx` — new file
- `src/app/diagnostic/end-of-level/[levelSlug]/loading.tsx` — new file

### Phase 9 ROADMAP Section
- `.planning/ROADMAP.md` §Phase 9 — Success criteria (6 items), backlog note

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing 4px progress bar in `SubComponentList` (`h-1 w-full rounded-full bg-surface-container-high` + `bg-primary` fill with `transition-all duration-300`) — post-lesson bar should match this style
- `LevelCard.isActive` prop already implemented with «  and "Continue" CTA — just needs real data passed in
- `bg-surface-container-high`, `bg-surface-container-highest`, `bg-surface-container-low` — use these for skeleton block colors

### Established Patterns
- No green anywhere except correct-answer feedback (`text-tertiary`/`bg-tertiary`)
- `font-label text-[13px]` for small metadata labels — use for message under loading bar
- `font-heading` (Literata) for section headers; `font-body` (Be Vietnam Pro) for body; `font-label` (Work Sans) for labels
- Server Components for pages; Client Components for interactive UI (progress, accordion state)
- `useOptimistic` + `startTransition` for optimistic progress updates — accordion open state should NOT use useOptimistic (it's local UI state, not server state)

### Integration Points
- `SubComponentList` (client component) owns all lesson interactivity — accordion + post-lesson bar go here
- Level page already fetches `sub_component_progress` for `allSubComponentsComplete` — same data drives `activeLessonId` (no new query needed)
- Post-lesson bar needs `useRouter` from `next/navigation` for `router.push`

</code_context>

<specifics>
## Specific Ideas

- Post-lesson messages must be ≤8 words (per REQUIREMENTS). All 5 messages in D-PL-04 satisfy this.
- "Très bien!" message adds a nice French touch to the copy — user approved this.
- Accordion = simple per-item, not grouped by type. Existing 3–4 items per lesson doesn't justify type-grouping.

</specifics>

<deferred>
## Deferred Ideas

- Lesson layout redesign with type-grouped collapsible sections and "Load 5 more" — replaced by simpler per-item accordion in this phase; type-grouping deferred to v2 when lesson count per section warrants it.

</deferred>

---

*Phase: 9-UX-Polish-Performance*
*Context gathered: 2026-06-28*
