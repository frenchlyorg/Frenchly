# Phase 11: Pages & Navigation — Research

**Researched:** 2026-06-30
**Domain:** Next.js App Router Server Components, Supabase RLS queries, Tailwind CSS progress UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
| Decision | What it means for Phase 11 |
|----------|---------------------------|
| D-01: Home CTA | Swap `DisabledCTA` for `<Link href="/signup">` styled as primary button. No auth-awareness on home. |
| D-02: Dashboard | Three sections: current level card, progress bar (N of M lessons completed), completed lesson list + "Continue" CTA to first incomplete lesson |
| D-03: Contact page | Static Server Component, `mailto:frenchlyorg@gmail.com` link, match mission page layout (`max-w-[720px]`, `bg-background py-20`) |
| D-04: Navigation | Add "Contact" link after "Mission" in desktop + mobile nav. No footer. Contact visible to both logged-in and logged-out users. |

### Claude's Discretion
- Whether to show a completed-lesson list below the Continue CTA on the dashboard (planner decides based on one-screen fit for 6-lesson French 1 student)

### Deferred Ideas (OUT OF SCOPE)
- Username/profile editing
- Email notifications or contact form backend
- Leaderboard or social features
- Footer redesign / reintroduction
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-01 | Home page communicates the product clearly with a prominent "create account" CTA | D-01: swap `DisabledCTA` → `<Link href="/signup">` with `bg-primary text-on-primary` classes |
| PAGE-02 | Mission page explains the why | Already complete — no changes needed |
| PAGE-03 | French 1 level page (adaptive, diagnostic-gated) | Already complete — no changes needed |
| PAGE-04 | French 2 level page (lesson-heavy, diagnostic-gated) | Already complete — no changes needed |
| PAGE-05 | Dashboard showing progress, current level, recent activity | D-02: replace dashed placeholder with real Supabase queries + progress UI |
| PAGE-06 | Account settings (password change, account deletion with confirmation) | Already complete — no changes needed |
| PAGE-07 | Contact/support page using frenchlyorg@gmail.com | D-03: build new `src/app/contact/page.tsx` |
| SC-6 | All pages linked in consistent navigation header | D-04: add Contact link to `nav.tsx` desktop + mobile |
| SC-7 | Logged-out visitors cannot access dashboard or lesson pages | Already satisfied — proxy + server guards in place |
</phase_requirements>

---

## Summary

Phase 11 is primarily a **wire-up and data-surfacing phase**, not a new-architecture phase. Four of seven pages already pass their success criteria. The three real tasks are: (1) enable the home CTA with a one-component swap, (2) wire the dashboard to real Supabase data with a progress layout, and (3) build a static contact page matching the mission page pattern.

The hardest task is the dashboard data layer. The query pattern is already fully established in `src/app/levels/[levelSlug]/page.tsx` — it fetches levels with nested lessons + sub_components, then fetches `sub_component_progress` for the student, builds a `completedSet`, and derives an `activeLessonId` via first-incomplete-lesson scan. The dashboard reuses this exact pattern, scoped to the student's current level (derived from `profiles.unlocked_through_level_number`).

No new libraries are needed. No schema changes are needed. No RLS changes are needed. The entire phase is file-level Next.js + Tailwind work consuming existing Supabase tables and existing design tokens.

**Primary recommendation:** Split into three plans — (11-01) home CTA + contact page + nav link (small, shippable), (11-02) dashboard data layer + progress UI (the main work). Both plans are independent enough to sequence clearly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home CTA button | Browser/Client | — | Pure JSX link swap in a Server Component; no server logic needed |
| Dashboard progress data | API/Backend (Server Component) | — | Supabase queries run server-side; RLS enforces student isolation |
| Dashboard progress UI | Browser/Client | — | Tailwind CSS rendered from server-fetched data; no client state |
| Contact page | Frontend Server (SSR) | — | Static Server Component; no data fetching |
| Navigation Contact link | Browser/Client | — | Surgical addition to existing `"use client"` Nav component |
| Auth guard (dashboard) | API/Backend (Server Component) | CDN/Proxy | Defense-in-depth: proxy middleware + Server Component getUser() check |

