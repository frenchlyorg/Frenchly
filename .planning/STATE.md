---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 03-01 complete — Phase 3 lesson schema live (4 tables, RLS, seed)
status: in_progress
stopped_at: 03-01 complete — Wave 2 (level page + lesson view) next
last_updated: "2026-06-22T06:51:19.340Z"
progress:
  total_phases: 12
  completed_phases: 2
  total_plans: 11
  completed_plans: 8
  percent: 17
---

# Frenchly — Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-20)

**Core value:** Get a first-time visitor to create an account so they never lose their progress — then keep them coming back through adaptive lessons and honest motivation features.
**Current milestone:** v1.0 — Foundation & Core Product
**Current focus:** Phase 03 — lesson-framework

---

## Current Status

**Milestone:** v1.0
**Phases complete:** 2 / 12
**Current plan:** 03-01 complete — Phase 3 lesson schema live
**Last action:** Plan 03-01 complete — migration 20260622_phase3_lessons.sql (4 tables, RLS, current_level_id guard, French 1 seed) verified live in Supabase (user-confirmed: 2 levels / 2 lessons / 5 sub-components, current_level_id + trigger present). rls-phase3.test.ts 18/18; Wave 0 scaffolds for actions/level. 80 tests (69 pass, 8 todo, 3 skip). Commits dafb838, 8b8b398, 92c03be. 2026-06-22

---

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Project Foundation | complete ✓ | 3/3 done |
| 2 | Authentication & Accounts | complete ✓ | 5/5 done (02-01a, 02-01b, 02-02, 02-03, 02-04 complete) |
| 3 | Lesson Framework | in_progress | 1/3 done (03-01 ✓); Wave 2 next |
| 4 | Diagnostic System | not_started | — |
| 5 | Practice Problem Engine | not_started | — |
| 6 | AI Writing Checker | not_started | — |
| 7 | French 1 Content | not_started | — |
| 8 | French 2 Content | not_started | — |
| 9 | UX Polish & Performance | not_started | — |
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
**Stopped at:** 03-01 complete — schema live and verified
**Next step:** Execute Wave 2 — 03-02 (level page) + 03-03 (lesson view), parallel
