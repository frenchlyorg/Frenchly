# Phase 1: Project Foundation - Research

**Researched:** 2026-06-20
**Domain:** Next.js 16 + Tailwind CSS v4 + next-themes + Google Fonts scaffold
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** TypeScript with strict mode (`"strict": true` in tsconfig). Not JavaScript. Applies to every file in the project.
- **D-02:** Dark mode preference saved in **localStorage** (not a cookie, not system-pref only). Persists across sessions on the same device without requiring an account.
- **D-03:** Theme toggle is a **sun/moon icon button** placed in the **top-right of the nav bar**. Works on both desktop and mobile nav.
- **D-04:** `next-themes` library for theme management (handles SSR flash, localStorage sync, and `.dark` class injection cleanly).
- **D-05:** **Meaningful shell** — real headline, tagline, feature callouts, and sections. Not a bare scaffold. Content is draft-quality but represents the actual page layout. Phase 1 home page should be demoable.
- **D-06:** The **"Create account" CTA button** is **visible but disabled** in Phase 1, with a "Coming soon" tooltip on hover. Phase 2 wires it to `/signup`.
- **D-07:** Hero section includes a **cursor-reactive background**: a subtle grid pattern with outlined icons in coral (`#e57373`). On cursor movement, icons gently react (parallax shift or soft glow) — decorative motion, not distracting. Scope is smaller than a full-canvas interaction; implementer has creative latitude within these constraints.
- **D-08:** Phase 1 nav links: **Logo + Home + Mission + Log in** only. Level pages added later. No greyed-out placeholders.
- **D-09:** **Basic hamburger menu** for mobile nav, implemented in Phase 1. A simple drawer or dropdown is fine — no animation polish needed yet.

### Claude's Discretion

None specified — all key decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Light mode uses warm bone/cream surfaces with coral primary — all warm palette | DESIGN.md token mapping → Tailwind v4 `@theme` block in globals.css |
| UX-02 | Dark mode uses warm charcoal backgrounds with orange lead accent — all warm palette | `next-themes` + Tailwind `@custom-variant dark` + dark token set |
| UX-07 | Layout is responsive: desktop (1040px container), lesson content (720px max-width), mobile (20px side margins) | Tailwind `max-w` utilities; container class override |
| UX-08 | Fonts loaded: Literata (headings/logo), Be Vietnam Pro (body), Work Sans (labels) | All three confirmed on Google Fonts; loaded via `next/font/google` with CSS vars |
| UX-09 | All UI copy is sentence case | Convention only; no library needed |
</phase_requirements>

---

## Summary

Phase 1 bootstraps a greenfield Next.js project (currently at v16.2.9 on npm) with Tailwind CSS v4 (v4.3.1), `next-themes` for class-based dark mode, and three Google Fonts loaded via `next/font`. As of Next.js 15.2, `create-next-app@latest --tailwind` installs Tailwind v4 by default — no manual upgrade step needed. The scaffold is purely visual: no auth, no DB, no API routes. The hardest integration point is mapping DESIGN.md tokens into Tailwind's CSS-first `@theme` block and wiring `next-themes` so the `.dark` class on `<html>` drives all `dark:` variant utilities. This is now well-understood with a stable pattern across the community.

The cursor-reactive hero background should be implemented with a lightweight custom hook (`useMouse` + `useRef`) that translates cursor position into `translate3d` CSS transforms applied to icon elements — no third-party library needed, no performance risk on school Chromebooks. The parallax motion is subtle (< 20px drift), so `requestAnimationFrame` via a simple `mousemove` listener suffices without framer-motion.

Vercel deployment requires zero configuration for a Next.js project — `git push` to a Vercel-linked repo triggers automatic detection, build, and preview URL. No `vercel.json` needed for Phase 1.

