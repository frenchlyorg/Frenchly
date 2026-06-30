# Phase 11: Pages & Navigation — Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/page.tsx` | page (Server Component) | static | `src/app/mission/page.tsx` | role-match |
| `src/components/hero.tsx` | component | static | self (gut existing export) | self-edit |
| `src/app/dashboard/page.tsx` | page (Server Component) | CRUD (read) | `src/app/levels/[levelSlug]/page.tsx` | exact |
| `src/app/contact/page.tsx` | page (Server Component) | static | `src/app/mission/page.tsx` | exact |
| `src/components/nav.tsx` | component (`"use client"`) | event-driven | self (surgical link addition) | self-edit |

---

## Pattern Assignments

### `src/app/page.tsx` (page, static — swap DisabledCTA)

**Analog:** `src/app/mission/page.tsx` (static Server Component pattern) + `src/components/hero.tsx` (button classes)

**Current import block** (`src/app/page.tsx` lines 1-1):
```tsx
import { HeroBackground, DisabledCTA } from "@/components/hero";
```

**After change — drop DisabledCTA, add Link:**
```tsx
import Link from "next/link";
import { HeroBackground } from "@/components/hero";
```

**Current CTA usage** (`src/app/page.tsx` line 16):
```tsx
<DisabledCTA />
```

**Replacement CTA** (derived from `src/components/hero.tsx` lines 113-118 — same classes, drop disabled):
```tsx
<Link
  href="/signup"
  className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
>
  Create account
</Link>
```

**Key fact:** `page.tsx` has no `"use client"` directive — it is a Server Component. `next/link` works in Server Components without change.

---

### `src/components/hero.tsx` (component — gut DisabledCTA export)

**Analog:** self-edit

**Current `DisabledCTA` export** (lines 110-124):
```tsx
export function DisabledCTA() {
  return (
    <div className="relative group inline-block">
      <button
        disabled
        className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm opacity-60 cursor-not-allowed"
      >
        Create account
      </button>
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Coming soon
      </span>
    </div>
  );
}
```

**Action:** Remove the entire `DisabledCTA` export (lines 110-124). `HeroBackground` (lines 17-108) is still used — leave it untouched.

**Pitfall:** Removing `DisabledCTA` from `hero.tsx` and updating the import in `page.tsx` must happen atomically in the same plan. If the named export is removed but the import in `page.tsx` is not updated, `tsc --noEmit` will error at build time.

---

### `src/app/dashboard/page.tsx` (page, CRUD read — replace placeholder)

**Analog:** `src/app/levels/[levelSlug]/page.tsx` (exact role + data flow match)

**Imports pattern** (`src/app/dashboard/page.tsx` lines 1-3, already present — no new imports needed):
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DiagnosticGate from "@/components/diagnostic/DiagnosticGate";
```
Add `Link` from `next/link` for the Continue CTA.

**Auth + DiagnosticGate guard** (`src/app/dashboard/page.tsx` lines 9-39 — DO NOT TOUCH):
```tsx
// Defense-in-depth: proxy already guards this route, but double-check here (T-02-10)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) { redirect("/login?next=/dashboard"); }

const { data: completedPlacement } = await supabase
  .from("diagnostic_attempts")
  .select("id, status")
  .eq("user_id", user.id)
  .eq("diagnostic_type", "placement")
  .eq("status", "completed")
  .maybeSingle();
if (!completedPlacement) {
  const { data: inProgress } = await supabase
    .from("diagnostic_attempts").select("id")
    .eq("user_id", user.id).eq("diagnostic_type", "placement").eq("status", "in_progress")
    .maybeSingle();
  return <DiagnosticGate hasInProgress={!!inProgress} />;
}
```

**Existing profile fetch** (`src/app/dashboard/page.tsx` lines 42-46 — already present, keep as-is):
```tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("username, unlocked_through_level_number")
  .eq("id", user.id)
  .single();
```

**New: level + nested lessons query** (add after profile fetch — pattern from `src/app/levels/[levelSlug]/page.tsx` lines 94-101):
```tsx
const { data: level } = await supabase
  .from("levels")
  .select(
    "id, slug, name, level_number, lessons ( id, slug, title, position, sub_components ( id, position ) )"
  )
  .eq("level_number", profile?.unlocked_through_level_number ?? 1)
  .order("position", { referencedTable: "lessons" })
  .single();