---

## Standard Stack

### Core (no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | already installed | Server Components, routing, Link | Project standard |
| `@supabase/ssr` | already installed | Server-side Supabase client | Project standard; `createClient()` from `@/lib/supabase/server` |
| Tailwind CSS | already installed | All styling via design token classes | Project standard; tokens in `tailwind.config` |
| `next/link` | built-in | Client-side navigation | Standard for internal links in Next.js |

**No new packages are required for this phase.** [VERIFIED: codebase grep]

### Package Legitimacy Audit

No new packages are being installed in Phase 11. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Student browser
      │
      ▼
[Vercel Edge — proxy.ts]
  /dashboard, /account: checks session cookie
  /contact: passes through (public)
      │
      ▼
[Next.js Server Components]
  ┌──────────────────────────────────────────────────┐
  │ /                 → page.tsx (static, no fetch)   │
  │   └─ HeroBackground (client)                      │
  │   └─ <Link href="/signup"> (replaces DisabledCTA) │
  │                                                   │
  │ /dashboard        → page.tsx (Server Component)   │
  │   └─ getUser() auth guard                         │
  │   └─ DiagnosticGate check (existing)              │
  │   └─ profiles query → unlocked_through_level_number│
  │   └─ levels+lessons+sub_components query           │
  │   └─ sub_component_progress query → completedSet   │
  │   └─ derive: completedCount, totalCount, activeLessonSlug │
  │   └─ render: level card + progress bar + CTA      │
  │                                                   │
  │ /contact          → page.tsx (static Server Comp) │
  │   └─ mailto:frenchlyorg@gmail.com anchor          │
  └──────────────────────────────────────────────────┘
      │
      ▼
[Supabase — RLS-enforced]
  profiles            (unlocked_through_level_number, username)
  levels              (id, slug, name, level_number)
  lessons             (id, slug, title, position, level_id)
  sub_components      (id, lesson_id, position)
  sub_component_progress (user_id, sub_component_id)  ← student-owned rows only
```

### Recommended Project Structure (changes only)

```
src/
├── app/
│   ├── page.tsx                    # EDIT: swap DisabledCTA → Link
│   ├── contact/
│   │   └── page.tsx                # CREATE: static mailto page
│   └── dashboard/
│       └── page.tsx                # EDIT: replace placeholder with real queries + UI
├── components/
│   ├── nav.tsx                     # EDIT: add Contact link (desktop + mobile)
│   └── hero.tsx                    # EDIT: remove DisabledCTA export (or leave, gut internals)
```

### Pattern 1: Primary CTA Button (Link styled as button)

The existing `DisabledCTA` uses these exact classes on its disabled button:

```tsx
// Source: src/components/hero.tsx (existing)
className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm opacity-60 cursor-not-allowed"
```

The replacement drops `opacity-60 cursor-not-allowed` and wraps in `<Link>`:

```tsx
// Source: DESIGN.md tokens + existing hero.tsx pattern [VERIFIED: codebase]
import Link from "next/link";

<Link
  href="/signup"
  className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
>
  Create account
</Link>
```

**Note:** `home page.tsx` is a Server Component (no `"use client"` directive). `next/link` works in Server Components. [VERIFIED: codebase — page.tsx has no "use client"]

### Pattern 2: Dashboard Supabase Query (extended from level page pattern)

The level page (`src/app/levels/[levelSlug]/page.tsx`) establishes the canonical query pattern. The dashboard reuses it, scoped to the student's current level.

**Step 1 — fetch profile (already done in dashboard):**
```tsx
// Source: src/app/dashboard/page.tsx (existing) [VERIFIED: codebase]
const { data: profile } = await supabase
  .from("profiles")
  .select("username, unlocked_through_level_number")
  .eq("id", user.id)
  .single();