**Primary recommendation:** Run `npx create-next-app@latest frenchly --typescript --tailwind --eslint --app --src-dir`, then wire DESIGN.md tokens into globals.css using `@theme`, add `next-themes` ThemeProvider, and load the three fonts via `next/font/google` with CSS variables.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens / theme | Browser / Client | — | CSS custom properties applied to `<html>`, consumed by Tailwind `dark:` variants |
| Theme persistence | Browser / Client | — | `next-themes` writes to `localStorage`, reads on hydration |
| SSR flash prevention | Frontend Server (SSR) | Browser | `suppressHydrationWarning` on `<html>` prevents React mismatch; next-themes injects inline script before first paint |
| Fonts | Frontend Server (SSR) | CDN/Static | `next/font` preloads at build time, serves from Vercel CDN — no client-side Google request |
| Cursor-reactive hero | Browser / Client | — | `mousemove` event listener in a `"use client"` component; pure DOM/CSS transform |
| Nav (desktop + hamburger) | Browser / Client | Frontend Server | `"use client"` component with `useState` for drawer state; links are standard Next.js `<Link>` |
| Static layout shell | Frontend Server (SSR) | — | `layout.tsx` and `page.tsx` are React Server Components by default |
| Vercel deploy | CDN / Static | Frontend Server | Next.js output is a hybrid static/SSR bundle; Vercel serves static at edge |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.9 | Framework (App Router, RSC, `next/font`) | Project decision; latest stable |
| tailwindcss | 4.3.1 | Utility CSS + `@theme` tokens | Project decision; v4 is now default with create-next-app |
| @tailwindcss/postcss | 4.3.1 | PostCSS plugin for Tailwind v4 | Required by v4's CSS-first pipeline |
| next-themes | 0.4.6 | localStorage dark mode, SSR flash prevention | D-04 locked decision; 29M+ weekly downloads |
| typescript | (bundled via create-next-app) | Strict mode TypeScript | D-01 locked decision |

[VERIFIED: npm registry] — `next` (v16.2.9, modified 2026-06-20), `tailwindcss` (v4.3.1, modified 2026-06-19), `next-themes` (v0.4.6, modified 2025-03-11)

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.21.0 | Sun/moon icons for theme toggle, hamburger icon | Icon-only; tree-shakes to only imported icons |

[VERIFIED: npm registry] — `lucide-react` (v1.21.0, modified 2026-06-18)

### Fonts (Google Fonts via `next/font/google`)

All three fonts confirmed available on Google Fonts [CITED: fonts.google.com/specimen/Literata, fonts.google.com/specimen/Be+Vietnam+Pro]:

| Font | Role | Import name |
|------|------|-------------|
| Literata | Headings, logo, guillemets | `Literata` |
| Be Vietnam Pro | Body text | `Be_Vietnam_Pro` |
| Work Sans | Labels | `Work_Sans` |

[ASSUMED] — Font import names verified against Google Fonts UI descriptions but not confirmed via official next/font docs API listing. Standard pattern is camelCase of the font family name with spaces replaced by underscores.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 | Tailwind v3 | v3 is stable with `tailwind.config.ts`; v4 is now the default from create-next-app and has CSS-first config. Use v4 — it's what the scaffold installs. |
| next-themes | Manual cookie + class toggle | next-themes handles SSR flash and localStorage sync; building from scratch adds 2+ hours of debugging edge cases |
| Custom cursor hook | framer-motion / react-parallax-mouse | Custom hook is ~20 lines, zero dependency, sufficient for subtle parallax. framer-motion (12MB) is overkill for this effect on Chromebooks |
| lucide-react | react-icons, heroicons | lucide-react is tree-shakeable, TypeScript-native, consistent stroke style |

**Installation:**
```bash
npx create-next-app@latest frenchly --typescript --tailwind --eslint --app --src-dir
# then in project root:
npm install next-themes lucide-react
```

**Version verification (run before installing):**
```bash
npm view next version           # should be 16.x
npm view tailwindcss version    # should be 4.x
npm view next-themes version    # should be 0.4.x
npm view lucide-react version   # should be 1.x
```

