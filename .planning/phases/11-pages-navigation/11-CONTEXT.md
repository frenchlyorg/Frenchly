---
phase: 11-pages-navigation
created: 2026-06-30
status: ready-for-planning
---

# Phase 11 — Pages & Navigation: Context

## Phase Goal

All supporting pages exist and are polished: Home (working CTA), Mission (complete), Dashboard (real progress data), Account Settings (complete), Contact (mailto link). Navigation across all pages is consistent and logged-out users are protected.

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 11 goal, success criteria (lines 303-316)
- `.planning/REQUIREMENTS.md` — PAGE-01 through PAGE-07 definitions
- `DESIGN.md` — design system tokens (colors, typography, spacing)
- `CLAUDE.md` — design rules, layout constraints (lesson 720px, dashboard 1040px)

## Prior Decisions (Already Locked — Do Not Re-Decide)

| Decision | Where locked | What it means for Phase 11 |
|----------|-------------|---------------------------|
| Auth: /signup route fully built | Phase 2 | Home CTA can link directly to /signup |
| Dashboard auth guard | Phase 4 | DiagnosticGate already present; keep it |
| Proxy guard: /dashboard, /account | Phase 2 | SC-7 (logged-out protection) already satisfied for these routes |
| Level/lesson pages auth-guard | Phase 3 | Server-side redirect if no session; SC-7 satisfied for lessons too |
| Footer removed from home | Phase 9 | No global footer; nav-only pattern |
| Design: sentence case, no Title Case | CLAUDE.md | All copy follows this rule |
| Green (`text-tertiary`) = correct-answer only | CLAUDE.md | Cannot use green on any page UI built in Phase 11 |
| Primary button: `bg-primary text-on-primary` | DESIGN.md | Home CTA button must use this pattern |
| No heavy drop shadows (except dropdowns/mobile nav) | DESIGN.md | Card layouts use tonal layers |

## What Already Exists (Do Not Rebuild)

| Page | Route | Current state | Action needed |
|------|-------|--------------|---------------|
| Home | `/` | Full hero + feature cards + mission teaser — BUT CTA is `DisabledCTA` (disabled button, "Coming soon") | Enable CTA: swap for real Link to /signup |
| Mission | `/mission` | Complete — 4 paragraphs, "Back to home" link | Satisfies PAGE-02 / SC-2 — no changes needed |
| French 1 level | `/levels/french-1` | Complete — lessons, locking, diagnostic gate | Satisfies PAGE-03 — no changes needed |
| French 2 level | `/levels/french-2` | Complete — lessons, locking, watermark gating | Satisfies PAGE-04 — no changes needed |
| Account settings | `/account` | Password change (UpdatePasswordForm) + Delete account (DeleteAccountForm with confirmation) | Satisfies PAGE-06 / SC-4 — no changes needed |
| Dashboard | `/dashboard` | Auth guard + DiagnosticGate present — but content is hardcoded placeholder "Your lessons are coming soon. French 1 content launches in a future update." | Replace placeholder with real progress UI |
| Contact | — | Does not exist | Build PAGE-07 |

## Decisions Made in Discussion

### D-01: Home page CTA — enable and link simply

**Decision:** Swap `DisabledCTA` for a real `<Link href="/signup">` styled as the primary button. No auth-awareness on the home page.

**Rationale:** Home is a Server Component. Adding a Supabase session check just to swap the button label adds complexity for marginal gain — logged-in users see nav links to Dashboard anyway. Simpler wins.

**Implementation note:** Replace `<DisabledCTA />` in `src/app/page.tsx` with a styled `<Link>` button pointing to `/signup`. Remove or simplify `DisabledCTA` from `hero.tsx` (it becomes unused). Use `bg-primary text-on-primary` token classes per DESIGN.md.

---

### D-02: Dashboard — real progress layout: level card + progress bar + lesson list

**Decision:** Dashboard replaces the dashed placeholder with three real sections:
1. **Current level card** — level name (French 1 or French 2), locked/unlocked state indicator
2. **Progress bar** — completed lessons / total lessons in current level, displayed as a filled bar with label (e.g. "3 of 6 lessons complete")
3. **Continue lesson link** — a single prominent "Continue" CTA that links to the first incomplete lesson in the current level (or "All done — take the level quiz" if all complete)