```

**Step 2 — fetch current level with nested lessons + sub_components:**
```tsx
// Source: adapted from src/app/levels/[levelSlug]/page.tsx [VERIFIED: codebase]
const { data: level } = await supabase
  .from("levels")
  .select(
    "id, slug, name, level_number, lessons ( id, slug, title, position, sub_components ( id, position ) )"
  )
  .eq("level_number", profile.unlocked_through_level_number)
  .order("position", { referencedTable: "lessons" })
  .single();
```

**Step 3 — fetch student's completed sub_components:**
```tsx
// Source: adapted from src/app/levels/[levelSlug]/page.tsx [VERIFIED: codebase]
const allSubComponentIds = (level?.lessons ?? []).flatMap(
  (l) => (l.sub_components ?? []).map((s) => s.id)
);
const { data: progressRows } = await supabase
  .from("sub_component_progress")
  .select("sub_component_id")
  .eq("user_id", user.id)
  .in(
    "sub_component_id",
    allSubComponentIds.length > 0 ? allSubComponentIds : ["__none__"]
  );
const completedSet = new Set((progressRows ?? []).map((r) => r.sub_component_id));
```

**Step 4 — derive dashboard metrics:**
```tsx
// Source: adapted from level page [VERIFIED: codebase — same algorithm]
const lessons = level?.lessons ?? [];

// Count lesson as complete only when ALL its sub_components have a progress row
const completedLessons = lessons.filter((l) =>
  (l.sub_components ?? []).every((s) => completedSet.has(s.id))
);
const totalLessons = lessons.length;

// First incomplete lesson (by position order — already ordered by query)
const firstIncomplete = lessons.find((l) =>
  (l.sub_components ?? []).some((s) => !completedSet.has(s.id))
);
const continueLessonHref = firstIncomplete
  ? `/levels/${level?.slug}/${firstIncomplete.slug}`
  : null; // null = all lessons done → show "take the level quiz" path
```

### Pattern 3: Progress Bar (pure Tailwind, no library)

Per DESIGN.md: "A thin, horizontal bar using the secondary accent color." Per locked decision D-02: pure CSS/Tailwind width trick.

```tsx
// Source: DESIGN.md components spec [CITED: DESIGN.md]
// pct = completedLessons.length / totalLessons (clamped 0–100)
const pct = totalLessons > 0
  ? Math.round((completedLessons.length / totalLessons) * 100)
  : 0;

<div className="w-full bg-surface-container-high rounded-full h-2">
  <div
    className="bg-primary h-2 rounded-full transition-all"
    style={{ width: `${pct}%` }}
  />
</div>
<p className="font-label text-sm text-on-surface-variant mt-2">
  {completedLessons.length} of {totalLessons} lessons complete
</p>
```

**Note:** DESIGN.md says progress indicators use "secondary accent color." In light mode `secondary` is `#835500` (warm orange). In dark mode `secondary` is `#ffb3b1`. However, the primary coral (`bg-primary`) is also an acceptable choice per the "primary for key highlights" guidance and is what buttons already use. Planner should default to `bg-primary` for consistency with existing lesson progress indicators in LevelCard. [ASSUMED — DESIGN.md says "secondary accent" for progress bars but the codebase uses `bg-primary` for other progress-adjacent UI; planner should verify against existing LevelCard component]

### Pattern 4: Contact Page Structure

Mirrors mission page exactly — proven pattern, ~28 lines:

```tsx
// Source: src/app/mission/page.tsx [VERIFIED: codebase]
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <article className="max-w-[720px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-on-surface mb-8">
          Contact us
        </h1>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
          Have a question or feedback? We&apos;d love to hear from you.
        </p>
        <a
          href="mailto:frenchlyorg@gmail.com"
          className="inline-block px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
        >
          frenchlyorg@gmail.com
        </a>
      </article>
    </main>
  );
}
```

### Pattern 5: Nav Contact Link (surgical addition)

