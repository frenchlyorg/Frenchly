---
phase: "01-project-foundation"
plan: "02"
subsystem: "nav-fonts-theme"
tags: ["next-font", "google-fonts", "nav", "theme-toggle", "dark-mode", "lucide-react"]
dependency_graph:
  requires:
    - "01-01 (ThemeProvider wrapper, globals.css tokens, scaffold)"
  provides:
    - "root-layout-with-three-google-fonts"
    - "working-theme-toggle-dark-light"
    - "sticky-nav-desktop-and-mobile"
  affects:
    - "01-03 (home page builds on this nav/layout)"
    - "all future phases (nav present on every page)"
tech_stack:
  added:
    - "Literata (next/font/google — variable font)"
    - "Be_Vietnam_Pro (next/font/google — 400/500/600)"
    - "Work_Sans (next/font/google — 400/500)"
  patterns:
    - "next/font/google with CSS variable injection onto <html>"
    - "suppressHydrationWarning on <html> for next-themes class injection"
    - "Mounted guard pattern (useState+useEffect) in ThemeToggle to prevent hydration mismatch"
    - "Sticky nav with tonal border (no drop shadow) per DESIGN.md elevation rules"
key_files:
  created:
    - "src/components/theme-toggle.tsx"
    - "src/components/nav.tsx"
  modified:
    - "src/app/layout.tsx"
decisions:
  - "Committed layout.tsx (Task 1) and nav/toggle (Task 2) as separate commits even though layout.tsx imports Nav — tsc was not run between them per plan note; final tsc exits 0"
  - "Mobile drawer closes on link click (onClick={() => setIsOpen(false)}) — UX improvement added automatically (Rule 2)"
  - "enableSystem=false on ThemeProvider per D-04 — prevents OS preference from overriding user's stored choice"
metrics:
  duration: "~2 minutes"
  completed: "2026-06-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 01 Plan 02: Fonts, ThemeToggle & Nav Summary

**One-liner:** Three Google Fonts wired via next/font with CSS variables on `<html>`, ThemeProvider configured with enableSystem=false, sticky Nav with desktop links + mobile hamburger drawer, and hydration-safe ThemeToggle.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Wire fonts and ThemeProvider into root layout | 6e5c55c | done |
| 2 | Build ThemeToggle and Nav components | ce156b2 | done |

## What Was Built

**Task 1 — Root Layout:**
- `src/app/layout.tsx` replaced: imports Literata (variable font), Be_Vietnam_Pro (400/500/600), Work_Sans (400/500) from `next/font/google`
- All three `.variable` CSS custom properties applied to `<html>` className
- `suppressHydrationWarning` on `<html>` — required for next-themes class injection post-SSR
- `ThemeProvider` from `@/components/theme-provider` with `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, `disableTransitionOnChange`
- `<Nav />` rendered inside ThemeProvider, above `<main>{children}</main>`
- Metadata updated: title "Frenchly", description for the project

**Task 2 — ThemeToggle + Nav:**
- `src/components/theme-toggle.tsx`: `"use client"` with mounted guard (`useState(false)` + `useEffect(() => setMounted(true), [])`); placeholder `<div className="w-9 h-9" />` before mount; renders Sun when dark, Moon when light; uses `resolvedTheme` from `useTheme()`
- `src/components/nav.tsx`: `"use client"` sticky nav (`sticky top-0 z-50`) with tonal border (`border-outline-variant`); Frenchly logo in `font-heading text-primary`; desktop links (Home, Mission, Log in) in `hidden md:flex` container; hamburger `Menu`/`X` icon on mobile (`md:hidden`); mobile drawer with all three links + ThemeToggle; ThemeToggle appears in both desktop and mobile contexts

## Verification

- `npx tsc --noEmit` — exits 0 (no TypeScript errors)
- `npm run build` — exits 0, compiles in 4.0s, generates `/` and `/_not-found` static routes
- Three Google Fonts confirmed in layout imports
- `suppressHydrationWarning` present on `<html>`
- ThemeProvider props: `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Mobile drawer closes on link tap**
- **Found during:** Task 2
- **Issue:** Plan specified mobile drawer links but did not include close-on-navigate behavior. Without it, the mobile drawer stays open after a user taps a link — poor UX that breaks the intended drawer pattern.
- **Fix:** Added `onClick={() => setIsOpen(false)}` to each mobile drawer link.
- **Files modified:** `src/components/nav.tsx`
- **Commit:** ce156b2

## Known Stubs

None. Navigation links for `/mission` and `/login` are real routes that will return 404 until Phase 2 (auth) and Phase 11 (pages/nav) build them out. This is expected — the plan explicitly notes these are placeholder hrefs for this phase.

## Threat Flags

None. All threats in the plan's STRIDE register were accepted or mitigated via hardcoded JSX string literals (T-02-04). No new network endpoints, auth paths, or user data surfaces introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

- [x] `src/app/layout.tsx` imports Literata, Be_Vietnam_Pro, Work_Sans from "next/font/google"
- [x] `<html>` has `suppressHydrationWarning`
- [x] `<html>` className has all three `.variable` values
- [x] ThemeProvider imported from "@/components/theme-provider" with attribute=class, defaultTheme=light, enableSystem=false
- [x] `src/components/theme-toggle.tsx` exists, starts with `"use client"`, exports `ThemeToggle`
- [x] ThemeToggle has mounted guard (useState + useEffect)
- [x] ThemeToggle renders Sun when dark, Moon when light
- [x] `src/components/nav.tsx` exists, starts with `"use client"`, exports `Nav`
- [x] Nav has `sticky top-0` positioning
- [x] Nav logo uses `font-heading` and `text-primary`
- [x] Nav links: Logo (/), Home (/), Mission (/mission), Log in (/login)
- [x] Hamburger `md:hidden`, desktop links `hidden md:flex`
- [x] ThemeToggle in both desktop nav and mobile drawer
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run build` exits 0
- [x] Commit 6e5c55c exists (Task 1)
- [x] Commit ce156b2 exists (Task 2)