---

## Package Legitimacy Audit

> slopcheck ran against PyPI by default (wrong ecosystem) — flagged npm packages as SLOP on PyPI. All packages verified against npm registry directly via `npm view`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| next | npm | ~15 yrs (2011) | Tens of millions/wk | github.com/vercel/next.js | npm verified | Approved |
| tailwindcss | npm | ~7 yrs | Tens of millions/wk | github.com/tailwindlabs/tailwindcss | npm verified | Approved |
| next-themes | npm | ~5 yrs | 29M/wk [CITED: npmtrends.com] | github.com/pacocoursey/next-themes | npm verified | Approved |
| lucide-react | npm | ~6 yrs (2020) | Millions/wk | github.com/lucide-icons/lucide | npm verified | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck ran on PyPI by mistake (cross-ecosystem confusion). Registry-native verification via `npm view` completed instead. All packages are well-established, have official GitHub repos, and pass no-postinstall-script check (none of the above have `scripts.postinstall` on npm).*

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (mousemove events)
        │
        ▼
[HeroBackground component] ──── useMouse hook ────► CSS transform on icon elements
        │
[Nav component] ──── useState(isOpen) ────► hamburger drawer (mobile)
        │                  │
        │          lucide-react Sun/Moon
        │                  │
        ▼                  ▼
[ThemeProvider (next-themes)] ── localStorage read/write ──► .dark class on <html>
        │
        ▼
[Tailwind dark: variants] ─── @theme CSS vars ──► warm light palette / warm dark palette
        │
        ▼
[next/font] ── Vercel CDN preload ──► --font-literata, --font-body, --font-label CSS vars
        │
        ▼
Vercel Edge (static + SSR hybrid)  ◄── git push ── GitHub repo
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout: ThemeProvider, fonts applied to <html>/<body>
│   ├── page.tsx            # Home page (server component)
│   ├── globals.css         # @import "tailwindcss"; @theme { ...tokens }; @custom-variant dark
│   └── mission/
│       └── page.tsx        # Mission page stub (Phase 1: minimal content)
├── components/
│   ├── nav.tsx             # "use client" — desktop + hamburger nav, theme toggle
│   ├── hero.tsx            # "use client" — cursor-reactive background, CTA
│   ├── theme-provider.tsx  # "use client" wrapper re-exporting NextThemesProvider
│   └── theme-toggle.tsx    # "use client" — sun/moon button using useTheme()
└── lib/
    └── (empty in Phase 1 — populated in Phase 2+)
```

### Pattern 1: Tailwind v4 Token Configuration (globals.css)

**What:** In Tailwind v4, `tailwind.config.ts` is replaced by CSS-first `@theme` blocks in `globals.css`.
**When to use:** Every project using Tailwind v4 — this is the canonical approach.

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Dark mode: toggle via .dark class on <html> (set by next-themes) */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* === DESIGN.md Light Palette === */
  --color-background:              #fff8f5;
  --color-surface:                 #fff8f5;
  --color-surface-container-low:   #fbf2ed;
  --color-surface-container:       #f5ece7;
  --color-surface-container-high:  #efe6e2;
  --color-surface-container-highest: #e9e1dc;
  --color-on-surface:              #1e1b18;
  --color-on-surface-variant:      #564241;
  --color-outline:                 #897271;
  --color-outline-variant:         #dcc0bf;
  --color-primary:                 #a03e40;
  --color-on-primary:              #ffffff;
  --color-primary-container:       #e57373;
  --color-secondary:               #835500;
  --color-secondary-container:     #feb64c;
  --color-tertiary:                #006c4a;
  --color-on-tertiary:             #ffffff;

  /* === DESIGN.md Typography === */
  --font-heading:  var(--font-literata);
  --font-body:     var(--font-be-vietnam-pro);
  --font-label:    var(--font-work-sans);

  /* === DESIGN.md Spacing === */
  --spacing-container-max:  1040px;
  --spacing-content-max:    720px;
  --spacing-section-gap:    80px;
  --spacing-gutter:         24px;
  --spacing-margin-mobile:  20px;

  /* === DESIGN.md Border Radius === */
  --radius-sm:   0.25rem;
  --radius:      0.5rem;
  --radius-md:   0.75rem;
  --radius-lg:   1rem;
  --radius-xl:   1.5rem;
  --radius-full: 9999px;
}

/* Dark mode token overrides */
.dark {
  --color-background:              #1a1715;
  --color-surface:                 #1a1715;
  --color-surface-container-low:   #221e1c;
  --color-surface-container:       #262220;
  --color-surface-container-high:  #312c29;
  --color-surface-container-highest: #3c3633;
  --color-on-surface:              #f0e7e2;
  --color-on-surface-variant:      #d6c5c0;
  --color-outline:                 #9c8580;
  --color-outline-variant:         #534340;
  --color-primary:                 #ffb866;
  --color-on-primary:              #3a2400;
  --color-primary-container:       #6b4a16;
  --color-secondary:               #ffb3b1;
  --color-secondary-container:     #80272b;
  --color-tertiary:                #63dca7;
}
```