```

**New: sub_component_progress fetch** (pattern from `src/app/levels/[levelSlug]/page.tsx` lines 128-134):
```tsx
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

**New: derive dashboard metrics** (adapted from `src/app/levels/[levelSlug]/page.tsx` lines 124-144):
```tsx
const lessons = level?.lessons ?? [];
const completedLessons = lessons.filter((l) =>
  (l.sub_components ?? []).every((s) => completedSet.has(s.id))
);
const totalLessons = lessons.length;
const pct = totalLessons > 0
  ? Math.round((completedLessons.length / totalLessons) * 100)
  : 0;
const firstIncomplete = lessons.find((l) =>
  (l.sub_components ?? []).some((s) => !completedSet.has(s.id))
);
// CRITICAL: lesson URL uses lessonId (UUID), not slug — confirmed from LevelCard.tsx line 136
const continueHref = firstIncomplete
  ? `/levels/${level?.slug}/lessons/${firstIncomplete.id}`
  : level ? `/levels/${level.slug}` : null;
```

**Progress bar pattern** (from `src/components/lessons/LevelCard.tsx` lines 101-117 — same `bg-primary` fill, same `bg-surface-container-high` track, adapted to lesson granularity):
```tsx
<div
  role="progressbar"
  aria-valuenow={completedLessons.length}
  aria-valuemin={0}
  aria-valuemax={totalLessons}
  aria-label={`${completedLessons.length} of ${totalLessons} lessons complete`}
  className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden"
>
  <div
    className="h-full rounded-full bg-primary transition-all duration-300"
    style={{ width: `${pct}%` }}
  />
</div>
<p className="font-label text-sm text-on-surface-variant mt-2">
  {completedLessons.length} of {totalLessons} lessons complete
</p>
```

**Continue CTA pattern** (primary button style from `src/components/hero.tsx` line 115 — same token classes):
```tsx
{continueHref && (
  <Link
    href={continueHref}
    className="inline-block px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
  >
    {firstIncomplete ? "Continue lesson" : "All done — take the level quiz"}
  </Link>
)}
```

**Container layout** (`src/app/dashboard/page.tsx` lines 51-52 — already correct, keep):
```tsx
<main className="min-h-screen bg-background">
  <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
```

**Replace placeholder** (`src/app/dashboard/page.tsx` lines 58-66 — remove this entire block):
```tsx
{/* Remove this dashed placeholder entirely */}
<div className="border-2 border-dashed border-outline-variant rounded-[16px] p-8 bg-surface-container-low">
  <p className="font-body text-on-surface-variant text-sm mb-1">
    Your lessons are coming soon.
  </p>
  <p className="font-body text-on-surface-variant text-sm">
    French 1 content launches in a future update.
  </p>
</div>
```

**Open question resolved:** The Continue link uses `lessonId` (UUID), not `slug`. Confirmed from `src/components/lessons/LevelCard.tsx` line 136: `href={`/levels/${levelSlug}/lessons/${lessonId}`}`. The `firstIncomplete.id` (UUID) is the correct value.

---

### `src/app/contact/page.tsx` (page, static — CREATE new file)

**Analog:** `src/app/mission/page.tsx` (exact role + layout match — 28 lines)

**Full pattern from analog** (`src/app/mission/page.tsx` lines 1-28):
```tsx
export default function MissionPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <article className="max-w-[720px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-on-surface mb-8">Our mission</h1>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">...</p>
        <a href="/" className="text-primary hover:underline font-label text-sm">
          Back to home
        </a>
      </article>
    </main>
  );
}
```

**Contact page adaptation** (copy mission structure exactly, change content):
```tsx
import Link from "next/link";

export const metadata = {
  title: "Contact — Frenchly",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <article className="max-w-[720px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-on-surface mb-8">
          Contact
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

**Note:** No `"use client"` — pure Server Component. No data fetching. No `next/link` needed (mailto anchor is a plain `<a>`). `metadata` export follows dashboard convention (`src/app/dashboard/page.tsx` lines 5-7).

---

### `src/components/nav.tsx` (component, event-driven — surgical link addition)

**Analog:** self-edit (existing nav structure)

**Existing desktop public link pattern** (`src/components/nav.tsx` lines 38-49):
```tsx
<Link
  href="/"
  className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
>
  Home
</Link>
<Link
  href="/mission"
  className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
>
  Mission
</Link>
```

**Insert after Mission link, before `{username ? ...}` block** (line 50, desktop):
```tsx
<Link
  href="/contact"
  className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
