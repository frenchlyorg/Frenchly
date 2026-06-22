---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 03-02 complete — Level page vertical slice (LESSON-04)
status: in_progress
stopped_at: 03-02 complete — level page, LevelCard, LockBadge, locking helper done
last_updated: "2026-06-22T07:05:00.000Z"
progress:
  total_phases: 12
  completed_phases: 2
  total_plans: 11
  completed_plans: 10
  percent: 18
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
**Current plan:** 03-02 complete — Level page vertical slice (LESSON-04)
**Last action:** Plan 03-02 complete — locking.ts pure helper (3 tests green), LockBadge + LevelCard components (warm tokens, guillemet marker, locked cards non-interactive), /levels/[levelSlug] Server Component (getUser guard, nested Supabase select, deriveIsLevelLocked, 2-col grid). TypeScript clean. 72 tests passing. Commits a87da3b, 48732ff, 9bc27a1. 2026-06-22

---

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Project Foundation | complete ✓ | 3/3 done |
| 2 | Authentication & Accounts | complete ✓ | 5/5 done (02-01a, 02-01b, 02-02, 02-03, 02-04 complete) |
| 3 | Lesson Framework | in_progress | 2/3 done (03-01 ✓, 03-02 ✓); 03-03 next |
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
**Stopped at:** 03-02 complete — level page vertical slice done
**Next step:** Execute 03-03 — lesson view + sub-component progress Server Action
