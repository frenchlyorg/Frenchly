---
phase: 11
slug: pages-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (tsc); ~45 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm test` (full 156-test suite)
- **Before `/gsd:verify-work`:** Full suite green + browser walkthrough of all changed pages
- **Max feedback latency:** ~30 seconds (tsc)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| Home CTA | 01 | 1 | PAGE-01 | No auth check exposed | manual | `npx tsc --noEmit` | ⬜ pending |
| Dashboard data | 01 | 1 | PAGE-05 | RLS-scoped queries, user.id from server | manual | `npx tsc --noEmit` | ⬜ pending |
| Contact page | 02 | 1 | PAGE-07 | Static, no user input | manual | `npx tsc --noEmit` | ⬜ pending |
| Nav Contact link | 02 | 1 | SC-6 | N/A | manual | `npx tsc --noEmit` | ⬜ pending |
| Full suite regression | any | end | all | Existing 156 tests stay green | automated | `npm test` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing test infrastructure covers all automated checks. No new test files needed for Phase 11.

*Justification: Server Components (dashboard, contact, home) cannot be rendered in Jest/jsdom without significant mock infrastructure. Browser verification is the established pattern for all prior page phases in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Home CTA links to /signup | PAGE-01/SC-1 | Server Component, client Link | Visit `/`, click button, confirm routes to /signup |
| Dashboard shows level + progress bar + lessons | PAGE-05/SC-3 | Server Component, real DB data | Log in, visit `/dashboard`, verify level name, bar, lesson list visible |
| Dashboard "Continue" CTA links to first incomplete lesson | PAGE-05/SC-3 | Runtime-dependent on user progress | Click Continue, confirm arrives at correct lesson |
| Contact page renders mailto link | PAGE-07/SC-5 | Static page | Visit `/contact`, confirm `mailto:frenchlyorg@gmail.com` link present |
| Contact link in nav (desktop + mobile) | SC-6 | Client component, visual | Resize browser, confirm Contact link visible in both nav states |
| Logged-out redirect from /dashboard | SC-7 | Already covered by SEC-05 suite | `npm test` covers this path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual instructions
- [ ] TypeScript check passes after every task
- [ ] Full suite (156 tests) green after all waves
- [ ] Browser walkthrough completed: home CTA, dashboard, contact, nav
- [ ] No regressions in existing auth/diagnostic/lesson flows
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