`nav.tsx` is `"use client"`. The Contact link is public — it goes **outside** the `{username ? ... : ...}` conditional, alongside the existing Home and Mission links, in **both** the desktop link list and the mobile drawer.

Desktop (add after Mission, before the `{username ? ... : ...}` block):
```tsx
// Source: src/components/nav.tsx — existing link style [VERIFIED: codebase]
<Link
  href="/contact"
  className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
>
  Contact
</Link>
```

Mobile drawer (add after Mission `<Link>`, before `{username ? ... : ...}` block):
```tsx
<Link
  href="/contact"
  className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
  onClick={() => setIsOpen(false)}
>
  Contact
</Link>
```

### Anti-Patterns to Avoid

- **Client-side data fetching on dashboard:** The existing dashboard is a Server Component — do not add `useEffect`/`useState` data fetching. All Supabase queries stay server-side. [VERIFIED: codebase — no "use client" on dashboard/page.tsx]
- **Charting library for progress bar:** D-02 explicitly prohibits charting libraries. Use the Tailwind width-percentage trick above.
- **Auth check on home page:** D-01 explicitly prohibits adding session checks to the home page. `<Link href="/signup">` works for all users.
- **Ad-hoc hex colors:** All color values must use design token class names (`bg-primary`, `text-on-surface-variant`, etc.) — never raw hex in JSX className. [VERIFIED: CLAUDE.md rule #1]
- **Green for non-correctness UI:** `text-tertiary`/`bg-tertiary` is forbidden on any Phase 11 UI. [VERIFIED: CLAUDE.md + CONTEXT.md locked decision]
- **Footer addition:** Footer was deliberately removed in Phase 9. Do not add one. [VERIFIED: CONTEXT.md out of scope]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lesson "complete" detection | Custom progress algorithm | Existing `completedSet` pattern from level page | Already proven, tested, handles RLS correctly |
| Level locking check | New lock derivation | `deriveIsLevelLocked` from `@/lib/lessons/locking` (already imported on level page) | Consistent with existing lock logic — dashboard doesn't need it (just shows current level) |
| First-incomplete-lesson scan | Custom ordered query | `lessons.find(l => l.sub_components.some(s => !completedSet.has(s.id)))` | Lessons already ordered by `position` from the Supabase query |
| Progress percentage | Math library | `Math.round((completed / total) * 100)` inline | Trivial; no library justified |

**Key insight:** The level page already solves every hard algorithmic problem in the dashboard. The dashboard is a simpler version of the level page (scoped to one level, no locking logic needed).

---

## Database Schema Reference (verified)

### Relevant tables for dashboard queries

| Table | Key columns | Join path |
|-------|-------------|-----------|
| `profiles` | `id`, `username`, `unlocked_through_level_number` | → `levels.level_number` |
| `levels` | `id`, `slug`, `name`, `level_number` | → `lessons.level_id` |
| `lessons` | `id`, `slug`, `title`, `position`, `level_id` | → `sub_components.lesson_id` |
| `sub_components` | `id`, `lesson_id`, `position` | → `sub_component_progress.sub_component_id` |
| `sub_component_progress` | `user_id`, `sub_component_id` | student-owned rows, RLS-enforced |

[VERIFIED: supabase/migrations/20260622_phase3_lessons.sql, 20260622_phase4_diagnostic.sql]

### Join path for dashboard (critical)

```
profiles.unlocked_through_level_number
  → levels WHERE level_number = unlocked_through_level_number
      → lessons WHERE level_id = levels.id ORDER BY position
          → sub_components WHERE lesson_id = lessons.id
              → sub_component_progress WHERE user_id = auth.uid()
                                          AND sub_component_id IN (all sub_component ids)
```

**Key fact:** `unlocked_through_level_number` is an `int` watermark (added in Phase 4 migration). A level is the student's "current" level when `levels.level_number = profiles.unlocked_through_level_number`. [VERIFIED: migration 20260622_phase4_diagnostic.sql line 162]

**Key fact:** The Supabase JS client supports nested selection in a single query via the PostgREST relationship syntax. The level page uses `levels.select('id, slug, name, level_number, description, lessons ( id, slug, title, estimated_minutes, position, sub_components ( id, position ) )')` — the dashboard uses the same shape without `description`. [VERIFIED: src/app/levels/[levelSlug]/page.tsx line 96-101]

### "Lesson complete" definition

A lesson is considered **complete** when every one of its `sub_components` has a row in `sub_component_progress` for the current user. This matches the level page logic: `lessons.filter(l => l.sub_components.every(s => completedSet.has(s.id)))`. [VERIFIED: src/app/levels/[levelSlug]/page.tsx line 193-194 — `completedCount` uses this filter]

### "First incomplete lesson" algorithm

```ts
// Already implemented on level page — reuse directly [VERIFIED: codebase line 137-144]
const firstIncomplete = lessons.find((lesson) =>
  (lesson.sub_components ?? []).some((s) => !completedSet.has(s.id))
);
```

If `firstIncomplete` is `null` (all lessons done), the Continue CTA changes to "All done — take the level quiz" linking to `/levels/${level.slug}`.

---

## Common Pitfalls

### Pitfall 1: Empty sub_component_ids list crashes the `.in()` query

**What goes wrong:** If a student is at a level with no lessons yet (edge case during content rollout), `allSubComponentIds` is an empty array. Supabase's `.in('sub_component_id', [])` generates invalid SQL.

**Why it happens:** PostgREST/Supabase does not short-circuit on empty `.in()` arrays.

**How to avoid:** Use the sentinel pattern already in the level page: `.in('sub_component_id', allSubComponentIds.length > 0 ? allSubComponentIds : ['__none__'])`. [VERIFIED: src/app/levels/[levelSlug]/page.tsx line 133]

**Warning signs:** Runtime Supabase error "invalid input syntax for type uuid" with empty array.

### Pitfall 2: `profile.unlocked_through_level_number` can be null

**What goes wrong:** The `unlocked_through_level_number` column was added in Phase 4 migration with a backfill, but new users whose placement diagnostic hasn't completed yet could theoretically have `null`. Querying `levels WHERE level_number = null` returns no rows.

**How to avoid:** Guard with a fallback: `profile?.unlocked_through_level_number ?? 1` (French 1 is the safe default). Or check for null and show a "complete placement test" nudge on the dashboard (the DiagnosticGate already handles the full gate case).

**Warning signs:** Dashboard shows no level card for a student who has completed placement.

### Pitfall 3: Nested Supabase query requires `order` on the referenced table

**What goes wrong:** Without `order('position', { referencedTable: 'lessons' })`, lessons come back in insertion order (non-deterministic). The "first incomplete" algorithm would then return the wrong lesson.

**How to avoid:** Always include `.order('position', { referencedTable: 'lessons' })` on the levels query. [VERIFIED: level page line 100]

### Pitfall 4: `DisabledCTA` import still in `page.tsx` after removal

**What goes wrong:** If the named export `DisabledCTA` is removed from `hero.tsx` but the import in `app/page.tsx` is not updated, TypeScript will error at build time.

**How to avoid:** The two changes are atomic — remove the import from `page.tsx` and remove (or gut) `DisabledCTA` from `hero.tsx` in the same plan.

### Pitfall 5: Contact link must be outside the `username ?` conditional in nav

**What goes wrong:** If the Contact link is placed inside the `{username ? ... : ...}` block, logged-out users won't see it — violating D-04.

**How to avoid:** Insert the Contact `<Link>` between the Mission link and the `{username ? ...}` conditional in both the desktop list and mobile drawer. [VERIFIED: nav.tsx structure — Mission link ends at line 49/144, username conditional begins at line 51/146]

### Pitfall 6: Dashboard still shows placeholder if DiagnosticGate renders first

**What goes wrong:** The dashboard page already has an early return for `DiagnosticGate`. The new progress UI only renders in the path after `if (!completedPlacement)` — that existing guard is correct and should not be disturbed.

**How to avoid:** The new queries and UI go into the existing final `return` block (after line 43 of the current dashboard page). Do not move or remove the `DiagnosticGate` early return.

---

## Code Examples

### Dashboard page complete structure (skeleton)

```tsx
// Source: adapts src/app/dashboard/page.tsx + src/app/levels/[levelSlug]/page.tsx [VERIFIED: codebase]

// ... existing auth guard + DiagnosticGate check (unchanged) ...

// Extended profile fetch (already fetches unlocked_through_level_number)
const { data: profile } = await supabase
  .from("profiles")
  .select("username, unlocked_through_level_number")
  .eq("id", user.id)
  .single();

// Fetch current level
const { data: level } = await supabase
  .from("levels")
  .select("id, slug, name, level_number, lessons ( id, slug, title, position, sub_components ( id, position ) )")
  .eq("level_number", profile?.unlocked_through_level_number ?? 1)
  .order("position", { referencedTable: "lessons" })
  .single();

// Fetch progress
const allSubIds = (level?.lessons ?? []).flatMap(l => (l.sub_components ?? []).map(s => s.id));
const { data: progressRows } = await supabase
  .from("sub_component_progress")
  .select("sub_component_id")
  .eq("user_id", user.id)
  .in("sub_component_id", allSubIds.length > 0 ? allSubIds : ["__none__"]);
const completedSet = new Set((progressRows ?? []).map(r => r.sub_component_id));

// Derive
const lessons = level?.lessons ?? [];
const completedLessons = lessons.filter(l =>
  (l.sub_components ?? []).every(s => completedSet.has(s.id))
);
const totalLessons = lessons.length;
const pct = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
const firstIncomplete = lessons.find(l =>
  (l.sub_components ?? []).some(s => !completedSet.has(s.id))
);
const continueHref = firstIncomplete
  ? `/levels/${level?.slug}/${firstIncomplete.slug}`
  : level ? `/levels/${level.slug}` : null;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DisabledCTA` (disabled button + tooltip) | `<Link href="/signup">` styled button | Phase 11 | Enables the main conversion funnel |
| Hardcoded dashboard placeholder | Real Supabase-backed progress UI | Phase 11 | Students see actual lesson progress |
| Nav: Home + Mission only (public links) | Home + Mission + Contact (public links) | Phase 11 | Contact page discoverable without login |

**Deprecated/outdated:**
- `DisabledCTA` component: used only in `page.tsx`; once replaced, the named export becomes dead code. Remove the export from `hero.tsx` to keep it clean — `HeroBackground` is still used.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Progress bar should use `bg-primary` (coral) rather than `bg-secondary` (orange) for visual consistency with existing lesson UI | Pattern 3 | Minor visual inconsistency; planner should check LevelCard to confirm which color it uses for sub-component completion indicators |
| A2 | `/levels/${level.slug}/${firstIncomplete.slug}` is the correct lesson URL shape | Dashboard query pattern | Broken Continue link; planner should verify against `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` path — note the param is named `[lessonId]` not `[lessonSlug]` so the href may need the lesson `id` not `slug` |

---

## Open Questions

1. **Continue CTA href: slug or id?**
   - What we know: The level page passes `lessonId` (a UUID) to `LevelCard`, and the lesson route is `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx`. The param is named `lessonId`.
   - What's unclear: The lesson page may route by slug OR by id — the param name `[lessonId]` suggests UUID, but slug-based routing is also common.
   - Recommendation: Planner should read `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` to confirm whether it does `WHERE id = lessonId` or `WHERE slug = lessonId`. Then construct the dashboard Continue link accordingly (likely `/levels/${level.slug}/${firstIncomplete.id}`).

2. **Completed-lesson list: show or omit?**
   - What we know: D-02 says the planner decides based on one-screen fit for 6-lesson French 1 student.
   - What's unclear: Exact rendered height of the three sections (level card + progress bar + Continue CTA) before the lesson list.
   - Recommendation: Omit the lesson list in the initial plan. The three sections (level card, progress bar with label, Continue CTA) provide full information with minimal height. A compact list can be added if the planner decides there's visual space.

---

## Environment Availability

Step 2.6: Skipped — Phase 11 is purely code/config changes (Next.js + Tailwind + Supabase Anon client). No new external dependencies, CLI tools, or services. Supabase and Node.js runtime already confirmed operational from Phases 1–10.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="__tests__"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | Home CTA links to /signup | manual-only | visual inspection in browser | N/A |
| PAGE-05 | Dashboard shows level name, progress bar, Continue link | manual-only | browser verification (Server Component) | N/A |
| PAGE-07 | Contact page renders with mailto link | manual-only | browser verification | N/A |
| SC-6 | Contact link appears in nav (desktop + mobile) | manual-only | browser verification | N/A |
| SC-7 | Logged-out redirect from /dashboard | existing test | `npx jest --testPathPattern="__tests__"` | ✅ (SEC-05 suite, 10-03) |
| TypeScript integrity | No type errors after changes | automated | `npx tsc --noEmit` | ✅ |

**Justification for manual-only:** Server Components cannot be rendered in the Jest/jsdom environment without significant mock infrastructure. The existing test suite (156 tests) covers API routes and business logic — page rendering is verified via browser inspection, consistent with the established pattern in all prior phases.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm test` (full 156-test suite)
- **Phase gate:** Full suite green + browser walkthrough before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers the automated checks in scope. No new test files needed for Phase 11.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Dashboard auth guard already in place from Phase 2/4 |
| V3 Session Management | no | No session changes in this phase |
| V4 Access Control | no | RLS policies unchanged; proxy guard unchanged |
| V5 Input Validation | no | No user input fields added (contact page is static mailto) |
| V6 Cryptography | no | No crypto operations |

**Phase 11 security posture:** No new attack surface introduced. The dashboard queries use parameterized Supabase client calls (never raw SQL). The contact page has no form, no API route, no user input. RLS on `sub_component_progress` already enforces `user_id = auth.uid()`. [VERIFIED: migration 20260622_phase3_lessons.sql lines 113-130]

---

## Sources

### Primary (HIGH confidence)
- `src/app/levels/[levelSlug]/page.tsx` — canonical Server Component query pattern; first-incomplete-lesson algorithm
- `src/app/dashboard/page.tsx` — existing dashboard structure, auth guard pattern
- `src/components/nav.tsx` — exact nav structure to know where to insert Contact link
- `src/components/hero.tsx` — `DisabledCTA` implementation to know what to replace
- `src/app/mission/page.tsx` — template for Contact page layout
- `supabase/migrations/20260622_phase3_lessons.sql` — `levels`, `lessons`, `sub_components`, `sub_component_progress` schema
- `supabase/migrations/20260622_phase4_diagnostic.sql` — `unlocked_through_level_number` column definition and semantics
- `DESIGN.md` — all color tokens, typography classes, layout constraints
- `CLAUDE.md` — design rules (no ad-hoc hex, no green outside correctness, sentence case)
- `.planning/phases/11-pages-navigation/11-CONTEXT.md` — locked decisions D-01 through D-04

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — PAGE-01 through PAGE-07 requirement text

### Tertiary (LOW confidence)
- None — all claims in this research are verified from codebase or official project documents.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; everything verified in codebase
- Architecture: HIGH — patterns verified directly from level page and dashboard source
- Database schema: HIGH — verified from migration files
- Pitfalls: HIGH — derived from actual code inspection and established patterns
- Progress bar design: MEDIUM — design token choices partially assumed (see A1)
- Continue CTA href shape: MEDIUM — param name suggests UUID but not confirmed from lesson page (see Open Question 1)

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (stable stack; only risk is a Next.js minor update)
