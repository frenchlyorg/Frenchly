# Phase 9: UX Polish & Performance — Research

**Researched:** 2026-06-28
**Domain:** Next.js App Router loading.tsx · Tailwind v4 animation utilities · accordion accessibility · Lighthouse/axe audit tooling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-SK — Skeleton Loaders**
- D-SK-01: All data-fetching pages get skeletons: level page, lesson page, dashboard, diagnostic placement, end-of-level diagnostic.
- D-SK-02: Animation style = Tailwind `animate-pulse` (opacity fade). No shimmer gradient.
- D-SK-03: Implementation via Next.js `loading.tsx` per route (app router convention). No Suspense wiring required.
- D-SK-04: Skeleton content = structural match to real layout — bone-colored rounded blocks that mirror the shape of actual cards/items.
- D-SK-05: Skeleton color = `bg-surface-container-high` (warm bone/charcoal — no ad-hoc hex).

**D-PL — Post-lesson Loading Bar**
- D-PL-01: Trigger = automatic when `allDone` becomes true in `SubComponentList`. No button click.
- D-PL-02: Position = fixed top of viewport, full-width, 4px height. Does not shift page content.
- D-PL-03: Duration = 1.5 seconds bar fill, then `router.push(/levels/[levelSlug])`.
- D-PL-04: Message pool (5 messages, ≤8 words each).
- D-PL-05: Message appears below/beside the bar. Font = `font-label`, color = `text-on-surface-variant`. Sentence case.
- D-PL-06: Bar color = `bg-primary`. Fills left-to-right over 1.5s with CSS transition.
- D-PL-07: The existing "Lesson complete" static card in `SubComponentList` is REPLACED by the loading bar UI.

**D-GM — Guillemet Active-Lesson Marker**
- D-GM-01: "Active" = first lesson (by position) where any sub-component is NOT in the completed set.
- D-GM-02: If all lessons complete → no active marker.
- D-GM-03: Compute `activeLessonId` server-side from already-fetched data; pass `isActive={lesson.id === activeLessonId}` to each `LevelCard`.
- D-GM-04: `LevelCard.isActive` prop and «  rendering already implemented — just needs real data passed in (currently hardcoded `false`).

**D-AC — Accordion Lesson Layout**
- D-AC-01: Each sub-component = collapsible accordion item.
- D-AC-02: Default open = first sub-component open, all others closed.
- D-AC-03: Auto-advance on complete: collapse current, open next incomplete.
- D-AC-04: No grouping by type. Simple per-item accordion.
- D-AC-05: Completed items can still be re-opened manually. Checkmark remains on collapsed header.
- D-AC-06: `SubComponentList` manages `openId: string | null`. `onComplete(id)` → `openId` = next sub-component's id. When last item completes → post-lesson bar fires.

**D-A11Y — Accessibility & Performance**
- D-A11Y-01: WCAG AA automated check via Lighthouse accessibility audit. Manual check for `#a03e40` on cream.
- D-A11Y-02: All interactive elements keyboard-navigable. Accordion toggle = `<button>` with `aria-expanded` + `aria-controls`.
- D-A11Y-03: Lighthouse performance target ≥ 85 mobile (throttled). Fix largest wins only.
- D-A11Y-04: `prefers-reduced-motion` — apply `motion-reduce:animate-none` to all skeleton elements.

### Claude's Discretion
- Message position relative to top bar (above/below/centered) — resolved in UI-SPEC: message below bar, `mt-2 text-center`.
- Accordion open/close animation style — resolved in UI-SPEC: CSS `max-height` transition.
- Exact skeleton block heights and proportions — specified per component in UI-SPEC.

### Deferred Ideas (OUT OF SCOPE)
- Lesson layout redesign with type-grouped collapsible sections and "Load 5 more".
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-04 | Skeleton loaders display while pages and lesson content are loading | loading.tsx per-route pattern; structural skeleton JSX patterns documented below |
| UX-05 | Post-lesson loading bar with ≤8 words encouraging message | useEffect + CSS transition + router.push pattern; double-fire pitfall documented |
| UX-06 | Guillemet (« ») motif as active-lesson marker | Server-side `activeLessonId` computation using existing `completedSet` data |
| UX-10 | Green (tertiary) used exclusively for correct-answer feedback | Verified: no tertiary tokens used in any Phase 9 additions |
| SEC-06 | All pages meet WCAG AA contrast ratios | Lighthouse DevTools workflow + manual coral button check documented |
| SEC-07 | Keyboard navigation and screen-reader-friendly markup | Accordion ARIA pattern + skeleton aria-hidden documented |
</phase_requirements>

---

## Summary

Phase 9 is a UI-only polish phase with zero new data models, zero new API routes, and zero new dependencies. Every change is a modification to an existing component or a new `loading.tsx` file. The work decomposes cleanly into four independent streams that can be planned as separate tasks: (1) skeleton loaders, (2) post-lesson loading bar, (3) guillemet active-lesson marker, and (4) accordion layout refactor — plus a final accessibility/Lighthouse audit pass.

The codebase is already well-prepared. `LevelCard.isActive` is wired but receives hardcoded `false`. `SubComponentList` already has `allDone` computed. The existing 4px progress bar in `SubComponentList` is the direct pattern for the post-lesson bar. No third-party libraries are required — everything is achievable with Tailwind v4 utilities, React hooks, and Next.js file conventions.

