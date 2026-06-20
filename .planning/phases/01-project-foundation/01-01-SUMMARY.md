---
phase: "01-project-foundation"
plan: "01"
subsystem: "scaffold"
tags: ["next.js", "tailwind-v4", "design-tokens", "theme", "typescript"]
dependency_graph:
  requires: []
  provides:
    - "next.js-16-app-router-scaffold"
    - "tailwind-v4-css-first-token-config"
    - "next-themes-provider-wrapper"
    - "typescript-strict-mode"
  affects:
    - "01-02 (fonts + nav build on this scaffold)"
    - "01-03 (home page build on this scaffold)"
    - "all future phases (token foundation)"
tech_stack:
  added:
    - "next@16.2.9"
    - "react@19.2.4"
    - "tailwindcss@^4"
    - "@tailwindcss/postcss@^4"
    - "next-themes@^0.4.6"
    - "lucide-react@^1.21.0"
    - "typescript@^5"
  patterns:
    - "Tailwind v4 CSS-first @theme block in globals.css (no tailwind.config.ts)"
    - "@custom-variant dark mapped to .dark class via next-themes"
    - "Client boundary wrapper pattern for next-themes in RSC layout"
key_files:
  created:
    - "src/app/globals.css"
    - "src/components/theme-provider.tsx"
    - "src/app/layout.tsx (scaffold)"
    - "src/app/page.tsx (scaffold)"
    - "tsconfig.json"
    - "package.json"
    - ".gitignore"
  modified: []
decisions:
  - "Scaffolded into temp dir (frenchly-scaffold) then moved files — create-next-app refuses non-empty directories"
  - "Package name corrected from frenchly-scaffold to frenchly in package.json"
  - ".claude/ added to .gitignore (Rule 2 — prevents local tooling from being committed)"
  - "Tailwind v4 confirmed (^4 in devDependencies) — no upgrade needed"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 2
---

# Phase 01 Plan 01: Scaffold & Design Tokens Summary

**One-liner:** Next.js 16 with Tailwind v4 CSS-first token config, all DESIGN.md warm palette tokens in globals.css, and next-themes ThemeProvider client wrapper.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Scaffold Next.js project and install dependencies | 117c1c7 | done |
| 2 | Wire DESIGN.md tokens into globals.css and create ThemeProvider | a244edf | done |

## What Was Built

**Task 1 — Scaffold:**
- Next.js 16.2.9 with App Router, TypeScript strict mode, Tailwind v4, ESLint
- `next-themes` and `lucide-react` installed as runtime dependencies
- `.gitignore` set up (excludes `node_modules`, `.next`, `.env*`, `.claude/`)
- `tsconfig.json` has `"strict": true` (scaffold default — no changes needed)

**Task 2 — Design Tokens + ThemeProvider:**
- `src/app/globals.css` fully replaced: `@import "tailwindcss"`, `@custom-variant dark`, complete `@theme {}` block with all DESIGN.md tokens, `.dark {}` overrides block, base `body` styles
- 20 light-mode color tokens including `--color-primary: #a03e40` and `--color-background: #fff8f5`
- 18 dark-mode override tokens including `--color-primary: #ffb866` and `--color-background: #1a1715`
- Font tokens `--font-heading`, `--font-body`, `--font-label` using `var(--font-*)` references (resolved in layout.tsx when fonts are applied to `<html>`)
- Spacing and border-radius tokens from DESIGN.md
- `src/components/theme-provider.tsx`: `"use client"` wrapper re-exporting `next-themes` ThemeProvider — required for RSC layout.tsx to use it without breaking the server/client boundary

## Verification

- `npx tsc --noEmit` — exits 0 (no TypeScript errors)
- `npm run build` — exits 0, generates `/` and `/_not-found` static routes
- Key token assertions:
  - `@import "tailwindcss"` present (Tailwind v4 — no v3 `@tailwind` directives)
  - `@custom-variant dark (&:where(.dark, .dark *))` present
  - `--color-primary: #a03e40` in `@theme {}` block
  - `--color-primary: #ffb866` in `.dark {}` block
  - `--font-heading: var(--font-literata)` in `@theme {}` block
  - `src/components/theme-provider.tsx` starts with `"use client"` and exports `ThemeProvider`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded into temp dir due to create-next-app refusing non-empty directory**
- **Found during:** Task 1
- **Issue:** `create-next-app` exits with error when the target directory contains any existing files (`.planning/`, `CLAUDE.md`, `DESIGN.md`). There is no `--force` flag.
- **Fix:** Scaffolded into a sibling `frenchly-scaffold/` directory, then copied all generated files into the main repo. `.planning/`, `CLAUDE.md`, and `DESIGN.md` were preserved. Temp directory removed after copy.
- **Files modified:** All scaffold files (package.json, tsconfig.json, src/, public/, etc.)
- **Commit:** 117c1c7

**2. [Rule 2 - Missing critical] Added .claude/ to .gitignore**
- **Found during:** Task 1 (git status inspection)
- **Issue:** The `.claude/` local tooling directory appeared as untracked and would have been committed without `.gitignore` coverage.
- **Fix:** Added `.claude/` entry to `.gitignore` alongside the Next.js scaffold defaults.
- **Files modified:** `.gitignore`
- **Commit:** 117c1c7

**3. [Rule 1 - Bug] Fixed package name from frenchly-scaffold to frenchly**
- **Found during:** Task 1 (reading generated package.json)
- **Issue:** `create-next-app` used the temp directory name `frenchly-scaffold` as the package name.
- **Fix:** Updated `"name"` field in `package.json` to `"frenchly"`.
- **Files modified:** `package.json`
- **Commit:** 117c1c7 (via npm install which updated package.json)

## Known Stubs

None. This plan creates infrastructure only (no UI rendering with stub data).

## Threat Flags

None. Plan's threat model (T-01-01, T-01-SC) covers the npm package installs. `next-themes` and `lucide-react` are both approved in the RESEARCH.md Package Legitimacy Audit. No new network endpoints, auth paths, or user data surfaces introduced.

## Self-Check: PASSED

- [x] `src/app/globals.css` exists and contains `@import "tailwindcss"`, `@custom-variant dark`, `--color-primary: #a03e40`, `.dark {` block with `--color-primary: #ffb866`
- [x] `src/components/theme-provider.tsx` exists and starts with `"use client"`
- [x] `tsconfig.json` has `"strict": true`
- [x] `package.json` has `next@16.2.9`, `tailwindcss@^4`, `next-themes`, `lucide-react`
- [x] Commit `117c1c7` exists (Task 1)
- [x] Commit `a244edf` exists (Task 2)
