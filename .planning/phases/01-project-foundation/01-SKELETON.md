# Frenchly — Walking Skeleton

**Phase:** 01 — Project Foundation
**Created:** 2026-06-20
**Status:** Planned

---

## What Is This

The Walking Skeleton for Frenchly is the thinnest possible end-to-end stack:
a Next.js App Router project with Tailwind v4 design tokens, next-themes dark mode,
three Google Fonts, a responsive nav with hamburger + theme toggle, a demoable home page,
and a Vercel preview deployment. No auth, no DB, no API routes — just a working, themed,
responsive shell every future phase builds on top of.

---

## Architectural Decisions

### Framework

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Hybrid SSR/static, `next/font`, RSC boundary for client components |
| Language | TypeScript strict mode | D-01 — every file, no exceptions |
| Styling | Tailwind CSS v4 | Installed by `create-next-app --tailwind` as of Next.js 15.2; CSS-first `@theme` config |
| Config file | `src/app/globals.css` (`@theme` block) | Replaces `tailwind.config.ts` in Tailwind v4 |
| Dark mode | `.dark` class on `<html>` via next-themes | `@custom-variant dark (&:where(.dark, .dark *))` in globals.css |
| Theme persistence | `localStorage` | D-02 — `enableSystem={false}` in ThemeProvider |
| Icons | `lucide-react` (Sun, Moon, Menu, X) | Tree-shakeable, TypeScript-native |

### Design Tokens

All tokens from DESIGN.md live in `globals.css` inside `@theme {}`.
No tokens in `tailwind.config.ts` (v4 CSS-first model).
Dark mode overrides live in `.dark {}` selector block.

| Token Group | Count | Examples |
|-------------|-------|---------|
| Colors (light) | 17 | `--color-primary: #a03e40`, `--color-background: #fff8f5` |
| Colors (dark) | 16 | `--color-primary: #ffb866`, `--color-background: #1a1715` |
| Fonts | 3 | `--font-heading`, `--font-body`, `--font-label` |
| Spacing | 5 | `--spacing-container-max: 1040px`, `--spacing-margin-mobile: 20px` |
| Radii | 6 | `--radius: 0.5rem`, `--radius-lg: 1rem` |

### Fonts

Loaded via `next/font/google` (no Google CDN request, served from Vercel CDN at build time).
CSS variables applied to `<html>` element so `@theme` references resolve correctly.

| Font | Variable | Role |
|------|----------|------|
| Literata | `--font-literata` | Headings, logo, guillemets |
| Be Vietnam Pro | `--font-be-vietnam-pro` | Body text, generous line height |
| Work Sans | `--font-work-sans` | Labels, metadata |

### Auth

None in Phase 1. Added in Phase 2 (Supabase Auth).

### Database

None in Phase 1. Added in Phase 2 (Supabase).

### Deployment

Vercel — zero-config for Next.js. Git push to GitHub repo → Vercel auto-detects,
builds, and assigns a preview URL. No `vercel.json` needed.

---

## Directory Layout

```
frenchly/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout: ThemeProvider, font vars on <html>
│   │   ├── page.tsx              # Home page (RSC) — meaningful shell, real copy
│   │   ├── globals.css           # @import tailwindcss; @theme tokens; .dark overrides
│   │   └── mission/
│   │       └── page.tsx          # Mission stub (RSC)
│   ├── components/
│   │   ├── nav.tsx               # "use client" — desktop + hamburger, theme toggle
│   │   ├── hero.tsx              # "use client" — cursor-reactive background + CTA
│   │   ├── theme-provider.tsx    # "use client" — re-exports next-themes ThemeProvider
│   │   └── theme-toggle.tsx      # "use client" — sun/moon button with useTheme()
│   └── lib/                      # Empty in Phase 1 — populated Phase 2+
├── public/                       # Static assets
├── DESIGN.md                     # Source of truth for all tokens
├── CLAUDE.md                     # Project conventions
└── .planning/                    # GSD planning artifacts
```

---

## Client/Server Boundary Map

| Component | Directive | Why |
|-----------|-----------|-----|
| `layout.tsx` | Server Component (default) | RSC; imports `theme-provider.tsx` wrapper |
| `page.tsx` (home) | Server Component (default) | Static shell; no browser events |
| `mission/page.tsx` | Server Component (default) | Static content |
| `theme-provider.tsx` | `"use client"` | Wraps next-themes ThemeProvider (client-only) |
| `theme-toggle.tsx` | `"use client"` | `useTheme()` hook requires browser |
| `nav.tsx` | `"use client"` | `useState` for hamburger drawer |
| `hero.tsx` | `"use client"` | `mousemove` event listener for parallax |

---

## Constraints Carried Forward

All future phases inherit these constraints from the Walking Skeleton:

1. **TypeScript strict mode** — every file must compile with `"strict": true` (D-01)
2. **Token-only colors** — no ad-hoc hex values; all colors via `@theme` custom properties
3. **Green = correct feedback only** — tertiary color (`--color-tertiary`) never used for decoration
4. **Sentence case** — all UI copy, always
5. **No heavy shadows** — tonal surface layers only (per DESIGN.md elevation rules)
6. **Font variables on `<html>`** — all three font `.variable` classes on the `<html>` element
7. **`enableSystem={false}`** — next-themes must never override localStorage preference
8. **Server-side API keys only** — no secrets in `NEXT_PUBLIC_*` or client code (Phase 2+)

---

## Phases That Build On This Skeleton

| Phase | What It Adds |
|-------|-------------|
| 2 | Supabase client, auth routes, session handling |
| 3 | Supabase DB schema, lesson data model |
| 6 | Server-side AI route (`/api/check-writing`) |
| 9 | Skeleton loaders, mobile polish, WCAG pass |
| 11 | Full nav wiring (Level pages), footer |
| 12 | Production domain + Supabase Pro |
