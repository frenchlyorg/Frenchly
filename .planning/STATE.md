---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 09-01
status: Phase 09 in progress — 09-01 complete (skeleton loaders + guillemet active marker)
stopped_at: 09-01 complete. Five loading.tsx skeletons created; activeLessonId wired to LevelCard.isActive. Build clean.
last_updated: "2026-06-28T15:00:00.000Z"
progress:
  total_phases: 12
  completed_phases: 8
  total_plans: 30
  completed_plans: 29
  percent: 70
---

# Frenchly — Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-20)

**Core value:** Get a first-time visitor to create an account so they never lose their progress — then keep them coming back through adaptive lessons and honest motivation features.
**Current milestone:** v1.0 — Foundation & Core Product
**Current focus:** Phase 08 — french-2-content

---

## Current Status

**Milestone:** v1.0
**Phases complete:** 8 / 12
**Current plan:** 09-01
**Last action:** 09-01 complete — five loading.tsx skeleton loaders (level, lesson, dashboard, placement, end-of-level diagnostics) + activeLessonId IIFE wired to LevelCard.isActive on level page. Build clean. See 09-01-SUMMARY.md.

---

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Project Foundation | complete ✓ | 3/3 done |
| 2 | Authentication & Accounts | complete ✓ | 5/5 done (02-01a, 02-01b, 02-02, 02-03, 02-04 complete) |
| 3 | Lesson Framework | complete ✓ | 3/3 done (03-01 ✓, 03-02 ✓, 03-03 ✓); UAT passed |
| 4 | Diagnostic System | complete ✓ | 5/5 done |
| 5 | Practice Problem Engine | complete ✓ | 4/4 done — smoke test passed 2026-06-24 |
| 6 | AI Writing Checker | complete ✓ | 4/4 done |
| 7 | French 1 Content | complete ✓ | 2/2 done (07-01 ✓, 07-02 ✓); UAT passed 2026-06-27 |
| 8 | French 2 Content | complete ✓ | 1/1 done (08-01 ✓); UAT passed 2026-06-28 |
| 9 | UX Polish & Performance | in_progress | 09-01 ✓ |
| 10 | Security & Quality | not_started | — |
| 11 | Pages & Navigation | not_started | — |
| 12 | Deployment & Launch | not_started | — |

---

## Key Context

- **Stack:** Next.js + Tailwind CSS + Supabase + Vercel + Claude Haiku 4.5 (AI checker)
- **Design system:** "Warm Scholastic Minimalist" — fully defined in DESIGN.md (project root). Light + dark palettes, typography tokens, spacing, components all locked.
- **Domain:** frenchly.org — purchased via **IONOS**; DNS not yet pointed to Vercel (deploy = Phase 12)
- **Support email:** frenchlyorg@gmail.com (Gmail, 2FA enabled)
- **Target:** ~Aug 2026 for v1 launch; 1,000 accounts within 3 months of launch
- **Repo:** C:\Users\Ericc\frenchly

---

## Open Items

- [x] Purchase frenchly.org domain — purchased via **IONOS**, DNS not yet pointed to Vercel
- [ ] **Phase 12 deploy — frenchly.org wiring** (do at deployment, not before):
  1. Vercel env: `NEXT_PUBLIC_SITE_URL=https://frenchly.org`
  2. Supabase → Auth → URL Configuration: Site URL `https://frenchly.org` + add redirect `https://frenchly.org/auth/callback` (keep localhost entries)
  3. IONOS DNS → point to Vercel (use exact records Vercel shows when adding the domain)
  4. Re-enable email confirm + real SMTP sender (currently off for dev)
- [ ] Lesson content for French 1 and French 2 (user to supply)
- [ ] Verify WCAG AA contrast ratios on coral button fill (#a03e40) before Phase 9
- [ ] Confirm "active user" thresholds for leaderboard (v2) — e.g., 20 min/day or 5 lessons/week
- [ ] Decide email service (at Phase 12)
- [ ] Confirm body line height (1.78×) feels right on long French passages once real content is in

---

## Session Continuity

**To resume:** Run `/gsd:resume-work` or `/gsd:progress`
**Stopped at:** 09-01 complete. Skeleton loaders on all 5 routes. Guillemet active marker live on level page.
**Next step:** Continue Phase 9 — run `/gsd:execute-phase 9` for 09-02 (post-lesson loading bar + accordion).
