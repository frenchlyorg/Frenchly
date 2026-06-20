# Frenchly

## What This Is

Frenchly (frenchly.org) is a minimalist, adaptive French-learning web platform for high school students. Students take a placement diagnostic, then work through grammar lessons, reading, and writing practice organized by level (French 1–5 + Culture + Above & Beyond). Open-ended writing gets one-line AI feedback; everything auto-gradable is checked instantly by code. Accounts save progress across devices.

## Core Value

Get a first-time visitor to create an account so they never lose their progress — then keep them coming back through adaptive lessons and honest motivation features.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Accounts**
- [ ] User can create account with email + username + password
- [ ] User can log in and stay logged in across sessions
- [ ] User can log out from any page
- [ ] User can delete their account and all associated data
- [ ] Admin/editor role exists for content management

**Lesson Framework**
- [ ] Lessons are organized into levels (French 1–5, Culture, Above & Beyond)
- [ ] Each lesson has trackable sub-components (granular progress)
- [ ] Student progress is saved per sub-component to the database
- [ ] Level pages show time estimate, locked/unlocked state, and sub-components per lesson

**Diagnostic & Adaptive System**
- [ ] Initial diagnostic places student at the correct level on first use
- [ ] End-of-level diagnostic must be passed to unlock the next level
- [ ] Higher levels stay locked until earned through diagnostics

**Practice Problem Engine**
- [ ] Multiple choice problems checked instantly by code (no AI)
- [ ] Fill-in-the-blank problems checked instantly by code
- [ ] Conjugation problems checked instantly by code
- [ ] Matching problems checked instantly by code

**AI Writing Checker**
- [ ] Open-ended writing submissions get one-line AI feedback (Claude Haiku 4.5)
- [ ] Prompt caching used for grading instructions (~90% cost reduction)
- [ ] Per-user rate limits prevent cost abuse
- [ ] If AI checker is unavailable, lesson continues gracefully (no crash)
- [ ] Billing alerts configured on Anthropic API account

**Design & UX**
- [ ] Light mode: warm bone/cream surfaces + coral primary (all warm palette)
- [ ] Dark mode: warm charcoal + orange lead accent (all warm palette)
- [ ] Skeleton loaders while pages/lessons load
- [ ] Post-lesson loading bar with short encouraging message (≤8 words)
- [ ] Guillemet (« ») motif used as decorative frames and active-lesson marker
- [ ] Responsive: desktop (1040px container), lesson content (720px max), mobile (20px margins)
- [ ] Fonts: Literata (headings/logo), Be Vietnam Pro (body), Work Sans (labels)

**Content — v1**
- [ ] French 1 lessons fully built out (grammar-focused)
- [ ] French 2 lessons fully built out (lesson-heavy)

**Security & Quality**
- [ ] No API keys or secrets in front-end code — server-side env vars only
- [ ] Supabase Row-Level Security: students can only read/write their own data
- [ ] All user input sanitized; parameterized queries throughout
- [ ] Rate limiting on auth attempts (brute-force prevention)
- [ ] Basic test suite covering: login, save-progress, diagnostic unlock
- [ ] Accessible: WCAG AA contrast, keyboard navigation, alt text, screen-reader markup

**Hosting & Deployment**
- [ ] Deployed on Vercel, domain frenchly.org configured
- [ ] Supabase Pro (prevents auto-pause on real students)
- [ ] Email service configured for account confirmation and password reset

### Out of Scope (v1)

- French 3, 4, 5/AP — deferred to Phase 2/3
- Culture section (~10 lessons) — deferred to Phase 3
- Above & Beyond (slang, regional variation) — deferred to Phase 3
- AP French with French-language UI instructions — deferred to Phase 3
- Classes + teacher grouping — deferred to Phase 2
- Leaderboards (global and class) — deferred to Phase 2
- Streaks and personal bests — deferred to Phase 2
- UI translations (Spanish, Simplified Chinese) — deferred to Phase 2
- Donation page (Stripe, parents' account) — deferred to Phase 4
- AI support bot — deferred to Phase 4
- Live multiplayer (Kahoot/Blooket-style) — deferred to Phase 5 (optional)
- Timezone bar — deferred (not critical for v1)

## Context

- **Platform:** Next.js (React) + Tailwind CSS, hosted on Vercel
- **Backend/Auth/DB:** Supabase (free tier during dev, Pro at launch)
- **AI Checker:** Claude Haiku 4.5 via Anthropic API (pay-per-use, ~$0.0005/check)
- **Design System:** "Warm Scholastic Minimalist / The Warm Atelier" — fully defined in DESIGN.md (root of repo). Light + dark palettes, typography tokens, spacing, component specs all locked.
- **Domain:** frenchly.org (~$24/yr) — to be purchased to lock the name
- **Support email:** frenchlyorg@gmail.com (2FA enabled)
- **Target users:** US high school students; content stays in French, UI in English (Spanish + Chinese later)
- **Timeline:** Strong v1 target ~Aug 2026; full feature set over ~2 years
- **Success metric:** 1,000 accounts within 3 months of launch

## Constraints

- **Budget:** ~$66–131/month at launch (Vercel Pro $20 + Supabase Pro $25 + AI + email). Keep it lean.
- **AI cost control:** Code-check everything auto-gradable; AI only for open-ended writing. Rate-limit per user. Prompt caching on grading instructions.
- **No PII beyond email + username + password.** Users are minors — keep data minimal, never repurpose it.
- **School devices:** Keep pages light and fast — no heavy 3D, lean bundles. Many students on low-powered Chromebooks.
- **Stripe requires 18+:** Donation page deferred; parents hold account when built.
- **Solo build:** Sized for one developer (the user) with AI assistance.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Tailwind + Vercel | Seamless deploys, huge community, great AI-tool support | — Pending |
| Supabase for auth/DB | Accounts + RLS + backups out of the box; far easier than DIY auth | — Pending |
| Claude Haiku 4.5 for AI checker | Cheapest current-gen model, built for fast short responses | — Pending |
| Code-check all auto-gradable problems | Free, instant, no AI cost for MC/conjugation/fill-in/matching | — Pending |
| AI checker: one-line feedback only | Cost control + avoids essay-writing; single focused correction | — Pending |
| Real leaderboard only (no fake accounts) | Honesty builds trust; classes + empty states handle small numbers | — Pending |
| Warm-only palette per mode (no cool accents) | Coherent "paper" feel; avoids clash; brand differentiator | — Pending |
| Green reserved strictly for correctness feedback | Universal signal ("right = green"); deliberate exception to warm-only rule | — Pending |
| Lightly boxed inputs (not underlined) | Clearer on low-quality school screens; consistent focus state | — Pending |
| Content stays in French; UI in English (Spanish/Chinese later) | Teaching language must be authentic; UI translations are additive | — Pending |
| No Stripe until Phase 4 (parents' account) | Requires 18+; not needed for v1 product value | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:progress`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-20 after initialization*
