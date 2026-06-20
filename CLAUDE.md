# Frenchly — Claude Code Instructions

## Project Overview

Frenchly is a minimalist adaptive French-learning platform for high school students. Built with Next.js + Tailwind CSS + Supabase + Vercel. AI writing checker uses Claude Haiku 4.5.

**Planning artifacts:** `.planning/` directory
**Design system:** `DESIGN.md` (project root) — source of truth for all colors, typography, spacing, components

---

## GSD Workflow

This project uses GSD (Get Shit Done) for structured development.

### Standard Phase Flow
```
/gsd:discuss-phase N    → clarify approach and vision
/gsd:plan-phase N       → create detailed execution plan
/gsd:execute-phase N    → execute the plan
/gsd:progress           → check status, continue
```

### Key Commands
- `/gsd:progress` — check where we are, route to next action
- `/gsd:resume-work` — restore context after a break
- `/gsd:debug` — systematic debugging with persistent state
- `/gsd:quick` — small ad-hoc tasks
- `/gsd:fast "description"` — trivial tasks (≤3 file edits, no planning)

### Config: YOLO mode, Fine granularity, all agents on
Plans execute automatically. Researcher, plan-checker, and verifier all run.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js (App Router) | |
| Styling | Tailwind CSS | Tokens from DESIGN.md → tailwind.config |
| Backend/Auth/DB | Supabase | RLS required on all user tables |
| Hosting | Vercel | |
| AI checker | Claude Haiku 4.5 | Server-side only, never expose API key to client |
| Payments (v4+) | Stripe | Deferred |

---

## Design System Rules (enforced at all times)

1. **All colors come from DESIGN.md tokens** — no ad-hoc hex values
2. **Warm palette only per mode.** Light = cream/coral. Dark = charcoal/orange. Never mix temperature.
3. **Green (tertiary) = correct-answer feedback only.** Nowhere else.
4. **Primary button fill = `#a03e40` with white text** (passes WCAG AA). Lighter coral `#e57373` for hover/borders only.
5. **Inputs = lightly boxed** (not underlined). Focus state = thicker coral bottom border.
6. **Tonal layers over shadows.** No heavy drop shadows except dropdowns/mobile nav.
7. **Fonts:** Literata (headings/logo/guillemets) · Be Vietnam Pro (body) · Work Sans (labels)
8. **Guillemet motif (« »)** = active-lesson marker and decorative section frames
9. **Sentence case** for all UI copy — no Title Case buttons or ALL CAPS labels
10. **Lesson content max-width = 720px.** Dashboard container = 1040px.

---

## Security Rules (non-negotiable)

- **No secrets in client code.** All API keys (Anthropic, Supabase service role) live in server-side env vars only.
- **Supabase RLS** must be enabled on every table that stores user data. Students read/write only their own rows.
- **Parameterized queries only.** No raw SQL string building anywhere.
- **Rate limiting** on auth attempts and AI checker submissions (per user).
- **Input sanitization** on all user-submitted content before storage or display.

---

## AI Checker Rules

- Server-side API route only (`/api/check-writing` or similar)
- One-line feedback maximum — cap response with `max_tokens`
- Use prompt caching for the grading system prompt (identical every call)
- Graceful fallback: if Anthropic API errors, return a friendly message and let the lesson continue
- Per-user rate limit enforced before calling the API

---

## File Conventions

```
frenchly/
├── DESIGN.md              # Design system source of truth
├── CLAUDE.md              # This file
├── .planning/             # GSD planning artifacts
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── REQUIREMENTS.md
│   ├── STATE.md
│   ├── config.json
│   └── phases/            # Created per phase during planning
├── app/                   # Next.js App Router
├── components/            # Shared UI components
├── lib/                   # Utilities, Supabase client, API helpers
└── public/                # Static assets
```

---

## Current Phase

**Next step:** `/gsd:discuss-phase 1` — Project Foundation

See `.planning/ROADMAP.md` for full 12-phase breakdown.
See `.planning/STATE.md` for open items.
