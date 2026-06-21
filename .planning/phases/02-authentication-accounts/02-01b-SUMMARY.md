---
phase: "02-authentication-accounts"
plan: "01b"
subsystem: "auth-foundation"
tags: ["proxy", "session-refresh", "route-protection", "jest", "test-scaffolds"]
dependency_graph:
  requires: ["02-01a"]
  provides: ["proxy.ts session refresh", "Jest Wave 0 harness", "8 auth test scaffolds"]
  affects: ["02-02", "02-03", "02-04"]
tech_stack:
  added:
    - "jest@29 — test runner"
    - "ts-jest@29 — TypeScript transform for Jest"
    - "ts-node@10 — TypeScript jest.config.ts parsing"
    - "@types/jest@30 — Jest type declarations"
    - "@testing-library/react@16 — React component testing"
    - "@testing-library/jest-dom@6 — custom DOM matchers"
    - "jest-environment-jsdom@30 — jsdom test environment"
  patterns:
    - "Next.js 16 proxy.ts pattern (not middleware.ts)"
    - "Supabase SSR getAll/setAll cookie pattern with two-forEach setAll"
    - "test.todo scaffold pattern for Wave 0 Nyquist compliance"
key_files:
  created:
    - "src/app/proxy.ts — session refresh + protected route redirect"
    - "jest.config.ts — ts-jest preset, jsdom, @/ alias"
    - "jest.setup.ts — @testing-library/jest-dom import"
    - "__tests__/auth/signup.test.ts — AUTH-01 scaffold"
    - "__tests__/auth/login.test.ts — AUTH-02 scaffold"
    - "__tests__/auth/errors.test.ts — SEC-01 scaffold"
    - "__tests__/auth/logout.test.ts — AUTH-03 scaffold"
    - "__tests__/auth/delete.test.ts — AUTH-04 scaffold"
    - "__tests__/auth/ratelimit.test.ts — AUTH-05 scaffold"
    - "__tests__/middleware.test.ts — SEC-03 scaffold"
    - "__tests__/rls.test.ts — SEC-02 scaffold"
  modified:
    - "package.json — added test script and Jest devDependencies"
decisions:
  - "proxy.ts uses getUser() not getSession() — server-side token verification (T-02-03)"
  - "setAll has two forEach passes — first on request.cookies, then on supabaseResponse.cookies — missing either breaks session refresh silently"
  - "ts-node installed as devDependency to parse jest.config.ts (blocked without it)"
  - "test.todo() used in all scaffolds — file present and suite green without false positives"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-06-21T15:42:47Z"
  tasks_completed: 2
  tasks_total: 3
  files_created: 11
  files_modified: 1
---

# Phase 2 Plan 01b: Proxy and Jest Harness Summary

**One-liner:** Next.js 16 proxy.ts with Supabase SSR session refresh + protected-route redirect, plus Jest 29 + ts-jest harness with 8 Wave 0 auth test scaffolds.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Push schema to live DB | (prior state — done in 02-01a run) | supabase/migrations/20260620_phase2_auth.sql applied |
| 2 | Create proxy.ts | 007e221 | src/app/proxy.ts |
| 3 | Install Jest + create scaffolds | 6ab725e | jest.config.ts, jest.setup.ts, package.json, 8 test files |

---

## What Was Built

### Task 2: proxy.ts

`src/app/proxy.ts` exports `proxy` (async) and `config`. The proxy:

- Builds a mutable `supabaseResponse` via `NextResponse.next({ request })`
- Creates a Supabase server client with `getAll`/`setAll` cookie methods
- The `setAll` implementation uses **two forEach passes**: first sets cookies on `request.cookies` (to propagate into the new `NextResponse`), then reassigns `supabaseResponse = NextResponse.next({ request })`, then sets cookies on `supabaseResponse.cookies` with options. Missing either pass breaks session refresh silently.
- Calls `auth.getUser()` (never `getSession()`) — triggers server-side token verification (T-02-03 mitigation)
- Redirects unauthenticated users hitting `/dashboard`, `/admin`, or `/account` to `/login?next=<pathname>` (D-09 requirement)
- Returns `supabaseResponse` for all other cases

### Task 3: Jest Harness (Wave 0)

- `jest.config.ts`: ts-jest preset, jsdom environment, `@/` → `src/` module alias, `setupFilesAfterEnv` pointing to `jest.setup.ts`
- `jest.setup.ts`: imports `@testing-library/jest-dom`
- `package.json`: `"test": "jest"` script added (no `--watch`)
- 8 scaffold test files with `test.todo()` placeholders naming requirement IDs — all suites pass green with 20 todos total

---

## Verification Results

- `src/app/proxy.ts` exists; `src/middleware.ts` does not exist
- `proxy` exports `proxy` (async) and `config` with matcher
- `auth.getUser()` called; `getSession()` never called (only in comment)
- `npx tsc --noEmit` exits 0
- `npx jest --passWithNoTests` — 8 suites passed, 20 todo, 0 failures

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ts-node missing for TypeScript jest config parsing**
- **Found during:** Task 3 verification
- **Issue:** `jest.config.ts` is a TypeScript file; Jest requires `ts-node` to parse it. It was not listed in the plan's devDependencies.
- **Fix:** Installed `ts-node@10` as a devDependency.
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 6ab725e (included in same task commit)

---

## Known Stubs

All 8 test files use `test.todo()` — intentional Wave 0 scaffolding. Each stub names the requirement ID it will cover. Downstream plans (02-02, 02-03, 02-04) will replace the todos with real implementations.

---

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced in this plan. The proxy.ts correctly implements the T-02-03 mitigation (getUser over getSession) as designed.

---

## Self-Check: PASSED

Files exist:
- src/app/proxy.ts: FOUND
- jest.config.ts: FOUND
- jest.setup.ts: FOUND
- __tests__/auth/signup.test.ts: FOUND
- __tests__/auth/login.test.ts: FOUND
- __tests__/auth/errors.test.ts: FOUND
- __tests__/auth/logout.test.ts: FOUND
- __tests__/auth/delete.test.ts: FOUND
- __tests__/auth/ratelimit.test.ts: FOUND
- __tests__/middleware.test.ts: FOUND
- __tests__/rls.test.ts: FOUND

Commits exist:
- 007e221: feat(02-01b): create proxy.ts — FOUND
- 6ab725e: feat(02-01b): install Jest harness — FOUND