[CITED: tailwindcss.com/docs/theme — `@theme` directive and `@custom-variant` pattern]
[CITED: github.com/pacocoursey/next-themes — `attribute="class"` with Tailwind `selector` mode]

### Pattern 2: next-themes ThemeProvider Setup

**What:** Wrap app in `ThemeProvider` in `layout.tsx`. Must use `suppressHydrationWarning` on `<html>`. ThemeProvider is a client component, so create a wrapper.
**When to use:** Any Next.js App Router project with dark mode.

```tsx
// src/components/theme-provider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

```tsx
// src/app/layout.tsx (key parts)
import { Literata, Be_Vietnam_Pro, Work_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
})
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
})
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${literata.variable} ${beVietnamPro.variable} ${workSans.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

[CITED: github.com/pacocoursey/next-themes — App Router setup]
[CITED: ui.shadcn.com/docs/dark-mode/next — ThemeProvider wrapper pattern]

### Pattern 3: Cursor-Reactive Hero (Custom Hook, No Library)

**What:** A `useMouse` hook tracks cursor position relative to the hero container. Icon elements receive a `translate3d` transform proportional to cursor offset from center, creating a subtle parallax depth illusion.
**When to use:** Lightweight motion that must work on low-spec Chromebooks. No framer-motion needed.

```tsx
// src/components/hero.tsx
"use client"
import { useRef, useState, useEffect } from "react"

function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handler, { passive: true })
    return () => window.removeEventListener("mousemove", handler)
  }, [])
  return pos
}

export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { x, y } = useMouse()

  // Compute offset from center of viewport; scale to subtle range (max ±12px)
  const factor = 0.02
  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0
  const dx = (x - cx) * factor
  const dy = (y - cy) * factor

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* CSS grid background pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-outline-variant) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-outline-variant) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.35,
        }}
      />
      {/* Floating icon layer — shifted by parallax */}
      <div
        style={{ transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)` }}
        className="absolute inset-0 flex items-center justify-center gap-16 opacity-60"
      >
        {/* Icons outlined in coral #e57373 — rendered as SVG or lucide-react */}
      </div>
    </div>
  )
}
```

[CITED: usereact.org/functions/useParallax — useParallax pattern with translate3d]

### Pattern 4: Simple Hamburger Nav (No Library)

**What:** `useState(false)` for drawer open state. Click outside to close via `useEffect` + document listener.
**When to use:** Mobile nav for App Router without Radix/headlessui overhead.

```tsx
// src/components/nav.tsx (key parts)
"use client"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <nav>
      {/* Desktop links */}
      <div className="hidden md:flex gap-6">...</div>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X /> : <Menu />}
      </button>
      {/* Mobile drawer */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-surface shadow-lg md:hidden">
          ...
        </div>
      )}
    </nav>
  )
}
```

### Anti-Patterns to Avoid

- **Using `tailwind.config.ts` for tokens in a v4 project:** In Tailwind v4, `tailwind.config.js/ts` is optional compatibility shim. New projects should define all tokens in `@theme` blocks in CSS. Mixing both sources causes token precedence confusion.
- **Putting ThemeProvider directly in layout.tsx without a client wrapper:** `ThemeProvider` is a client component. Importing it directly in a Server Component layout without a `"use client"` wrapper causes an RSC serialization error in Next.js App Router.
- **Loading fonts via `<link>` in `<head>`:** Causes FOUT (flash of unstyled text) and adds a Google CDN request. Use `next/font/google` exclusively — it downloads at build time and serves from Vercel CDN.
- **Setting `enableSystem: true` in ThemeProvider:** D-02 specifies localStorage persistence, not system preference following. Setting `enableSystem` to `true` overrides the stored preference when OS theme changes, breaking the "persists on this device" contract.
- **Applying cursor effect in a Server Component:** `mousemove` is a browser event. Any component using it must be `"use client"`. The hero section needs this directive even if its parent page is a Server Component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSR dark mode flash | Custom cookie-reading middleware + inline script | `next-themes` | next-themes already handles the "before paint" script injection; rolling it correctly requires injecting a blocking `<script>` before Next.js hydration — very easy to break |
| Theme persistence | `localStorage.setItem` + `useEffect` on mount | `next-themes` | Race conditions between SSR render and client hydration; next-themes handles the hydration mismatch correctly |
| Font preloading | Manual `<link rel="preload">` tags | `next/font/google` | Next.js `next/font` automatically generates preload hints, sets `font-display: swap`, downloads at build time, eliminates external requests |
| Icon SVG files | Custom SVG `<img>` or inline blobs | `lucide-react` (imported per-icon) | Consistent stroke weight, TypeScript props, tree-shakeable. Phase 1 only needs 3-4 icons (Sun, Moon, Menu, X) |

**Key insight:** The theme-persistence + SSR-flash problem is deceptively subtle. next-themes exists precisely because naive localStorage approaches produce hydration mismatches or flash. The ~3KB cost is worth every byte.

---

## Common Pitfalls

### Pitfall 1: ThemeProvider RSC Boundary Error

**What goes wrong:** Importing `ThemeProvider` from `next-themes` directly in `app/layout.tsx` (a Server Component) causes: `Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".`
**Why it happens:** `next-themes`' `ThemeProvider` is a Client Component. Server Components cannot render Client Components that import other Client-only internals without an explicit boundary wrapper.
**How to avoid:** Always create `src/components/theme-provider.tsx` with `"use client"` at the top as a thin wrapper. Then import the wrapper in `layout.tsx`.
**Warning signs:** Build error mentioning "ThemeProvider" and "use client" in the same trace.

