---
phase: 02-authentication-accounts
plan: "02"
subsystem: auth
tags: [server-actions, forms, rate-limiting, rls, supabase, nav, dashboard]
dependency_graph:
  requires: [02-01a, 02-01b]
  provides: [signUp, signIn, signOut-stub, SignupForm, LoginForm, dashboard, nav-auth-state]
  affects: [layout.tsx, nav.tsx, proxy.ts]
tech_stack:
  added: [bad-words (profanity filter, ESM)]
  patterns:
    - "'use server' Server Actions with FormData"
    - "Rate limiting via Postgres login_attempts table (no Redis)"
    - "getUser() server-side (never getSession()) — T-02-10 mitigation"
    - "role read from profiles.role, never user_metadata"
    - "signOut stub pattern for compile-time import before Plan 03"
    - "ESM package transform in jest.config.ts (transformIgnorePatterns)"
key_files:
  created:
    - src/app/auth/actions.ts
    - src/components/auth/SignupForm.tsx
    - src/components/auth/LoginForm.tsx
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/signup/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/dashboard/page.tsx
  modified:
    - src/app/layout.tsx
    - src/components/nav.tsx
    - jest.config.ts
    - __tests__/auth/signup.test.ts
    - __tests__/auth/login.test.ts
    - __tests__/auth/errors.test.ts
    - __tests__/auth/ratelimit.test.ts
decisions:
  - "signOut exported as stub from actions.ts so nav.tsx import resolves at compile time before Plan 03"
  - "ESM bad-words package handled by extending jest transformIgnorePatterns rather than mocking"
  - "authResult nullish coalescing in signIn for test environment resilience (no behavior change in prod)"
  - "Lockout banner uses secondary-container (warm amber) per DESIGN.md — not red/error"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-06-21"
  tasks: 3
  files: 14
---

# Phase 2 Plan 02: Core Auth Loop Vertical Slice Summary

## One-liner

signUp/signIn Server Actions with postgres rate limiting, profanity filter, role-based redirect, plus SignupForm/LoginForm client components, /signup /login pages, protected /dashboard, and nav/layout wired to live server-side auth state.

## What was built

### Task 1 — signUp + signIn Server Actions (commit 1691854)

`src/app/auth/actions.ts` implements the full auth loop as a `'use server'` file:

- **signUp**: validates username regex `^[a-zA-Z0-9_]{3,20}$`, profanity filter via `bad-words` with custom bypass list (leetspeak variants), password ≥12 chars + digit, pre-checks username uniqueness in profiles, calls `supabase.auth.signUp` with `options.data.username` for the trigger, maps 'already registered' to email field error and DB unique-constraint 23505 to username error, redirects to `/dashboard`.
- **signIn**: reads x-forwarded-for IP; calls `checkRateLimit(email)` via admin client BEFORE the auth call (anti-enumeration — Pitfall 7); returns lockout message without calling auth if count ≥ 5; calls `signInWithPassword`; on error calls `recordFailedAttempt` and returns vague "Email or password incorrect." (D-13); on success reads `profiles.role` server-side and redirects to `/admin` or `/dashboard`.
- **signOut stub**: exported so `nav.tsx` import resolves at compile time; full implementation in Plan 03.
- `checkRateLimit` and `recordFailedAttempt` private helpers use `createAdminClient` (service role).
- Four test scaffolds fleshed out with 30 unit tests — all mocked, no live DB required.

### Task 2 — SignupForm + LoginForm + auth pages (commit ff6e101)

- **SignupForm**: `"use client"`, email/username/password fields, show/hide toggle (Eye/EyeOff), inline errors with `role="alert"`, username/password hints, `aria-describedby`/`aria-invalid`, `min-h-[44px]`, `border-outline` + `focus:border-b-[3px] focus:border-primary` inputs, "Create account" submit button.
- **LoginForm**: `"use client"`, email/password fields, show/hide toggle, right-aligned "Forgot password?" ghost link, warm `secondary-container/30` lockout banner (not red — per DESIGN.md), inline errors, "Log in to Frenchly" submit.
- `src/app/(auth)/layout.tsx`: passthrough fragment (root layout owns html/body).
- `src/app/(auth)/signup/page.tsx`: 28px Literata heading, 480px max-width card, `rounded-[16px] p-6 md:p-8`, no shadow, sentence case, cross-link to /login.
- `src/app/(auth)/login/page.tsx`: matching structure, "Welcome back" heading, cross-link to /signup.

