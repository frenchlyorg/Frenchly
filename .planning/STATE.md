---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_plan: 10-02
status: Phase 10 executing — Wave 1 complete (10-01 ✓, 10-03 ✓); Wave 2 ready (10-02 error boundaries + 404)
stopped_at: Phase 10 Wave 1 merged. ErrorCard built, Dependabot configured, API hardened (10-01); SEC-05 test suite verified green 156/156 (10-03). Wave 2: 10-02 error.tsx/global-error.tsx/not-found.tsx with human checkpoint.
last_updated: "2026-06-28T21:30:00Z"
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 34
  completed_plans: 33
  percent: 83
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
**Phases complete:** 9 / 12
**Current plan:** 10-02
**Last action:** Phase 10 Wave 1 complete. 10-01: ErrorCard component (discriminated-union action prop), Dependabot weekly-grouped npm config (SEC-08), check-writing API hardened (stripped Zod field-detail leak → friendly 400). 10-03: SEC-05 verified — all 3 paths green, watermark-advance assertion confirmed at diagnostic/actions.test.ts lines 158-160 and 249-251. 156 tests passing. Wave 2: 10-02 next.

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
| 9 | UX Polish & Performance | complete ✓ | 3/3 done (09-01 ✓, 09-02 ✓, 09-03 ✓); Lighthouse passed 2026-06-28 |
| 10 | Security & Quality | in_progress | 2/3 done (10-01 ✓, 10-03 ✓; 10-02 pending) |
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
**Stopped at:** Phase 10 Wave 1 merged. 10-01 (ErrorCard + Dependabot + API hardening) and 10-03 (SEC-05 test verification) complete. Tests green 156/156. Wave 2 ready: 10-02 builds error.tsx / global-error.tsx / not-found.tsx — has a human checkpoint (visual verify 404 + error card).
**Next step:** Execute 10-02 (Wave 2).