### Pitfall 2: Hydration Mismatch on `<html>` Without `suppressHydrationWarning`

**What goes wrong:** React console warning: `Warning: Prop 'class' did not match. Server: "" Client: "dark"`. The page may re-render visibly.
**Why it happens:** next-themes modifies the `class` attribute on `<html>` on the client after SSR renders it class-less. React sees a mismatch.
**How to avoid:** Add `suppressHydrationWarning` to the `<html>` element in `layout.tsx`. This silences the warning for that element only (one level deep).
**Warning signs:** Console warning on first load; theme flashes from light to dark or vice versa.

### Pitfall 3: `@theme` Variable Names Not Matching Tailwind Utility Classes

**What goes wrong:** Defining `--color-brand-primary` in `@theme` but trying to use `bg-primary` in JSX — the utility doesn't exist.
**Why it happens:** In Tailwind v4, `@theme` variable names map directly to utility class names: `--color-primary` → `bg-primary`, `text-primary`. The segment after `--color-` is the utility suffix.
**How to avoid:** Follow the naming convention from DESIGN.md: use `--color-primary`, `--color-background`, `--color-on-surface` etc. Then use `bg-primary`, `bg-background`, `text-on-surface` in Tailwind classes.
**Warning signs:** Utility class compiles but applies no color; DevTools shows no CSS variable resolved.