>
  Contact
</Link>
```

**Existing mobile drawer public link pattern** (`src/components/nav.tsx` lines 131-144):
```tsx
<Link
  href="/"
  className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
  onClick={() => setIsOpen(false)}
>
  Home
</Link>
<Link
  href="/mission"
  className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
  onClick={() => setIsOpen(false)}
>
  Mission
</Link>
```

**Insert after mobile Mission link, before `{username ? ...}` block** (line 145, mobile drawer):
```tsx
<Link
  href="/contact"
  className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
  onClick={() => setIsOpen(false)}
>
  Contact
</Link>
```

**Critical placement:** Contact goes OUTSIDE the `{username ? ... : ...}` conditional in both desktop (line 51) and mobile (line 146). D-04 requires it visible to both logged-in and logged-out users.

---

## Shared Patterns

### Primary button / CTA style
**Source:** `src/components/hero.tsx` line 115 (DisabledCTA button classes, minus disabled modifiers)
**Apply to:** Home page CTA (`page.tsx`), dashboard Continue CTA (`dashboard/page.tsx`), contact mailto anchor (`contact/page.tsx`)
```tsx
className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
// For block-level: add "inline-block"
```

### Progress bar (bg-primary fill on bg-surface-container-high track)
**Source:** `src/components/lessons/LevelCard.tsx` lines 109-116
**Apply to:** Dashboard progress bar only
```tsx
<div className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
  <div
    className="h-full rounded-full bg-primary transition-all duration-300"
    style={{ width: `${progressPct}%` }}
  />
</div>
```
**Note:** LevelCard uses `h-1` (sub-component granularity). Dashboard progress bar should use `h-2` (lesson granularity, slightly more prominent). Both use `bg-primary` — confirmed correct (not `bg-secondary`), matching existing lesson UI.

### Server Component auth guard
**Source:** `src/app/dashboard/page.tsx` lines 9-46 (already in dashboard — do not modify)
**Apply to:** Dashboard only (contact and home are public; no guard needed)

### Static marketing page layout
**Source:** `src/app/mission/page.tsx` lines 3-4
**Apply to:** `src/app/contact/page.tsx`
```tsx
<main className="min-h-screen bg-background py-20">
  <article className="max-w-[720px] mx-auto px-5 md:px-6">
```

### Nav public link class (desktop)
**Source:** `src/components/nav.tsx` lines 39-41
**Apply to:** Contact link addition
```
className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
```

### Nav public link class (mobile drawer)
**Source:** `src/components/nav.tsx` lines 132-135
**Apply to:** Contact link addition
```
className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
+ onClick={() => setIsOpen(false)}
```

---

## No Analog Found

None — all five files have close analogs in the codebase.

---

## Key Facts for Planner

1. **Lesson URL shape is `/levels/${levelSlug}/lessons/${lessonId}`** where `lessonId` is a UUID, not a slug. Confirmed from `src/components/lessons/LevelCard.tsx` line 136. The dashboard Continue link must use `firstIncomplete.id`, not `firstIncomplete.slug`.

2. **Empty `.in()` guard is mandatory.** When `allSubComponentIds` is empty, use the sentinel `["__none__"]`. Pattern from `src/app/levels/[levelSlug]/page.tsx` line 133. Without it, Supabase generates invalid SQL.

3. **`profile?.unlocked_through_level_number ?? 1` fallback.** The field can be null for new users. Default to level 1 (French 1) as the safe fallback per RESEARCH.md pitfall 2.

4. **`DisabledCTA` removal is atomic with `page.tsx` import update.** Both changes must be in the same plan or TypeScript build will fail.

5. **Contact link goes outside `{username ? ...}` in nav.** Both desktop (after line 49) and mobile (after line 144) insertion points are outside the conditional block.

6. **Progress bar uses `bg-primary` (coral), not `bg-secondary` (orange).** Confirmed from `LevelCard.tsx` line 113 — the existing lesson progress bar already uses `bg-primary`.

7. **Dashboard queries go AFTER the DiagnosticGate guard block** (after line 39 of current dashboard). The new UI replaces only the dashed placeholder (lines 58-66). Auth guard and DiagnosticGate early return are untouched.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`
**Files read:** 6 (mission/page, dashboard/page, levels/[levelSlug]/page, nav, hero, LevelCard)
**Pattern extraction date:** 2026-06-30
