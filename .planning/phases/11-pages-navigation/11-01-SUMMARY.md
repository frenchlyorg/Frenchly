---
phase: 11-pages-navigation
plan: "01"
subsystem: pages-navigation
tags: [cta, contact, nav, static-pages]
dependency_graph:
  requires: []
  provides: [home-cta-enabled, contact-page, nav-contact-link]
  affects: [src/app/page.tsx, src/components/hero.tsx, src/app/contact/page.tsx, src/components/nav.tsx]
tech_stack:
  added: []
  patterns: [next/link Server Component, static metadata export, mobile drawer onClick close]
key_files:
  created:
    - src/app/contact/page.tsx
  modified:
    - src/app/page.tsx
    - src/components/hero.tsx
    - src/components/nav.tsx
decisions:
  - "No inline-block prefix on home CTA Link — it renders inline inside a flex container so block-level class not needed"
  - "Contact page uses plain <a> for mailto (not next/link) — matches mission/page.tsx pattern for external hrefs"
  - "DisabledCTA removed entirely from hero.tsx — no dead export left behind"
metrics:
  duration_seconds: 399
  completed_date: "2026-06-30"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 11 Plan 01: Home CTA, Contact Page, and Nav Links Summary

**One-liner:** Enabled `/signup` CTA on home page, created static `/contact` page with mailto link, and added Contact to both desktop nav bar and mobile drawer — all outside the auth conditional.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Enable home CTA, remove DisabledCTA | 91af2bb | src/app/page.tsx, src/components/hero.tsx |
| 2 | Create static Contact page | e52bbfe | src/app/contact/page.tsx |
| 3 | Add Contact link to nav (desktop + mobile) | 693840f | src/components/nav.tsx |

## What Was Built

**Task 1 — Home CTA:** Replaced the disabled `<button>` + tooltip wrapper (`DisabledCTA`) with a `<Link href="/signup">` styled with exact primary button token classes. Import in page.tsx updated atomically. `DisabledCTA` export removed from hero.tsx; `HeroBackground` untouched.

**Task 2 — Contact page:** New `src/app/contact/page.tsx` — pure Server Component, no `"use client"`, no data fetching. Exports `metadata` with title `"Contact — Frenchly"`. Mirrors mission/page.tsx layout (`min-h-screen bg-background py-20` / `max-w-[720px]` article). Contains heading, blurb paragraph, and `<a href="mailto:frenchlyorg@gmail.com">` styled as primary button.

**Task 3 — Nav Contact link:** Two surgical insertions in nav.tsx — one in the desktop flex row and one in the mobile drawer — both immediately after the Mission link and before `{username ? ...}`. Desktop uses `text-on-surface-variant hover:text-on-surface text-sm transition-colors`; mobile uses `block px-6 py-3 ...` with `onClick={() => setIsOpen(false)}`.

## Verification

- `npx tsc --noEmit` exits 0 after each task and on final check.
- Acceptance criteria for all three tasks satisfied:
  - `src/app/page.tsx` contains `href="/signup"`, `import Link from "next/link"`, no `DisabledCTA` token
  - `src/components/hero.tsx` no longer exports `DisabledCTA`; still exports `HeroBackground`
  - `src/app/contact/page.tsx` exists, contains `mailto:frenchlyorg@gmail.com`, `max-w-[720px]`, `bg-background py-20`, default-exports `ContactPage`, exports metadata, no `"use client"`
  - `src/components/nav.tsx` has exactly two `href="/contact"` occurrences, both before `{username ?` conditionals

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all three deliverables are fully wired. The contact mailto is live, the CTA points to the real signup route, and the nav links point to existing pages.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are static client-side navigation links and a mailto anchor.

## Self-Check: PASSED

- src/app/page.tsx — contains `href="/signup"` ✓
- src/components/hero.tsx — no `DisabledCTA` ✓
- src/app/contact/page.tsx — exists, contains `mailto:frenchlyorg@gmail.com` ✓
- src/components/nav.tsx — two `href="/contact"` at lines 51 and 152, before username conditionals at lines 57 and 159 ✓
- Commits 91af2bb, e52bbfe, 693840f all present in git log ✓
- `npx tsc --noEmit` exits 0 ✓