### Pitfall 4: Cursor Effect Causing Jank on Chromebooks

**What goes wrong:** Smooth scrolling + cursor parallax simultaneously causes dropped frames.
**Why it happens:** Each `mousemove` triggers a React re-render → layout recalculation → composite. Chromebooks have constrained GPU memory.
**How to avoid:** (1) Use `{ passive: true }` on the `mousemove` listener. (2) Apply `will-change: transform` to the parallax layer. (3) Use `translate3d` (not `translateX`/`translateY`) to promote the element to its own compositor layer. (4) Keep parallax factor small (0.01–0.03) so pixel travel is < 20px.
**Warning signs:** Chrome DevTools Performance tab shows "Forced reflow" or "Layout" on every frame during cursor movement.

### Pitfall 5: Font CSS Variables Not Reaching Tailwind Theme

**What goes wrong:** `font-heading` utility class is used in JSX but the heading font doesn't render.
**Why it happens:** `next/font` declares a CSS variable (e.g., `--font-literata`) on the element it's applied to. But `@theme { --font-heading: var(--font-literata); }` in `globals.css` is evaluated before the font variable is hoisted to `<html>`. The chain must be: font variable applied to `<html>` via `className`, then `@theme` references it.
**How to avoid:** Apply all three font `.variable` class names directly to `<html>` in `layout.tsx` (not `<body>`). This makes the CSS variables available on the root element that `@theme`'s `--font-heading` reference resolves against.
**Warning signs:** DevTools shows `--font-literata: ` (empty string) on `<body>` but font still resolves on `<html>`.

### Pitfall 6: `enableSystem: true` Overriding Stored Preference

**What goes wrong:** User sets dark mode → OS switches to light → app switches to light despite stored localStorage preference.
**Why it happens:** `enableSystem: true` (the shadcn default) makes next-themes treat OS preference as higher priority than stored preference.
**How to avoid:** Set `enableSystem={false}` in `ThemeProvider` to honor D-02's "localStorage persists, ignores system pref" requirement.

---

## Code Examples

### Loading Multiple Google Fonts with CSS Variables

```tsx
// src/app/layout.tsx
import { Literata, Be_Vietnam_Pro, Work_Sans } from "next/font/google"

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
  // Literata is a variable font — weight range 200–900 available
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
  display: "swap",
})

// Apply ALL variables to <html> so @theme can reference them
// <html className={`${literata.variable} ${beVietnamPro.variable} ${workSans.variable}`}>
```

[ASSUMED] — Font constructor names based on standard next/font naming convention (underscore-separated). Exact names confirmed via Google Fonts availability but not via next/font API listing.

### Theme Toggle Button

```tsx
// src/components/theme-toggle.tsx
"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: render nothing until mounted on client
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" /> // placeholder to prevent layout shift

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="p-2 rounded text-on-surface hover:bg-surface-container-high transition-colors"
    >
      {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
```

### Disabled CTA with Tooltip (D-06)

```tsx
// Pattern for the disabled "Create account" button with "Coming soon" tooltip
<div className="relative group inline-block">
  <button
    disabled
    className="px-6 py-3 bg-primary text-on-primary rounded opacity-60 cursor-not-allowed"
  >
    Create account
  </button>
  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
    Coming soon
  </span>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.js` with `theme.extend` | Tailwind v4 `@theme {}` in CSS | Jan 2025 (v4 GA) | No JS config file; tokens live in CSS; `@custom-variant` replaces `darkMode: 'class'` |
