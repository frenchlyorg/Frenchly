---
phase: 06-ai-writing-checker
plan: 02
subsystem: api
tags: [anthropic, claude-haiku, prompt-caching, rate-limiting, zod, supabase, jest, next-server]

# Dependency graph
requires:
  - phase: 06-01
    provides: writing_submissions table with RLS, @anthropic-ai/sdk installed, Wave 0 test scaffolds

provides:
  - WrittenProblem type exported from src/lib/practice/types.ts (ProblemData union member)
  - WrittenSchema in src/lib/practice/schema.ts (ProblemDataSchema discriminated union)
  - POST /api/check-writing route: auth, rate-limit, Anthropic Haiku call, DB upsert, graceful fallback
  - jest.setup.node-fetch-globals.ts: Web Fetch API (Request/Response) injected into jsdom for next/server tests

affects: [06-03-WrittenCard, 06-04-SubComponentItem-integration]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk (^0.106.0)", "cache_control: {type: ephemeral} on system prompt"]
  patterns:
    - "Lazy require() for module-level singletons that are mocked in tests (avoids TDZ)"
    - "Dynamic import() for server clients inside POST handlers (defers mock factory evaluation)"
    - "Prompt caching: 4096+ token static GRADING_SYSTEM_PROMPT at module scope"
    - "Rate limit returns 429 before Anthropic is called (cost guard)"
    - "upsert with ignoreDuplicates: true on (user_id, sub_component_id) for idempotency"

key-files:
  created:
    - src/app/api/check-writing/route.ts
    - jest.setup.node-fetch-globals.ts
  modified:
    - src/lib/practice/types.ts
    - src/lib/practice/schema.ts
    - jest.config.ts

key-decisions:
  - "Rate limit returns HTTP 429 with {error: 'rate_limited'} (not 200 with rateLimited:true) — matches Wave 0 test contract"
  - "Lazy require('@anthropic-ai/sdk') and dynamic import('@/lib/supabase/server') inside handlers to avoid jest TDZ in mock factories"
  - "jest.config.ts adds setupFiles pointing to jest.setup.node-fetch-globals.ts to inject Request/Response into jsdom (Node 24 native globals, stripped by jsdom)"
  - "GRADING_SYSTEM_PROMPT is a 4096+ token static const at module scope — identical every call for cache hits"
  - "Anthropic errors fallback to null feedbackText, return friendly message; lesson never blocks (AI-04, D-06)"

patterns-established:
  - "Pattern: Lazy singleton for mocked module-level dependencies (require inside getter function)"
  - "Pattern: Dynamic import inside Next.js route handler for supabase createClient (compatible with jest.mock)"
  - "Pattern: Web Fetch API globals injected via setupFiles for jsdom + next/server compatibility"

requirements-completed: [AI-01, AI-02, AI-03, AI-04]

# Metrics
duration: 65min
completed: 2026-06-25
---

# Phase 06 Plan 02: AI Writing Checker — Type System + API Route Summary

**WrittenProblem type added to discriminated union and POST /api/check-writing built with Haiku 4.5 prompt caching, UTC rate limiting (429), and graceful Anthropic fallback**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-06-25T19:57:00Z
- **Completed:** 2026-06-25T21:02:00Z
- **Tasks:** 2 (Tasks 2 and 3 — Task 1 was human-verified checkpoint)
- **Files modified:** 5 (types.ts, schema.ts, route.ts new, jest.config.ts, jest.setup.node-fetch-globals.ts new)

## Accomplishments

- Added `WrittenProblem` type (`{ type: 'written', prompt: string }`) to `ProblemData` discriminated union in types.ts; added `WrittenSchema` to `ProblemDataSchema` in schema.ts — all 13 schema tests green including 2 new 'written' cases
- Built `POST /api/check-writing` with full security contract: auth via `getUser()`, UTC midnight rate-limit count (returns 429 before Anthropic call), Anthropic Haiku 4.5 call with `cache_control: {type:'ephemeral'}` on 4096+ token system prompt, upsert with `ignoreDuplicates` for idempotency, graceful fallback on API failure
- Fixed jsdom test environment incompatibility with `next/server` by injecting Node 24 native `Request`/`Response` globals via `setupFiles` — all 3 check-writing tests (401, 400, 429) pass; full suite 150/153 passing

## Task Commits

1. **Task 2: WrittenProblem type and WrittenSchema** — `e189cb7` (feat)
2. **Task 3: POST /api/check-writing route** — `a072c7c` (feat)

**Plan metadata:** committed with SUMMARY

## Files Created/Modified

- `src/lib/practice/types.ts` — Added `WrittenProblem` type and union member
- `src/lib/practice/schema.ts` — Added `WrittenSchema` and discriminated union member
- `src/app/api/check-writing/route.ts` — Full POST handler: auth, rate-limit, Anthropic, DB upsert
- `jest.setup.node-fetch-globals.ts` — Injects Web Fetch API globals into jsdom via vm.runInThisContext
- `jest.config.ts` — Added `setupFiles` pointing to the globals injector

## Decisions Made

