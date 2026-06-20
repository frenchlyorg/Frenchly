# Phase 1: Project Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 1-project-foundation
**Areas discussed:** TypeScript vs JavaScript, Theme toggle, Home page skeleton scope, Navigation structure

---

## TypeScript vs JavaScript

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript | Type safety, self-documenting models, first-class Next.js support | ✓ |
| JavaScript | Less boilerplate, faster start, can migrate later | |

**User's choice:** TypeScript (strict mode)
**Notes:** One follow-up question offered on tsconfig details — user moved on, indicating defaults (strict: true) are fine.

---

## Theme Toggle — How & Where

### Persistence strategy

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Saves user choice in browser, persists across sessions without account | ✓ |
| System preference only | Reads OS dark/light setting, no manual override | |
| System pref + localStorage override | Defaults to OS, lets user override and remembers it | |

**User's choice:** localStorage

### Toggle placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right of nav bar | Sun/moon icon, standard placement, works desktop + mobile | ✓ |
| Footer | Less prominent, settings-style | |
| Floating corner button | Always visible, slightly obtrusive | |

**User's choice:** Top-right of nav bar
**Notes:** No further questions on animation or icon specifics — user deferred to implementer.

---

## Home Page Skeleton Scope

### Depth of content

| Option | Description | Selected |
|--------|-------------|----------|
| Meaningful shell — real copy + sections | Actual headline, tagline, feature callouts, demoable | ✓ |
| Bare scaffold — layout only | Placeholder text only, pure structure | |

**User's choice:** Meaningful shell with real copy

### CTA button behavior (auth not built yet)

| Option | Description | Selected |
|--------|-------------|----------|
| Visible but disabled, tooltip "Coming soon" | Honest, shows where auth lives, easy Phase 2 wire-up | ✓ |
| Fully styled, links to /signup (404 for now) | Looks real, temp 404 | |
| Scrolls to "How it works" section | Keeps page interactive, good for demos | |

**User's choice:** Disabled with "Coming soon" tooltip

**Notes:** User also requested a cursor-reactive hero element — grid background with outlined icons in coral (#e57373), subtle cursor parallax or glow. Smaller scope than a full canvas interaction. Creative latitude given to implementer.

---

## Navigation Structure

### Nav links

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + Home + Mission + Log in | Minimal, only existing pages, clean | ✓ |
| Logo + all level links (greyed out) + Mission + Log in | Shows full structure, links disabled | |
| Logo only + Log in button | Ultra-minimal | |

**User's choice:** Logo + Home + Mission + Log in

### Mobile nav

| Option | Description | Selected |
|--------|-------------|----------|
| Basic hamburger menu now | Phase 1 establishes working responsive shell | ✓ |
| Defer to Phase 9 | Faster Phase 1, but broken mobile nav through Phases 2–8 | |

**User's choice:** Basic hamburger menu in Phase 1
**Notes:** No animation polish required — simple drawer or dropdown is sufficient.

---

## Claude's Discretion

- Cursor-reactive hero animation style (parallax vs glow vs both) — implementer has creative latitude within: grid + coral outlined icons + reacts to cursor
- Hamburger menu open/close animation — simple is fine
- Home page copy — draft-quality content, implementer writes it

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