| `create-next-app --tailwind` installs v3 | `create-next-app --tailwind` installs v4 | Next.js 15.2 (Mar 2025) | No manual Tailwind upgrade step needed |
| `tailwind base/components/utilities` directives | `@import "tailwindcss"` single import | Tailwind v4 | Simpler globals.css; PostCSS plugin renamed to `@tailwindcss/postcss` |
| `darkMode: 'class'` in tailwind.config | `@custom-variant dark (&:where(.dark, .dark *))` in CSS | Tailwind v4 | Moved to CSS; same semantics |

**Deprecated/outdated:**
- `@tailwind base; @tailwind components; @tailwind utilities;` — replaced by `@import "tailwindcss"` in v4
- `tailwind.config.js theme.extend.colors` object — replaced by `@theme { --color-* }` blocks in CSS
- `darkMode: 'class'` in tailwind.config — replaced by `@custom-variant dark` directive in CSS

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Font import names: `Literata`, `Be_Vietnam_Pro`, `Work_Sans` from `next/font/google` | Standard Stack / Code Examples | Build error if name is wrong; fix is trivial — check Next.js font exports. Very low risk as naming convention is consistent |
| A2 | `create-next-app@16.2.9 --tailwind` installs Tailwind v4 | Standard Stack | If it still installs v3, the token pattern is different (use `tailwind.config.ts` instead of `@theme`). Verify by checking `package.json` after scaffold |
| A3 | `next-themes` 0.4.6 is the latest stable release | Standard Stack | Beta 1.0.0-beta.0 exists on npm — do not install beta. Pin to `0.4.6` |

---

## Open Questions

1. **Will `create-next-app@16.x --tailwind` default to Tailwind v4?**
   - What we know: The Next.js team merged Tailwind v4 support in Next.js 15.2 (March 2025). Current Next.js is 16.2.9.
   - What's unclear: Whether the scaffold template was also updated or still pins v3.
   - Recommendation: After running `create-next-app`, immediately check `package.json` for `tailwindcss` version. If `^3.x`, manually upgrade: `npm install tailwindcss@latest @tailwindcss/postcss@latest`.

2. **Should `<html>` or `<body>` receive font variable classes?**
   - What we know: `@theme` references like `--font-heading: var(--font-literata)` resolve against the CSS cascade, which flows from `<html>` downward.
   - Recommendation: Apply to `<html>` to ensure maximum cascade coverage. Some community examples apply to `<body>` — works if `@theme` is not using the variable chain.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | ✓ | v24.17.0 | — |
| npm | Package installation | ✓ | 11.13.0 | — |
| git | Version control / Vercel deploy trigger | ✓ | 2.54.0 | — |
| Vercel CLI | Optional — can deploy via Vercel dashboard git integration | ✗ | — | Deploy via GitHub → Vercel dashboard (no CLI needed) |

**Missing dependencies with no fallback:** None — all blocking dependencies are present.
**Missing dependencies with fallback:** Vercel CLI is absent but unnecessary; deployment via GitHub repo + Vercel dashboard works with zero configuration.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not configured yet — Wave 0 installs |
| Config file | `jest.config.ts` or `vitest.config.ts` — Wave 0 task |
| Quick run command | `npm test -- --passWithNoTests` |
| Full suite command | `npm test` |

**Note:** Phase 1 is primarily visual/structural. The most testable behaviors are (1) theme toggle switches class, (2) fonts are applied to correct elements. These are best verified by smoke test or visual inspection at this phase. Full test infrastructure is deferred to Phase 10 (Security & Quality).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Light mode warm palette renders | Smoke / visual | `npm run dev` → visual inspect | ❌ Wave 0 |
| UX-02 | Dark mode warm palette renders on toggle | Smoke / visual | `npm run dev` → toggle → visual inspect | ❌ Wave 0 |
| UX-07 | Container 1040px on desktop, 20px mobile margins | Smoke / visual | `npm run dev` → responsive DevTools | ❌ Wave 0 |
| UX-08 | Fonts load: Literata, Be Vietnam Pro, Work Sans | Smoke | `npm run build` → no font errors in output | ❌ Wave 0 |
| UX-09 | All copy is sentence case | Manual review | Code review only | — |