The lesson history list (completed lessons) can be shown below the CTA as a compact list of lesson titles with a checkmark, or omitted in favor of the progress bar if the layout gets cluttered. Planner should decide based on what fits one screen without scroll for a typical French 1 student (6 lessons).

**Data sources already in DB:**
- `profiles.unlocked_through_level_number` — current level number (1 or 2)
- `sub_component_progress` (joined through lessons → level) — completed sub_components per lesson
- `levels` + `lessons` tables — level name, total lessons, lesson slugs/IDs

**Existing fetch pattern to follow:** dashboard page already calls `supabase.from("profiles")` and `supabase.from("diagnostic_attempts")` — extend same Server Component fetch, do not add client-side data fetching.

**Planner note:** Check whether `profiles.current_level_id` vs `profiles.unlocked_through_level_number` is the right join key. Lesson page uses `unlocked_through_level_number` for locking; use same field for consistency.

---

### D-03: Contact page — static mailto link

**Decision:** Build a minimal `/contact` page (static Server Component) with a short blurb and a prominent `mailto:frenchlyorg@gmail.com` link styled as the primary button or a visible anchor. No form, no API route, no backend.

**Satisfies:** SC-5 ("Contact page links to frenchlyorg@gmail.com"), PAGE-07.

**Layout:** Match mission page pattern (`max-w-[720px]`, `font-body` prose, `bg-background py-20`) — consistent with the rest of the marketing/info pages.

---

### D-04: Navigation — add Contact to existing top nav only (no footer)

**Decision:** Add a "Contact" link to `src/components/nav.tsx` — desktop bar and mobile drawer — alongside the existing Home / Mission links. No footer to be added (footer was deliberately removed in Phase 9 and that decision stands).

**Contact link position:** After "Mission" in the nav order: Home → Mission → Contact → [Dashboard / Log in] (logged-in-only items).

**Contact link must appear for both logged-in and logged-out users** — it's a public page.

---

## Pages Status After Phase 11

| Req | Page | SC | Status after |
|-----|------|----|-------------|
| PAGE-01 | Home | SC-1 | Enable CTA → pass |
| PAGE-02 | Mission | SC-2 | Already passes |
| PAGE-03 | French 1 level | SC-3 (implied) | Already passes |
| PAGE-04 | French 2 level | SC-3 (implied) | Already passes |
| PAGE-05 | Dashboard | SC-3 | Real data wired → pass |
| PAGE-06 | Account settings | SC-4 | Already passes |
| PAGE-07 | Contact | SC-5 | Build → pass |
| Nav | All pages reachable | SC-6 | Add Contact link → pass |
| Auth guard | Logged-out redirected | SC-7 | Already passes (proxy + server guards) |

## Out of Scope for Phase 11

- Username/profile editing (not in SC-4 requirements; would be Phase 12+ or v2)
- Email notifications or contact form backend (Phase 12 — email service not decided)
- Leaderboard or social features (v2)
- Footer redesign / reintroduction (removed deliberately; revisit if user requests)

## Files Expected to Change

| File | Change |
|------|--------|
| `src/app/page.tsx` | Swap `DisabledCTA` for real `<Link href="/signup">` button |
| `src/components/hero.tsx` | Remove or gut `DisabledCTA` (becomes unused) |
| `src/app/dashboard/page.tsx` | Replace placeholder with real progress queries + UI |
| `src/app/contact/page.tsx` | Create new — static mailto page |
| `src/components/nav.tsx` | Add Contact link (desktop + mobile) |

## Planner Notes

- All new UI must follow warm-palette tokens from DESIGN.md — no ad-hoc hex values
- Dashboard progress bar: pure CSS/Tailwind width trick (no charting library)
- Contact page can be a single file (~30 lines) matching mission page structure
- Nav change is surgical — only the two link lists in desktop + mobile sections need updating
- Run full test suite (`npm test`) + `npx tsc --noEmit` after all changes before marking complete