- **Rate limit response is 429, not 200**: The plan spec said return 200 with `rateLimited: true`, but the Wave 0 test scaffold asserts `expect(res.status).toBe(429)`. Test contract takes precedence — returned 429 with `{ error: 'rate_limited' }`.
- **Lazy module loading pattern for testability**: route.ts uses `require('@anthropic-ai/sdk')` inside a getter and `import('@/lib/supabase/server')` as a dynamic import inside the handler. This defers mock factory evaluation until after jest variable initialization, resolving the const TDZ issue without modifying the test file.
- **Web Fetch globals via setupFiles**: jsdom 30.x strips Node 24's native `Request`/`Response` from the global scope. `jest.setup.node-fetch-globals.ts` uses `vm.runInThisContext` to retrieve them from Node's V8 context and re-assign to `global` before tests run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rate limit response code changed from 200 to 429**
- **Found during:** Task 3 (test verification)
- **Issue:** Plan specified `return 200 with { feedback: "...", rateLimited: true }` but the Wave 0 test scaffold (`check-writing.test.ts` line 113) asserts `expect(res.status).toBe(429)` with `expect(body).toMatchObject({ error: 'rate_limited' })`. Returning 200 would fail the acceptance tests.
- **Fix:** Implemented 429 response with `{ error: 'rate_limited' }` to match the test contract.
- **Files modified:** `src/app/api/check-writing/route.ts`
- **Verification:** `returns 429 when DB count returns 10` test passes
- **Committed in:** `a072c7c`

**2. [Rule 3 - Blocking] Jest environment incompatibility with next/server globals**
- **Found during:** Task 3 (test execution)
- **Issue:** `jest-environment-jsdom` does not expose `Request`, `Response`, or `Headers` globals. `next/server` (NextRequest) extends the native `Request` class and throws `ReferenceError: Request is not defined` when imported in the test environment.
- **Fix:** Created `jest.setup.node-fetch-globals.ts` using `vm.runInThisContext` to retrieve Node 24's native Web Fetch globals and assign them to `global`. Added to `setupFiles` in `jest.config.ts`.
- **Files modified:** `jest.setup.node-fetch-globals.ts` (new), `jest.config.ts`
- **Verification:** All 3 check-writing tests run and pass.
- **Committed in:** `a072c7c`

**3. [Rule 3 - Blocking] Jest mock TDZ issue — lazy module loading pattern**
- **Found during:** Task 3 (test execution, after fixing globals)
- **Issue:** `jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn().mockResolvedValue(mockSupabaseClient) }))` references `mockSupabaseClient` (a `const`) inside the hoisted factory. When route.ts had a top-level `import { createClient }` and a top-level `const anthropic = new Anthropic(...)`, the mock factories ran at module-import time before `mockSupabaseClient` and `mockMessagesCreate` were initialized — hitting the const temporal dead zone.
- **Fix:** (a) Changed supabase import to `const { createClient } = await import('@/lib/supabase/server')` inside the POST handler. (b) Changed Anthropic instantiation to a lazy getter using `require('@anthropic-ai/sdk')` inside a module-scoped `getAnthropicClient()` function. Both changes defer mock factory evaluation until the first handler call, after all test-file variables are initialized.
- **Files modified:** `src/app/api/check-writing/route.ts`
- **Verification:** All 3 check-writing tests pass; full suite 150/153 (3 skipped WrittenCard Wave 0 — Plan 03 target).
- **Committed in:** `a072c7c`

---

**Total deviations:** 3 auto-fixed (1 Rule 1 spec-vs-test mismatch, 2 Rule 3 blocking environment issues)
**Impact on plan:** All three were necessary for tests to pass. The rate-limit response code difference is a clarification from the Wave 0 test contract (which is authoritative). The jest fixes are infrastructure changes that don't affect production behavior.

## Issues Encountered

- Explored four approaches to fix the jest environment problem before landing on the right combination: (1) node environment for API tests — broke jest.mock TDZ; (2) projects split — TypeScript config errors; (3) babel-jest with next/babel — broke signup tests with stricter babel-plugin-jest-hoist static analysis; (4) Final: ts-jest + Web Fetch globals injector + lazy module loading in route.ts — all tests pass.

## Known Stubs

None — route.ts is fully wired. The `WrittenCard` component (Plan 03) and its test file (`WrittenCard.test.tsx`) are Wave 0 scaffolds that will fail until Plan 03 ships.

## Threat Flags

No new threat surface beyond the plan's threat model. All T-06-04 through T-06-09 mitigations are implemented:
- T-06-04: `ANTHROPIC_API_KEY` accessed via `process.env` only, never in response
- T-06-05: `user_id` from `supabase.auth.getUser()` only
- T-06-06: Rate limit enforced before Anthropic call
- T-06-08: upsert with `ignoreDuplicates: true` on unique index
- T-06-09: `text.max(4000)` in Zod schema

## Next Phase Readiness

- Plan 03 (WrittenCard component) can import `WrittenProblem` from `@/lib/practice/types` and call `POST /api/check-writing`
- `WrittenCard.test.tsx` Wave 0 scaffold is in place and will turn green when `WrittenCard` component is created
- The rate-limit response format (429 + `{ error: 'rate_limited' }`) must be handled in WrittenCard's fetch error handler

---
*Phase: 06-ai-writing-checker*
*Completed: 2026-06-25*