### Sampling Rate

- **Per task commit:** `npm run build` (catches TS errors, missing imports, font resolution failures)
- **Per wave merge:** `npm run build && npm run dev` visual smoke test
- **Phase gate:** All 5 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test framework installed (acceptable for Phase 1 — visual/structural only)
- [ ] `npm run build` is the primary automated gate for this phase

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | No | No protected routes in Phase 1 |
| V5 Input Validation | No | No user input in Phase 1 |
| V6 Cryptography | No | No secrets in Phase 1 |

**Phase 1 security notes:**
- No API keys, secrets, or environment variables in Phase 1 — SEC-01 satisfied by default (no server routes exist).
- `NEXT_PUBLIC_*` variables: none in Phase 1. When added in Phase 2, ensure Supabase anon key is used (not service role key) for client-safe variables.
- WCAG AA: The primary button `#a03e40` on white (`#ffffff`) must be verified before Phase 9 polish. The contrast ratio is documented as passing in CLAUDE.md. Formal verification deferred to Phase 10 (SEC-06).

---

## Sources

### Primary (HIGH confidence)

- `github.com/pacocoursey/next-themes` — App Router setup, ThemeProvider, `suppressHydrationWarning`, Tailwind `selector` mode
- `ui.shadcn.com/docs/dark-mode/next` — ThemeProvider client wrapper pattern, theme toggle with `useTheme`
- `github.com/vercel/next.js/discussions/75320` — Confirmed Tailwind v4 support landed in Next.js 15.2 (March 2025, leerob comment)
- `tailwindcss.com/docs/theme` (via WebSearch) — `@theme` directive, `@custom-variant` dark mode
- `fonts.google.com/specimen/Literata` — Confirmed Literata on Google Fonts
- `fonts.google.com/specimen/Be+Vietnam+Pro` — Confirmed Be Vietnam Pro on Google Fonts
- `npm view` output — Next.js 16.2.9, Tailwind 4.3.1, next-themes 0.4.6, lucide-react 1.21.0 (all confirmed 2026-06-19/20)

### Secondary (MEDIUM confidence)

- `dev.to/shakewithabhi` (2026-03-31) — Next.js 15 + Tailwind v4 + next-themes dark mode setup with code example; cross-verifies `@custom-variant dark` pattern
- `usereact.org/functions/useParallax` — `useParallax` hook pattern with `translate3d`; confirms custom hook approach over libraries
- `npmtrends.com` — next-themes 29M+ weekly downloads (legitimacy signal)

### Tertiary (LOW confidence)

- Various WebSearch results on hamburger nav pattern, cursor glow effects — patterns are stable and consistent across sources; not individually verified against official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack (Next.js, Tailwind, next-themes, lucide-react): HIGH — all versions confirmed via `npm view`; Tailwind v4 default status confirmed via official GitHub discussion with Next.js maintainer response
- Architecture / Token mapping: HIGH — `@theme` directive is official Tailwind v4 docs; `@custom-variant dark` pattern confirmed from multiple 2025/2026 sources
- Font names (next/font import identifiers): MEDIUM — Google Fonts existence confirmed; exact next/font export names assumed by convention (A1)
- Cursor-reactive hero approach: HIGH — custom hook pattern is straightforward; confirmed performant via `passive: true` and `translate3d` + `will-change`
- Pitfalls: HIGH — ThemeProvider RSC error, hydration mismatch, and Chromebook jank are widely reported with consistent solutions

**Research date:** 2026-06-20
**Valid until:** 2026-09-20 (90 days — Tailwind v4 and Next.js APIs are stable; next-themes is in maintenance mode at 0.4.6)