### Task 3 — Dashboard + nav/layout auth state (commit c91c747)

- **`src/app/layout.tsx`**: made async; calls `createClient()` + `getUser()` server-side; selects `profiles.username` if user is authenticated; passes `username` prop to `<Nav />`.
- **`src/components/nav.tsx`**: added `NavProps { username: string | null }`; conditionally renders `{username}` text + Log out form (desktop AND mobile) vs "Log in" link; Log out submits `signOut` action imported from `@/app/auth/actions`.
- **`src/app/dashboard/page.tsx`**: async Server Component; defense-in-depth `getUser()` check → redirects to `/login?next=/dashboard` if unauthenticated; selects `profiles.username`; `max-w-[1040px]` container; "Welcome back, {username}." heading; dashed-border `surface-container-low` placeholder card.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESM bad-words package fails Jest CJS transform**
- **Found during:** Task 1 test run
- **Issue:** `bad-words` and its dep `badwords-list` are `"type": "module"` (pure ESM). Jest's default `transformIgnorePatterns` excludes all `node_modules`, causing `SyntaxError: Unexpected token 'export'` when loading actions.ts in tests.
- **Fix:** Added `transformIgnorePatterns: ['/node_modules/(?!(bad-words|badwords-list)/)']` to `jest.config.ts`. Also added a `.js` transform rule with `allowJs: true` for the ESM packages.
- **Files modified:** `jest.config.ts`
- **Commit:** 1691854

**2. [Rule 1 - Bug] Test mock ordering caused test isolation failures in ratelimit.test.ts**
- **Found during:** Task 1 test iteration
- **Issue:** Using shared module-level state with `jest.clearAllMocks()` caused `createClient`/`createAdminClient` implementations to leak between tests, causing intermittent failures depending on execution order. `mockImplementationOnce` leftovers from one test were consumed by the next.
- **Fix:** Rewrote `ratelimit.test.ts` using `beforeEach`-registered factory functions (`makeAdminMock`, `makeClientMock`) that re-register `mockImplementation` each test, ensuring full isolation.
- **Files modified:** `__tests__/auth/ratelimit.test.ts`
- **Commit:** 1691854

**3. [Rule 1 - Bug] signIn destructure crash on undefined authResult in test environment**
- **Found during:** Task 1 test iteration
- **Issue:** In Jest, `signInWithPassword` occasionally returned `undefined` due to mock ordering edge cases, causing `Cannot destructure property 'data' of '(intermediate value)'` crash.
- **Fix:** Added `authResult ?? { data: null, error: { message: 'Unknown error' } }` nullish coalescing. This is a no-op in production (Supabase SDK always returns an object) but prevents crashes in test environments with partially-configured mocks.
- **Files modified:** `src/app/auth/actions.ts`
- **Commit:** 1691854

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| "Your lessons are coming soon." / "Level 1 content launches in a future update." | `src/app/dashboard/page.tsx:38-39` | Intentional per plan spec — dashboard placeholder until lesson framework (Phase 3) ships |
| `signOut()` body is empty | `src/app/auth/actions.ts` | Stub for Plan 03 compile-time import; Plan 03 Task 1 implements signOut and redirects to / |

## Threat Flags

No new threat surface beyond what the plan's `<threat_model>` covers. All five STRIDE items (T-02-06 through T-02-10) have mitigations implemented:
- T-02-06 (brute force): `checkRateLimit` runs before auth call, uses `login_attempts` via admin client
- T-02-07 (enumeration): lockout applied regardless of email existence (Pitfall 7); vague D-13 message
- T-02-08 (malformed username): full server-side validation before auth.signUp; 23505 handled
- T-02-09 (role tampering): role read from `profiles.role` server-side in signIn; never from user_metadata
- T-02-10 (unverified session): layout + dashboard both use `getUser()` not `getSession()`

## Self-Check

Checking created files and commits exist:

All 7 created files: FOUND
All 3 task commits: FOUND (1691854, ff6e101, c91c747)
30/30 tests passing
npx tsc --noEmit: 0 errors

## Self-Check: PASSED
