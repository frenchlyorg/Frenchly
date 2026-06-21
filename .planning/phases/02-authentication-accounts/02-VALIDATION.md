---
phase: 2
slug: authentication-accounts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + @testing-library/react |
| **Config file** | `jest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx jest --testPathPattern=auth --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=auth --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | — | Sign-up creates profile row with username + role | unit | `npx jest --testPathPattern=auth/signup` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | — | Login returns session cookie; getUser() resolves | unit | `npx jest --testPathPattern=auth/login` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SEC-01 | T-02-01 | Vague error returned for bad credentials | unit | `npx jest --testPathPattern=auth/errors` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-03 | — | Logout clears session; redirect to / | unit | `npx jest --testPathPattern=auth/logout` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SEC-03 | T-02-02 | Protected route redirects to /login when no session | integration | `npx jest --testPathPattern=middleware` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | AUTH-04 | — | Account deletion anonymizes PII in profiles table | unit | `npx jest --testPathPattern=auth/delete` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | SEC-02 | T-02-03 | RLS blocks cross-student row reads | integration | `npx jest --testPathPattern=rls` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | SEC-04 | — | No API keys in client bundles | e2e-manual | see manual table | N/A | ⬜ pending |
| 02-05-01 | 05 | 2 | AUTH-05 | — | Rate limit triggers after 5 failed attempts | unit | `npx jest --testPathPattern=auth/ratelimit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.ts` — install Jest 29 + ts-jest + @testing-library/react + jest-environment-jsdom
- [ ] `__tests__/auth/signup.test.ts` — stub for AUTH-01
- [ ] `__tests__/auth/login.test.ts` — stub for AUTH-02
- [ ] `__tests__/auth/errors.test.ts` — stub for SEC-01
- [ ] `__tests__/auth/logout.test.ts` — stub for AUTH-03
- [ ] `__tests__/middleware.test.ts` — stub for SEC-03
- [ ] `__tests__/auth/delete.test.ts` — stub for AUTH-04
- [ ] `__tests__/rls.test.ts` — stub for SEC-02
- [ ] `__tests__/auth/ratelimit.test.ts` — stub for AUTH-05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No API keys in browser network tab | SEC-04 | Bundle scanning not in Jest scope | Open DevTools → Network → XHR; confirm no `SUPABASE_SECRET_KEY` or Anthropic key in request headers or payloads |
| Session persists across browser close/reopen | AUTH-02 | Requires real browser session | Log in → close tab → reopen → confirm still authenticated |
| Admin role redirect after login | AUTH-05 | Requires seeded admin user | Log in as admin → confirm redirect to /admin (not /dashboard) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