The most complex stream is the accordion refactor. `SubComponentItem` currently renders all content inline (explainer markdown, practice panel, writing panel) with no collapse behavior. Adding accordion requires wrapping the full item in a `<button>` header + collapsible region, while preserving the existing three content types (explainer/practice/writing) and the non-interactive spacer for practice/writing completion circles.

**Primary recommendation:** Plan as four parallel tasks (skeleton, post-lesson bar, active marker, accordion) plus one audit task. The accordion task is the highest-risk item — allocate extra verification steps.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skeleton loaders | Frontend Server (SSR) | — | loading.tsx is a Next.js Server file convention; renders server-side before page resolves |
| Post-lesson loading bar | Browser / Client | — | Requires `useState`, `useEffect`, `useRouter` — must be `'use client'` |
| Active-lesson marker computation | Frontend Server (SSR) | — | Pure data derivation from already-fetched `completedSet`; no new query needed |
| Accordion open state | Browser / Client | — | Local UI state (`openId`), not server state — no `useOptimistic` |
| Accordion auto-advance | Browser / Client | — | Derives `nextId` in the existing `handleComplete` handler |
| WCAG/Lighthouse audit | Browser / Client | — | DevTools audit run against local dev server |

---

## Standard Stack

### Core (no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.9 (installed) | loading.tsx file convention, `useRouter` | Already in project |
| React | 19.2.4 (installed) | `useState`, `useEffect`, `useMemo` | Already in project |
| Tailwind CSS | v4 (installed) | `animate-pulse`, `motion-reduce:animate-none`, `transition-[max-height]` | Already in project |

### Audit Tools (no install required for DevTools path)

| Tool | Install | Purpose |
|------|---------|---------|
| Chrome Lighthouse (DevTools) | none — built into Chrome | WCAG AA + Performance ≥ 85 mobile audit |
| Lighthouse CLI | `npm install -g lighthouse` (optional) | Scripted/repeatable audits; same engine as DevTools |
| axe DevTools browser extension | browser extension (optional) | More granular WCAG violation detail than Lighthouse alone |

**No new npm dependencies are added in this phase.** [VERIFIED: 09-CONTEXT.md D-AC-04, 09-UI-SPEC.md Registry Safety]

---

## Package Legitimacy Audit

No external packages are installed in this phase. The Registry Safety table in 09-UI-SPEC.md confirms: "No external component registries used in this phase."

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User navigates to route
        │
        ▼
Next.js App Router
        │
        ├── loading.tsx present? ──YES──► Render skeleton (SSR)
        │                                  (animate-pulse, aria-hidden)
        │                                  │
        │                          page.tsx resolves (Supabase queries)
        │                                  │
        │                          Real content replaces skeleton
        │
        └── loading.tsx present? ──NO──► Page renders after all queries resolve
                                          (no skeleton fallback)

Lesson page content flow:
        │
        ▼
LessonPage (Server Component)
  └── SubComponentList (Client Component, 'use client')
        ├── openId state: string | null   (accordion)
        ├── completedIds: Set<string>     (useOptimistic)
        ├── allDone: boolean              (derived)
        │
        ├── allDone === false
        │     └── SubComponentItem × N
        │           ├── <button> accordion header (isOpen, onToggle)
        │           │     └── circle + title + chip + action label
        │           └── collapsible region (max-height transition)
        │                 └── explainer content | practice panel | writing panel
        │
        └── allDone === true
              └── PostLessonBar (fixed top-0)
                    ├── track (bg-surface-container-high)
                    ├── fill (bg-primary, width 0→100% over 1500ms)
                    ├── message (random from pool, font-label)
                    └── useEffect → setTimeout(1500) → router.push(/levels/[levelSlug])

Level page active marker flow:
LevelPage (Server Component)
  ├── completedSet already built from sub_component_progress query
  ├── activeLessonId = first lesson where any sub_component id NOT in completedSet
  └── <LevelCard isActive={lesson.id === activeLessonId} /> × N
        └── isActive && !isLocked → renders «  glyph + "Continue" CTA
```

### Recommended Project Structure (new files only)

```
src/app/
├── levels/[levelSlug]/
│   ├── loading.tsx                    ← NEW: level page skeleton
│   └── lessons/[lessonId]/
│       └── loading.tsx                ← NEW: lesson page skeleton
├── dashboard/
│   └── loading.tsx                    ← NEW: dashboard skeleton
└── diagnostic/
    ├── placement/
    │   └── loading.tsx                ← NEW: placement diagnostic skeleton
    └── end-of-level/[levelSlug]/
        └── loading.tsx                ← NEW: end-of-level diagnostic skeleton

