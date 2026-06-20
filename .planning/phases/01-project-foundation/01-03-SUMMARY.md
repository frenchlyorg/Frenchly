---
phase: "01-project-foundation"
plan: "03"
subsystem: "home-page"
tags: ["home-page", "hero", "parallax", "mission-page", "vercel"]
dependency_graph:
  requires:
    - "01-01 (globals.css tokens, ThemeProvider)"
    - "01-02 (layout.tsx fonts, Nav)"
  provides:
    - "home-page-with-hero"
    - "cursor-parallax-hero"
    - "disabled-cta-with-tooltip"
    - "mission-page-stub"
  affects:
    - "Phase 2+ (all pages build on this shell)"
tech_stack:
  added: []
  patterns:
    - "useMouse hook with passive mousemove listener + translate3d parallax"
    - "HeroBackground absolute inset-0 fills relative container in page.tsx"
    - "DisabledCTA group-hover tooltip pattern"
key_files:
  created:
    - "src/components/hero.tsx"
    - "src/app/page.tsx"
    - "src/app/mission/page.tsx"
  modified: []
decisions:
  - "SVG text elements used for French character icons (é, ç, à, «») — no third-party icon lib needed"
  - "willChange: transform on parallax layer for compositor promotion (prevents jank)"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-20"
  tasks_completed: 2
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 01 Plan 03: Home Page + Mission Page Summary

**One-liner:** Cursor-reactive hero with French icon parallax, three feature callout cards, disabled CTA with tooltip, and mission page stub — build exits 0.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Build HeroBackground + DisabledCTA | 616ecc2 | done |
| 2 | Build home page (page.tsx) + mission page | 616ecc2 | done |
| 3 | Deploy to Vercel | — | pending human action |

## What Was Built

**Task 1 — HeroBackground + DisabledCTA:**
- `src/components/hero.tsx`: "use client" component with `useMouse` hook (passive mousemove)
- Layer 1: CSS grid pattern via backgroundImage linear-gradient using `--color-outline-variant`
- Layer 2: Parallax icon layer with `translate3d` + `willChange: "transform"` — 5 French character SVG icons (é, ç, à, «», A) scattered at absolute positions, factor 0.015
- `DisabledCTA`: disabled button with group-hover tooltip "Coming soon"

**Task 2 — Home Page + Mission Page:**
- `src/app/page.tsx`: RSC with hero section (600/680px), 3-card feature section, mission teaser with guillemet decoration, minimal footer
- `src/app/mission/page.tsx`: 720px article with 4 paragraphs of real mission copy
- All copy sentence case; no green; no raw hex values; containers 1040px/720px per spec

## Verification

- `npx tsc --noEmit` — exits 0
- `npm run build` — exits 0, routes: `/`, `/mission`, `/_not-found`
- HeroBackground renders grid + parallax icon layer
- DisabledCTA has `disabled` attribute and tooltip

## Deviations from Plan

None. SVG text elements used for French icons per the plan's allowance ("implementer has creative latitude on exact icon shapes").

## Pending

**Vercel deployment** — requires human action (no git remote or Vercel CLI configured):
1. Create GitHub repo and push: `git remote add origin <url> && git push -u origin master`
2. Go to vercel.com → "Add New Project" → import the repo → Deploy
3. Confirm preview URL returns HTTP 200

## Self-Check: PASSED (pending Vercel deploy)

- [x] `src/components/hero.tsx` starts with `"use client"`, exports `HeroBackground` and `DisabledCTA`
- [x] `useMouse` hook uses `{ passive: true }` mousemove listener
- [x] HeroBackground has grid pattern layer (linear-gradient CSS var)
- [x] HeroBackground has parallax layer with `translate3d` and `willChange: "transform"`
- [x] `DisabledCTA` renders `disabled` button "Create account" with "Coming soon" tooltip
- [x] `src/app/page.tsx` is RSC (no "use client"), h1 "Learn French. Actually learn it."
- [x] Three feature cards with « guillemet decoration
- [x] `src/app/mission/page.tsx` exists, h1 "Our mission", 4 paragraphs of body copy
- [x] `npm run build` exits 0
- [ ] Vercel preview URL returns HTTP 200 — awaiting human deploy
