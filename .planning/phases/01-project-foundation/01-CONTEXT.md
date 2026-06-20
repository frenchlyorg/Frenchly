# Phase 1: Project Foundation - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Initialize the Next.js + Tailwind CSS project with the full design system wired up. Both light and dark themes work and persist. All design tokens from DESIGN.md are in Tailwind config. The site deploys to Vercel with a home page that has real copy, sections, and a cursor-reactive hero — no auth, no lessons yet, just a working, themed, responsive shell.

</domain>

<decisions>
## Implementation Decisions

### Language & Tooling
- **D-01:** TypeScript with strict mode (`"strict": true` in tsconfig). Not JavaScript. Applies to every file in the project.

### Theme Toggle
- **D-02:** Dark mode preference saved in **localStorage** (not a cookie, not system-pref only). Persists across sessions on the same device without requiring an account.
- **D-03:** Theme toggle is a **sun/moon icon button** placed in the **top-right of the nav bar**. Works on both desktop and mobile nav.
- **D-04:** Recommend `next-themes` library for theme management (handles SSR flash, localStorage sync, and `.dark` class injection cleanly).

### Home Page
- **D-05:** **Meaningful shell** — real headline, tagline, feature callouts, and sections. Not a bare scaffold. Content is draft-quality but represents the actual page layout. Phase 1 home page should be demoable.
- **D-06:** The **"Create account" CTA button** is **visible but disabled** in Phase 1, with a "Coming soon" tooltip on hover. Phase 2 wires it to `/signup`.
- **D-07:** Hero section includes a **cursor-reactive background**: a subtle grid pattern with outlined icons in coral (`#e57373`). On cursor movement, icons gently react (parallax shift or soft glow) — decorative motion, not distracting. Scope is smaller than a full-canvas interaction; implementer has creative latitude within these constraints.

### Navigation
- **D-08:** Phase 1 nav links: **Logo + Home + Mission + Log in** only. Level pages (French 1–5) are added in Phase 11 when full navigation is wired. No greyed-out placeholders — clean and honest about current scope.
- **D-09:** **Basic hamburger menu** for mobile nav, implemented in Phase 1. A simple drawer or dropdown is fine — no animation polish needed yet. Every subsequent phase inherits a working responsive shell.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — Full token system: all color values (light + dark), typography scale, spacing units, component specs, border radii. Source of truth for all visual decisions. Every token must appear in Tailwind config.
- `CLAUDE.md` — Project conventions including design system rules (§ Design System Rules), security rules, and file structure conventions.

### Requirements
- `.planning/REQUIREMENTS.md` UX-01–UX-10 — Phase 1 covers UX-01, UX-02, UX-07, UX-08, UX-09 specifically.
- `.planning/ROADMAP.md` Phase 1 — Goal statement and 5 success criteria (must all pass before phase is complete).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No components, hooks, or utilities exist yet.

### Established Patterns
- None yet — Phase 1 establishes the patterns all future phases follow.

### Integration Points
- `DESIGN.md` tokens → `tailwind.config.ts` — the first and most critical integration. Every downstream phase depends on this being correct.
- `next-themes` → `layout.tsx` ThemeProvider wrapping the app — enables `.dark` class switching consumed by Tailwind dark: variants.

</code_context>

<specifics>
## Specific Ideas

- **Cursor-reactive hero:** user described wanting something similar to a cursor-following effect seen on "the antigravity page" but in smaller scope. Specific: grid background + icons outlined in the coral light red (`#e57373`). Motion reacts to cursor position (parallax or glow). Implementer has creative latitude on the exact animation approach.
- **Fonts:** Literata (headings/logo), Be Vietnam Pro (body, generous line height ~1.75–2×), Work Sans (labels). Load via `next/font` — recommended over Google CDN for performance and no FOUT.
- **Sentence case** for all UI copy (enforced per CLAUDE.md rule 9).
- **No heavy shadows** — tonal surface layers only (per DESIGN.md elevation rules).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Project Foundation*
*Context gathered: 2026-06-20*
