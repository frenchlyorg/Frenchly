---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 07-02
status: Phase 07 in progress — awaiting human review gate (Task 2 checkpoint)
stopped_at: 07-01 Task 1 complete; stopped at Task 2 checkpoint:human-verify
last_updated: "2026-06-27T17:15:00.000Z"
progress:
  total_phases: 12
  completed_phases: 6
  total_plans: 26
  completed_plans: 24
  percent: 50
---

# Frenchly — Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-20)

**Core value:** Get a first-time visitor to create an account so they never lose their progress — then keep them coming back through adaptive lessons and honest motivation features.
**Current milestone:** v1.0 — Foundation & Core Product
**Current focus:** Phase 07 — french-1-content

---

## Current Status

**Milestone:** v1.0
**Phases complete:** 6 / 12
**Current plan:** 07-02
**Last action:** 07-01 Task 1 complete — Lesson 1 (Greetings) SQL migration created (275df28). Stopped at Task 2 checkpoint:human-verify (D-02 sample review gate). User must approve Lesson 1 content format before Wave 2 proceeds.

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
| 7 | French 1 Content | in_progress | 0/2 done (07-01 Wave 1 at checkpoint, 07-02 pending approval) |
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
**Stopped at:** 07-01 Task 2 checkpoint:human-verify — review supabase/migrations/20260625_phase7_french1_content.sql and reply "approved" to unblock Wave 2
**Next step:** Review the migration file, then reply "approved — proceed to Wave 2" (or describe changes needed)