src/components/lessons/
├── SubComponentList.tsx               ← MODIFIED: accordion state + post-lesson bar + auto-advance
└── SubComponentItem.tsx               ← MODIFIED: accordion shell (button header + collapsible region)
```

---

## Research Question Answers

### Q1: loading.tsx scope — does a parent loading.tsx cover child segments?

**Answer: YES — parent `loading.tsx` DOES cover child segments, but each child segment gets a separate Suspense boundary only if it has its own `loading.tsx`.** [VERIFIED via Next.js official docs and multiple cross-confirmed sources]

The exact behavior:
- `app/levels/[levelSlug]/loading.tsx` wraps `page.tsx` AND all child route segments below (`lessons/[lessonId]/page.tsx`) in a single Suspense boundary at the `[levelSlug]` level.
- This means: while `lessons/[lessonId]/page.tsx` is loading, the LEVEL page's `loading.tsx` would render — not a lesson-specific skeleton.
- **Consequence for this phase:** Each route that needs its own structurally-matched skeleton MUST have its own `loading.tsx`. A lesson page skeleton (`max-w-[720px]`, stacked item list) is structurally different from a level page skeleton (`max-w-[1040px]`, 2-column card grid). Therefore `lessons/[lessonId]/loading.tsx` is REQUIRED as a separate file — the parent `loading.tsx` at `[levelSlug]/loading.tsx` would show the wrong layout shape for the lesson page.
- The five `loading.tsx` files specified in D-SK-03 and the canonical refs are all necessary. None can be omitted.

**Practical implication for the planner:** Create all five files. Do not assume the `[levelSlug]/loading.tsx` covers the lesson page — it shows the wrong skeleton shape and must be overridden at the nested segment.

[CITED: https://nextjs.org/docs/app/api-reference/file-conventions/loading — "loading.js wraps the page.js file and any children below in a Suspense boundary"]

---

### Q2: Accordion implementation approach

**Answer: CSS `max-height` transition on a wrapper div with `overflow-hidden`. No Radix. No `<details>`. This is already locked in the UI-SPEC and is the correct choice for this codebase.**

The four options analyzed:

| Approach | Verdict | Reason |
|----------|---------|--------|
| `<details>`/`<summary>` | AVOID | No CSS control over animation; browser rendering inconsistencies; `<summary>` semantics conflict with button-driven ARIA pattern required by D-A11Y-02 |
| Radix Accordion | AVOID | Not installed; no shadcn; would add a dependency this phase explicitly prohibits |
| `height: 0` → `height: auto` | AVOID | CSS `height: auto` is not animatable — collapses instantly or requires JS to measure content height first |
| `max-height: 0` → `max-height: 2000px` | **USE THIS** | Animatable, no JS measurement, overflow-hidden hides content, fast 200ms feels responsive |

**Implementation details (from UI-SPEC, verified correct):**

```tsx
// Collapsible region on SubComponentItem
<div
  id={`content-${id}`}
  role="region"
  aria-labelledby={`header-${id}`}
  className={[
    'overflow-hidden transition-[max-height] duration-200 ease-out',
    'motion-reduce:transition-none',
    isOpen ? 'max-h-[2000px]' : 'max-h-0',
  ].join(' ')}
>
  {/* existing content: explainer markdown | practice panel | writing panel */}
</div>
```

**Accordion header button (replaces the existing element structure in SubComponentItem):**

```tsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls={`content-${id}`}
  id={`header-${id}`}
  onClick={onToggle}
  className="flex items-center gap-3 py-3 w-full text-left min-h-[48px] hover:bg-surface-container-low focus:outline-none focus:border-primary focus:border-[3px] rounded-[8px]"
>
  {/* completion circle (existing) + title + kind chip + action label */}
</button>
```

**Key structural change to SubComponentItem:** The existing `<div className="py-2">` outer wrapper becomes the accordion container. The inner `<div className="flex items-center gap-3">` header row becomes the `<button>`. The content sections (explainer markdown, practice panel, writing panel) move inside the collapsible `<div>`. The completion circle for `practice`/`writing` kinds (currently a non-interactive `role="presentation"` spacer) stays in the header button row — it remains visible when collapsed.

**CRITICAL — practice/writing completion circle in the button:** The existing non-interactive spacer `<div role="presentation" tabIndex={-1}>` for practice/writing kinds currently sits in the header row. Inside an accordion `<button>`, it should become a plain `<div>` (no `role="presentation"`, no `tabIndex`) since the parent button already handles all interaction. The circle is purely presentational when inside the button. [ASSUMED — verify that moving the spacer div inside a `<button>` does not cause nested interactive element issues; it should not since the spacer has no click handler, but test with browser accessibility tools]

---

### Q3: Post-lesson loading bar — implementation pattern

**Answer: `useEffect` watching `allDone`, with `requestAnimationFrame` to force the width transition, and `useRef` guard against double-fire.**

**The pattern:**

```tsx
// Inside SubComponentList (client component) — additions only
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useMemo, useState } from 'react'

const router = useRouter()
const [barWidth, setBarWidth] = useState(0)
const navigatedRef = useRef(false)

const message = useMemo(() => {
  const pool = [
    'Well done! Loading your next lesson.',
    'Nice job! Returning to your lessons.',
    'Lesson complete. Keep up the momentum.',
    'Très bien! Back to your level.',
    'Great work. Heading to your next lesson.',
  ]
  return pool[Math.floor(Math.random() * pool.length)]
}, [])

useEffect(() => {
  if (!allDone) return
  if (navigatedRef.current) return  // double-fire guard

  // Force a re-render tick before setting width to 100% so CSS transition fires
  const rafId = requestAnimationFrame(() => {
    setBarWidth(100)
  })

  const timerId = setTimeout(() => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    router.push(`/levels/${levelSlug}`)
  }, 1500)

  return () => {
    cancelAnimationFrame(rafId)
    clearTimeout(timerId)
  }
}, [allDone, levelSlug, router])
```

**Pitfalls documented:**

1. **Double-fire in React 18+ Strict Mode:** React StrictMode double-invokes effects in development. The `useRef` guard (`navigatedRef.current`) prevents `router.push` from firing twice. The cleanup function cancels both the `requestAnimationFrame` and `setTimeout` on the second invocation.

2. **Width transition not firing:** Setting `width: 100%` synchronously on mount means the CSS transition has no starting position to animate from. Fix: use `requestAnimationFrame` to defer the `setBarWidth(100)` call by one frame — the browser paints `width: 0` first, then transitions to `100%`.

3. **`allDone` briefly true on initial render:** Only possible if `initialCompletedIds` already contains all IDs. The effect fires, the bar appears, and navigates immediately. This is correct behavior (lesson already complete) — no guard needed.

4. **`levelSlug` prop required:** `SubComponentList` currently does NOT receive `levelSlug`. The lesson page must pass it as a new prop. The lesson page already has `levelSlug` from `await params`. This is a required prop addition.

**Why NOT `useOptimistic` for bar state:** The bar is local UI state that drives a CSS transition and navigation side effect — not a server sync operation. `useState` + `useEffect` is the correct pattern here.

**`'use client'` boundary:** `SubComponentList` is already `'use client'`. No boundary changes needed.

---

### Q4: Active-lesson marker — server-side computation

**Answer: Add a pure computation pass on the already-fetched `completedSet` and `lessons` array. Zero new queries.**

The level page already has:
- `lessons` (ordered by `position ASC` from the Supabase query with `.order('position', { referencedTable: 'lessons' })`)
- `completedSet` (built from `progressRows`)

Add this block after `completedSet` is built (line ~142 in `page.tsx`):

```tsx
// Derive active lesson (D-GM-01): first lesson by position with any incomplete sub-component
const activeLessonId = (() => {
  for (const lesson of lessons) {
    const subIds = (lesson.sub_components ?? []).map((s) => s.id)
    if (subIds.some((id) => !completedSet.has(id))) return lesson.id
  }
  return null // all complete or no lessons
})()
```

Then change line ~190 from `isActive={false}` to `isActive={lesson.id === activeLessonId}`.

**Edge case verified against existing data shape:**
- `lesson.sub_components` is typed as `SubComponentRow[]` which includes `id`. No schema change needed.
- The `lessons` array is already position-sorted by the Supabase query (`order('position', { referencedTable: 'lessons' })`). No sort step needed.
- The `completedSet` is built before the grid render, so this IIFE runs at the right point in the page's data flow.
- The existing `{isActive && !isLocked}` guard in `LevelCard` already handles the locked-level edge case.

[VERIFIED: reading `src/app/levels/[levelSlug]/page.tsx` lines 132–143, 180–193]

---

### Q5: Skeleton structural match — JSX patterns

**Level page skeleton** (`/levels/[levelSlug]/loading.tsx`):

```tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background" aria-hidden="true">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        {/* Header */}
        <div className="mb-10">
          <div className="h-12 w-48 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-3" />
          <div className="h-4 max-w-[480px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>
        {/* 2-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

**Lesson page skeleton** (`/levels/[levelSlug]/lessons/[lessonId]/loading.tsx`):

```tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background" aria-hidden="true">
      <div className="max-w-[720px] mx-auto px-5 md:px-6 py-12">
        {/* Back link placeholder */}
        <div className="h-4 w-32 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />
        {/* Title */}
        <div className="h-8 w-[320px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-2" />
        {/* Time estimate */}
        <div className="h-4 w-16 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-8" />
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />
        {/* Item list — 4 items matching accordion header height */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[52px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

**Dashboard skeleton** (`/dashboard/loading.tsx`):

```tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background" aria-hidden="true">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        <div className="h-10 w-40 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-8" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[80px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

**Diagnostic skeletons** (placement and end-of-level — same structure):

```tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background" aria-hidden="true">
      <div className="max-w-[720px] mx-auto px-5 md:px-6 py-20">
        <div className="h-8 w-[400px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[48px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

All skeletons use `aria-hidden="true"` on the outer wrapper per the UI-SPEC accessibility contract — screen readers skip the skeleton entirely.

---

### Q6: motion-reduce in Tailwind v4

**Answer: `motion-reduce:animate-none` is a built-in Tailwind utility class in v4. No custom config required.**

Tailwind v4 ships `motion-reduce:` and `motion-safe:` as built-in variants that wrap styles in `@media (prefers-reduced-motion: reduce)` and `@media (prefers-reduced-motion: no-preference)` respectively. [CITED: https://tailwindcss.com/docs/hover-focus-and-other-states]

Usage in this project (Tailwind v4 with `@theme` in globals.css — no `tailwind.config.ts`):

```html
<!-- Skeleton blocks -->
<div class="animate-pulse motion-reduce:animate-none ...">

<!-- Accordion content region -->
<div class="transition-[max-height] duration-200 ease-out motion-reduce:transition-none ...">

<!-- Post-lesson bar fill -->
<div class="transition-all duration-[1500ms] ease-in-out motion-reduce:transition-none ...">
```

The `motion-reduce:animate-none` class generates:
```css
@media (prefers-reduced-motion: reduce) {
  .motion-reduce\:animate-none { animation: none; }
}
```

For the accordion and post-lesson bar, `motion-reduce:transition-none` disables the CSS transition — content snaps open/closed and the bar jumps to full width instantly. Navigation still fires after 1500ms (the `setTimeout` is not affected by `prefers-reduced-motion`).

**No custom `@custom-variant` needed** — both variants are built in to Tailwind v4. [VERIFIED: project uses `tailwindcss: ^4` with `@import "tailwindcss"` in globals.css]

---

### Q7: WCAG AA audit tools

**Answer: Chrome DevTools Lighthouse is the correct workflow. Run the Accessibility category in DevTools. For deeper results, also install the axe DevTools browser extension.**

**Recommended workflow for this project (Vercel/Next.js on localhost):**

1. Start dev server: `npm run dev`
2. Open each page in Chrome at `localhost:3000`
3. Chrome DevTools → Lighthouse tab → Categories: [Accessibility] → Device: Mobile → Analyze page load
4. Fix all red/orange violations before moving to performance
5. For the coral button `#a03e40` specifically: use the Chrome DevTools color contrast picker (Elements panel → click the color swatch → "Contrast ratio" displayed inline)

**Lighthouse accessibility uses axe-core internally** — it catches the same violations as the axe DevTools extension for the most common patterns. [CITED: https://developer.chrome.com/docs/devtools/lighthouse]

**axe DevTools browser extension** (optional but recommended): provides more granular violation details and "Best Practices" checks beyond what Lighthouse surfaces. Install from Chrome Web Store → "axe DevTools".

**`@axe-core/react`** — NOT recommended for this project. It runs axe in development only and logs violations to the console. Useful for a full test suite (Phase 10 / SEC-05), but overkill for a one-time audit pass in Phase 9.

**Manual check required (D-A11Y-01):** `#a03e40` on `#fff8f5` (cream background). The WCAG AA ratio for normal text is 4.5:1. Lighthouse may not check every specific color pairing — the manual DevTools color picker check is the definitive verification.

---

### Q8: Lighthouse mobile throttled on localhost

**Answer: Chrome DevTools Lighthouse tab, Mobile preset. No CLI install required for Phase 9.**

**Chrome DevTools (preferred — zero install):**
1. `npm run dev` → open `http://localhost:3000` in Chrome
2. F12 → Lighthouse tab
3. Device: Mobile, Categories: [Performance, Accessibility]
4. "Analyze page load" — this applies Lighthouse's simulated mobile throttling by default (Moto G Power, slow 4G network, 4× CPU slowdown) [CITED: https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md]

**Lighthouse CLI (optional — for repeatable/scripted runs):**
```bash
npm install -g lighthouse
lighthouse http://localhost:3000/levels/french-1 --preset=perf --emulated-form-factor=mobile --throttling-method=simulate --output=html --output-path=lighthouse-report.html
```

**What to look for in the Performance report for ≥ 85 mobile:**
- Largest Contentful Paint (LCP) — most commonly the level name heading or first card image
- Total Blocking Time (TBT) — watch for heavy JS bundles
- Cumulative Layout Shift (CLS) — skeletons that don't match real layout proportions cause CLS; the structural-match constraint in D-SK-04 directly mitigates this

**Expected baseline:** The app has no images, no third-party scripts, uses Tailwind (utility CSS = tiny bundle), and uses Server Components for data fetching. A score of 85+ should be achievable without heroic optimization. The most likely regressions are CLS from skeleton-to-real-content swaps and LBT from any synchronous client JS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton loading states | Manual `isLoading` state + conditional render | Next.js `loading.tsx` file convention | Automatic Suspense boundary; layout preserved during load; no prop drilling |
| Accordion animation | JS to measure element `scrollHeight` + set `height` | CSS `max-height` transition | Browser-native, no layout measurement, no ResizeObserver, no FOUC |
| Post-lesson navigation | `window.location.href = ...` | `useRouter().push()` from `next/navigation` | Preserves Next.js client navigation, back-button stack intact |
| ARIA accordion pattern | Custom event handling for arrow keys | Simple Tab-only keyboard pattern | WCAG 2.1 APG allows Tab-only for simple accordions; arrow-key pattern adds complexity for 3–4 items |
| Contrast ratio calculation | Manual WCAG math | Chrome DevTools color contrast picker | Automated, exact, includes AA/AAA thresholds |

---

## Common Pitfalls

### Pitfall 1: Parent loading.tsx shows wrong skeleton for child route

**What goes wrong:** Developer places only `levels/[levelSlug]/loading.tsx` assuming it covers the lesson page. The lesson page skeleton is a 1040px card grid instead of a 720px item list.
**Why it happens:** The parent `loading.tsx` IS inherited by child segments. But since its skeleton has the wrong layout shape for the child route, users see a jarring structural mismatch.
**How to avoid:** Create a separate `loading.tsx` in EVERY route segment that has a structurally different layout. All five files listed in the canonical refs are required.
**Warning signs:** Skeleton renders a 2-column grid when navigating to `/lessons/[lessonId]`.

### Pitfall 2: Post-lesson bar width transition doesn't animate

**What goes wrong:** Bar jumps from 0 to 100% instantly with no animation. The user never sees the fill.
**Why it happens:** Setting `width: 100%` synchronously on mount means the browser never paints the `width: 0` starting state — there's nothing to transition FROM.
**How to avoid:** Use `requestAnimationFrame` to defer `setBarWidth(100)` by one frame. The initial render paints `width: 0`, the RAF fires on the next frame, and the CSS transition animates from 0 to 100.
**Warning signs:** `transition-all duration-[1500ms]` class is present but the fill appears instantaneous.

### Pitfall 3: `router.push` fires twice in StrictMode

**What goes wrong:** In development with StrictMode, `useEffect` runs twice (mount → unmount → remount). `router.push` fires twice, adding two entries to the navigation stack. The "back" button behaves unexpectedly.
**Why it happens:** React 18+ Strict Mode double-invokes effects to detect side effects.
**How to avoid:** `useRef` guard: `if (navigatedRef.current) return; navigatedRef.current = true; router.push(...)`. Also return a cleanup function that clears the `setTimeout` — Strict Mode's unmount will cancel the timer on the first invocation.
**Warning signs:** In development, the level page URL appears in the browser history twice after lesson completion.

### Pitfall 4: Nested interactive element inside accordion `<button>`

**What goes wrong:** The existing practice/writing completion circle (currently a `<div role="presentation" tabIndex={-1}>`) is placed inside the accordion `<button>`. If it has any onClick handler, this creates a nested interactive element — invalid HTML and confusing for screen readers.
**Why it happens:** The spacer div is moved from the outer header `<div>` into the accordion `<button>` during the refactor.
**How to avoid:** Inside the `<button>`, the spacer div should have NO `role`, NO `tabIndex`, and NO `onClick`. It is purely presentational. Remove `role="presentation"` and `tabIndex={-1}` since the parent button already handles all interaction.
**Warning signs:** Browser console warning: "Rendered an interactive element inside an interactive element."

### Pitfall 5: `levelSlug` not passed to SubComponentList

**What goes wrong:** `router.push` in the post-lesson bar has no `levelSlug` to navigate to. Either a hardcoded string is used (wrong) or the navigation silently fails.
**Why it happens:** `SubComponentList` currently receives `subComponents` and `initialCompletedIds` only. The lesson page server component has `levelSlug` from params but doesn't pass it down.
**How to avoid:** Add `levelSlug: string` to `SubComponentListProps` and pass it from `LessonPage`. The lesson page already destructures `levelSlug` from `await params`.
**Warning signs:** TypeScript error in SubComponentList: "Property 'levelSlug' does not exist on type 'SubComponentListProps'."

### Pitfall 6: Accordion open state resets on optimistic update

**What goes wrong:** When `handleComplete(id)` fires, the `startTransition` / `useOptimistic` update causes a re-render. If `openId` is derived (not stateful), the accordion collapses unexpectedly mid-render.
**Why it happens:** Using a computed open state instead of explicit `useState` for `openId`.
**How to avoid:** `openId` MUST be `useState` — explicit, not derived. The `setOpenId(nextId)` call in `handleComplete` must run synchronously in the same handler, not in a separate effect watching `completedIds`.
**Warning signs:** After clicking "Mark complete", the next sub-component briefly appears then collapses.

### Pitfall 7: Skeleton CLS — skeleton blocks don't match real content height

**What goes wrong:** Lighthouse CLS score is high. Skeleton blocks are shorter or taller than the actual content they replace, causing layout shift when real content loads.
**Why it happens:** Approximate heights used in skeleton without verifying against rendered component heights.
**How to avoid:** The UI-SPEC specifies exact heights (`h-[120px]` for LevelCard, `h-[52px]` for lesson item, `h-[48px]` for diagnostic option). These were derived from the actual component padding and typography. Use these exact values.
**Warning signs:** CLS > 0.1 in the Lighthouse report after implementing skeletons.

---

## Code Examples

### Accordion — SubComponentItem structure (complete refactor pattern)

```tsx
// SubComponentItem.tsx — additions/changes only (Source: 09-UI-SPEC.md §Interaction Contracts)
interface SubComponentItemProps {
  // existing props...
  isOpen: boolean        // NEW
  onToggle: () => void   // NEW
}

export default function SubComponentItem({ id, title, kind, content, isCompleted, onComplete, problemData, initialFeedback, initialSubmissionText, isOpen, onToggle }: SubComponentItemInternalProps) {
  return (
    <div>
      {/* Accordion header — full-width button */}
      <button
        type="button"
        id={`header-${id}`}
        aria-expanded={isOpen}
        aria-controls={`content-${id}`}
        onClick={onToggle}
        className="flex items-center gap-3 py-3 w-full text-left min-h-[48px] hover:bg-surface-container-low focus:outline-none focus:border-primary focus:border-[3px] rounded-[8px]"
      >
        {/* Completion circle — practice/writing: plain div; explainer: button-as-button handled by parent */}
        {/* ... existing circle JSX, adapted as non-interactive inside button ... */}
        {/* Title + kind chip + action label */}
      </button>

      {/* Collapsible content region */}
      <div
        id={`content-${id}`}
        role="region"
        aria-labelledby={`header-${id}`}
        className={[
          'overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'max-h-[2000px]' : 'max-h-0',
        ].join(' ')}
      >
        <div className="mt-3 sm:ml-[60px]">
          {/* existing content: explainer markdown | practice panel | writing panel */}
        </div>
      </div>
    </div>
  )
}
```

### Accordion — SubComponentList state management

```tsx
// SubComponentList.tsx — new state + updated handleComplete
const [openId, setOpenId] = useState<string | null>(
  subComponents.length > 0 ? subComponents[0].id : null  // D-AC-02: first item open
)

function handleComplete(id: string) {
  if (completedIds.has(id)) return
  setSaveError(null)

  // Derive next incomplete item BEFORE the optimistic update
  const sorted = [...subComponents].sort((a, b) => a.position - b.position)
  const currentIndex = sorted.findIndex((sc) => sc.id === id)
  const nextIncomplete = sorted
    .slice(currentIndex + 1)
    .find((sc) => !completedIds.has(sc.id) && sc.id !== id)

  setOpenId(nextIncomplete?.id ?? null)  // D-AC-03: auto-advance

  startTransition(async () => {
    setOptimisticCompleted(id)
    try {
      await markSubComponentComplete(id)
    } catch {
      setSaveError("Couldn't save progress. Try again.")
    }
  })
}
```

### Post-lesson bar — complete JSX anatomy

```tsx
// PostLessonBar — rendered when allDone === true (Source: 09-UI-SPEC.md §Component Inventory)
{allDone && (
  <div
    className="fixed top-0 left-0 right-0 z-50"
    role="progressbar"
    aria-valuenow={barWidth}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label="Loading next lesson"
  >
    {/* Track */}
    <div className="h-1 w-full bg-surface-container-high">
      {/* Fill */}
      <div
        className="h-full bg-primary transition-all duration-[1500ms] ease-in-out motion-reduce:transition-none"
        style={{ width: `${barWidth}%` }}
      />
    </div>
    {/* Message */}
    <p className="mt-2 text-center font-label text-[13px] text-on-surface-variant">
      {message}
    </p>
  </div>
)}
```

### Active-lesson computation (add to level page.tsx)

```tsx
// Insert after completedSet is built (after line ~142 in levels/[levelSlug]/page.tsx)
// Source: 09-UI-SPEC.md §Interaction Contracts — D-GM
const activeLessonId = (() => {
  for (const lesson of lessons) {
    const subIds = (lesson.sub_components ?? []).map((s) => s.id)
    if (subIds.some((id) => !completedSet.has(id))) return lesson.id
  }
  return null
})()

// Then in the card grid (line ~190), change:
// isActive={false}
// to:
// isActive={lesson.id === activeLessonId}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `isLoading` boolean state + conditional render | Next.js `loading.tsx` file convention (Suspense) | Next.js 13 App Router | No prop drilling; skeleton renders server-side; layout preserved |
| `window.location.href` redirect | `useRouter().push()` from `next/navigation` | Next.js 13 | Client navigation stack preserved; back-button works |
| `height: 0 → height: auto` CSS animation | `max-height: 0 → max-height: large-value` | CSS3 era workaround | `height: auto` is not animatable; max-height trick has been standard since ~2012 |
| `aria-hidden` on accordion content | `display: none` (breaks CSS animation) or `max-height: 0 overflow-hidden` | ARIA 1.2 era | `hidden` attribute hides from ATs but also breaks animation; max-height approach preferred |

**Deprecated/outdated:**
- `<details>`/`<summary>` for styled accordions: No CSS animation control; inconsistent cross-browser focus behavior; `<summary>` click semantics conflict with custom ARIA. Still valid for unstyled native disclosure, but not for this design system.
- `@axe-core/react` for one-time audits: Useful in a CI test pipeline, overkill for a manual audit pass.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Moving the practice/writing completion circle `<div>` inside the accordion `<button>` does not create a nested-interactive-element HTML error | Q2: Accordion, Pitfall 4 | Browser console warning; axe violation if a nested `onClick` was overlooked — test with axe after refactor |
| A2 | Lighthouse mobile performance score ≥ 85 is achievable on this app without additional bundle optimization beyond skeleton CLS fixes | Q8: Lighthouse | If score < 85, will need to investigate TBT (large JS chunks) or LCP — plan a contingency investigation task |
| A3 | Next.js 16.2.9 behaves identically to documented Next.js 15 `loading.tsx` semantics (parent wraps children) | Q1: loading.tsx scope | Unlikely to differ — Next.js 16 is a minor increment; but if behavior changed, each loading.tsx is self-contained and remains correct |

---

## Open Questions

1. **`SubComponentList` prop: `levelSlug`**
   - What we know: The post-lesson bar needs `levelSlug` to call `router.push`. The lesson page has it from `await params`.
   - What's unclear: No blocker — the planner just needs to add `levelSlug: string` to `SubComponentListProps` and thread it from `LessonPage`.
   - Recommendation: Include as a required prop change in the SubComponentList task.

2. **Accordion explainer: "Mark complete" button inside `<button>`?**
   - What we know: For `kind === 'explainer'`, the completion circle is currently a `<button type="button" onClick={() => onComplete(id)}>`. Placing an interactive `<button>` inside the accordion header `<button>` is invalid HTML (nested buttons).
   - What's unclear: The accordion header button triggers `onToggle`. The inner completion button triggers `onComplete`. These are different actions.
   - Recommendation: For `kind === 'explainer'`, the "Mark complete" action should move to INSIDE the collapsible content region (not the header button). The header button becomes navigation-only (open/close). A "Mark complete" button at the bottom of the expanded explainer content is the cleanest pattern. The collapsed header shows the completion circle state (filled/unfilled) as a visual indicator only, not a clickable element. This is a significant structural decision the planner should note explicitly.

3. **Lighthouse score on Windows dev machine**
   - What we know: Lighthouse simulated throttling results vary by machine. The "≥ 85 mobile" target is set against Lighthouse's simulated throttling (not actual device).
   - What's unclear: If the machine is unusually fast, simulated TBT may read low even if real mobile is higher.
   - Recommendation: Run Lighthouse 3× and average — single-run variance can be ±5 points on simulated throttling.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Chrome / Chromium | Lighthouse DevTools audit | ✓ (assumed Windows dev) | — | Use Lighthouse CLI with Puppeteer |
| Node.js | Lighthouse CLI (optional) | ✓ (required by Next.js dev) | — | Use DevTools instead |
| `npm run dev` (Next.js) | All audit runs | ✓ | Next.js 16.2.9 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none — Chrome DevTools Lighthouse requires no install and is the primary audit path.

---

## Validation Architecture

Testing for Phase 9 is primarily manual (visual + audit). The existing test infrastructure (`jest.config.ts`, `__tests__/`) covers server action logic — accordion/skeleton/loading-bar are UI-only changes with no new server logic to unit test.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library (existing) |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern=<file>` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| UX-04 | Skeleton renders at correct route | Manual | — | loading.tsx renders are SSR; verify by navigating with throttled network in DevTools |
| UX-05 | Post-lesson bar fills and navigates | Manual | — | Set `allDone = true` in devtools / hard-code `initialCompletedIds` to verify |
| UX-06 | Guillemet appears on active lesson only | Manual | — | Check level page with partial progress |
| UX-10 | No green in Phase 9 additions | Code review | `grep -r "tertiary" src/components/lessons/ src/app/levels src/app/dashboard src/app/diagnostic` | Zero results expected |
| SEC-06 | WCAG AA contrast pass | Lighthouse audit | `lighthouse http://localhost:3000 --output=html` | Manual coral button check also required |
| SEC-07 | Keyboard navigation | Manual + axe | axe DevTools extension | Tab through lesson page accordion; verify aria-expanded toggles |

### Wave 0 Gaps

None — no new test files need to be created. All Phase 9 validation is:
1. Lighthouse DevTools audit (manual, run once per route after implementation)
2. Keyboard navigation smoke test (manual, Tab through each modified page)
3. Visual review of skeleton structural match
4. `npm test` existing suite to confirm no regressions from prop changes

---

## Security Domain

Phase 9 is UI-only. No new auth flows, no new data access patterns, no new API routes.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V2 Authentication | No | No auth changes |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | No new data access |
| V5 Input Validation | No | No new user input fields |
| V6 Cryptography | No | No crypto |

**SEC-06 / SEC-07 apply:** These are the phase's own security requirements (WCAG AA + keyboard nav) — covered in the audit task, not new ASVS additions.

---

## Sources

### Primary (HIGH confidence)
- `src/components/lessons/SubComponentList.tsx` — existing component read directly; all state patterns verified
- `src/components/lessons/SubComponentItem.tsx` — existing component read directly; all content rendering patterns verified
- `src/components/lessons/LevelCard.tsx` — confirmed `isActive` prop already wired, guillemet rendering in place
- `src/app/levels/[levelSlug]/page.tsx` — confirmed `completedSet` built at line ~142, `isActive={false}` hardcoded at line ~190
- `src/app/globals.css` — confirmed Tailwind v4 `@theme` directive with all design tokens; no `tailwind.config.ts`
- `09-CONTEXT.md` — locked decisions D-SK, D-PL, D-GM, D-AC, D-A11Y
- `09-UI-SPEC.md` — complete visual/interaction contract; all dimensions verified

### Secondary (MEDIUM confidence)
- [Next.js loading.tsx file convention docs](https://nextjs.org/docs/app/api-reference/file-conventions/loading) — loading.tsx scope confirmed: wraps page.tsx AND child segments in a single Suspense boundary
- [Tailwind CSS animation docs](https://tailwindcss.com/docs/animation) — `animate-pulse`, `motion-reduce:animate-none` confirmed as built-in v4 utilities
- [Tailwind CSS hover/focus/other states docs](https://tailwindcss.com/docs/hover-focus-and-other-states) — `motion-reduce:` and `motion-safe:` confirmed as built-in variants
- [Chrome DevTools Lighthouse docs](https://developer.chrome.com/docs/devtools/lighthouse) — confirmed Lighthouse uses axe-core for accessibility; simulated mobile throttling by default

### Tertiary (LOW confidence)
- WebSearch result on loading.tsx inheritance: "applies to the page.tsx in the same folder and all child routes" — corroborated by official Next.js docs; HIGH confidence after cross-check

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; verified from package.json
- Architecture patterns: HIGH — reading actual source files directly; no inference required
- loading.tsx scope: HIGH — confirmed via official Next.js docs + cross-referenced sources
- Accordion max-height pattern: HIGH — well-established CSS technique, confirmed in UI-SPEC
- Post-lesson bar pitfalls: HIGH — derived from React 18 StrictMode behavior (well-documented)
- Lighthouse workflow: HIGH — built into Chrome, zero-install, well-documented
- motion-reduce variants: HIGH — confirmed as built-in Tailwind v4 utilities from official docs

**Research date:** 2026-06-28
**Valid until:** 2026-09-28 (stable Next.js/Tailwind conventions; Lighthouse scoring methodology may shift)
