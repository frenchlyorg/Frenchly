---
phase: 06-ai-writing-checker
verified: 2026-06-26T20:45:00Z
status: human_needed
score: 9/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm Anthropic prompt caching is active on live API calls"
    expected: "First call logs cache_creation_input_tokens > 0; subsequent calls within 5 min log cache_read_input_tokens > 0"
    why_human: "Cannot verify Anthropic cache stats without a live API key and real API call — dev server required"
  - test: "Confirm cost per writing check is <= $0.001 (ROADMAP SC-6)"
    expected: "Anthropic usage dashboard shows per-call token cost within budget after a test submission"
    why_human: "Requires live Anthropic account access and a funded API key"
  - test: "Confirm AI-05 billing alert is configured on the Anthropic account (ROADMAP SC-5)"
    expected: "An email alert is triggered at a low billing threshold on the Anthropic console"
    why_human: "This is a manual Anthropic dashboard task — no code path to verify; deferred to Phase 12"
deferred: []
gaps: []
---

# Phase 6: AI Writing Checker Verification Report

**Phase Goal:** Students can submit open-ended French writing and receive one concise line of feedback via Claude Haiku 4.5. Prompt caching, per-user rate limits, and graceful fallback are all in place.
**Verified:** 2026-06-26T20:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | WrittenProblem type is in the ProblemData discriminated union | VERIFIED | `types.ts` exports `WrittenProblem = { type: 'written', prompt: string, hints?: string }` and `ProblemData` union includes `\| WrittenProblem` (line 57) |
| 2 | ProblemDataSchema parses `{ type: 'written', prompt: string }` without error | VERIFIED | `schema.ts` has `WrittenSchema` in `ProblemDataSchema discriminatedUnion`; all 13 schema tests pass including the 2 new `written` cases |
| 3 | POST /api/check-writing is authenticated — returns 401 with no session | VERIFIED | Route line 331-333: `getUser()` check returns `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` when no user; test `check-writing.test.ts` line 135 asserts 401 |
| 4 | POST /api/check-writing validates body with Zod — returns 400 on invalid input | VERIFIED | `RequestSchema = z.object({ subComponentId: z.string().uuid(), text: z.string().min(1).max(4000) })` at line 313; `safeParse` at line 344; 400 on failure; test asserts this |
| 5 | Per-user daily rate limit (10/day UTC) returns 200 + friendly message, does not crash | VERIFIED | Route lines 391-426: counts submissions since midnight UTC; at count >= 10 returns `{ feedback: "You've used all your writing checks for today — come back tomorrow!", rateLimited: true }` with status 200; Anthropic NOT called; test passes |
| 6 | Anthropic API error yields graceful fallback — lesson continues with "couldn't check" message | VERIFIED | Try/catch at lines 430-454: `catch (err)` sets `feedbackText = null`; return at line 476-478 sends `feedbackText ?? "We couldn't check that right now — keep going!"`; 06-02 test coverage confirmed |
| 7 | WrittenCard renders prompt, auto-resize textarea, word count, and submit button | VERIFIED | `WrittenCard.tsx` lines 106-178: prompt `<p>`, auto-resize via `textareaRef` and `scrollHeight`, word count display, button with spinner; 6 unit tests pass |
| 8 | Feedback persists on lesson revisit — WrittenCard shows stored feedback without a new fetch | VERIFIED | Lesson page Query 3 (lines 117-131) loads `writing_submissions` scoped to `user.id`; `feedbackMap` built; `initialFeedback` threaded through `SubComponentList` → `SubComponentItem` → `PracticeCardRouter` → `WrittenCard`; `WrittenCard` initializes `feedback` state from `initialFeedback ?? null` on mount |
| 9 | GRADING_SYSTEM_PROMPT is a module-level static const with `cache_control: { type: 'ephemeral' }` | VERIFIED | `GRADING_SYSTEM_PROMPT` declared at module scope (line 59); cache_control applied at line 436-438; 2 grep matches confirmed (`grep -c "cache_control" route.ts` → 2) |
| 10 | Prompt caching is active and cache hit ratio > 0 on repeat calls (ROADMAP SC-2) | HUMAN NEEDED | System prompt is >4096 tokens and correctly configured; cache stats logged in dev (`console.log('[check-writing] cache stats:', response.usage)`); cannot verify cache_read_input_tokens without live API key |
| 11 | Billing alert is configured on Anthropic account (AI-05 / ROADMAP SC-5, SC-6) | HUMAN NEEDED | AI-05 is marked `[ ]` (incomplete) in REQUIREMENTS.md; documented as Phase 12 checklist item in ROADMAP.md; no code path to verify |

**Score:** 9/11 truths verified (2 require human verification; 0 failed)

---

### Deferred Items

None — all identified gaps are human verification items, not deferred-to-later-phase items.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260624_phase6_writing.sql` | writing_submissions DDL, indexes, RLS | VERIFIED | File exists; contains `create table public.writing_submissions`, unique index `idx_ws_user_sub`, rate-limit index `idx_ws_user_created`, RLS policies |
| `src/lib/practice/types.ts` | WrittenProblem type + updated ProblemData union | VERIFIED | `WrittenProblem` exported; `ProblemData` union includes it at line 57 |
| `src/lib/practice/schema.ts` | WrittenSchema in discriminatedUnion | VERIFIED | `WrittenSchema` present; `parseProblemContent` parses `written` JSON |
| `src/app/api/check-writing/route.ts` | POST handler — auth, rate limit, Anthropic, DB write | VERIFIED | 481-line substantive implementation; all security contracts enforced |
| `src/components/practice/WrittenCard.tsx` | Client component — textarea, submit, feedback | VERIFIED | 188-line component; auto-resize, word count, spinner, 429-aware, initialFeedback revisit case |
| `src/components/practice/PracticeCardRouter.tsx` | 'written' case handled | VERIFIED | `case 'written':` at line 89; `WrittenCard` imported and rendered with all props |
| `src/components/lessons/SubComponentItem.tsx` | writing branch — spacer, label, panel | VERIFIED | `kind === 'writing'` appears 3×: spacer condition (line 63), label condition (line 186), writing panel (line 221) |
| `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` | Query 3 (writing_submissions) + feedbackMap + initialFeedback thread | VERIFIED | `writing_submissions` appears 2×; `feedbackMap` appears 3×; `initialFeedback` appears 2× in file |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `route.ts` | `writing_submissions` table | `supabase.from('writing_submissions').select/.upsert` | VERIFIED | Rate-limit count query at line 391; upsert at line 459 |
| `route.ts` | `anthropic.messages.create` | `GRADING_SYSTEM_PROMPT` module-level const + `cache_control` | VERIFIED | `getAnthropicClient().messages.create(...)` at line 431; `cache_control: { type: 'ephemeral' }` on system prompt block |
| `WrittenCard.tsx` | `/api/check-writing` | `fetch POST in handleSubmit` | VERIFIED | `fetch('/api/check-writing', { method: 'POST', ... })` at line 72 |
| `WrittenCard.tsx` | `markSubComponentComplete` (CR-04 fix) | `onComplete(subComponentId)` in finally → `SubComponentList.handleComplete` | VERIFIED | WrittenCard `finally` block calls only `onComplete(subComponentId)` (line 97); no direct `markSubComponentComplete` import; `SubComponentList.handleComplete` calls it at line 57 |
| `page.tsx` | `SubComponentList → SubComponentItem → PracticeCardRouter → WrittenCard` | `initialFeedback` prop thread from `feedbackMap[sc.id]` | VERIFIED | `feedbackMap` built at line 126; `initialFeedback: sc.kind === 'writing' ? (feedbackMap[sc.id] ?? null) : null` at line 136; SubComponentList passes `initialFeedback={sc.initialFeedback}` at line 121; SubComponentItem passes it to PracticeCardRouter at line 229; PracticeCardRouter passes it to WrittenCard at line 95 |
| `page.tsx` | `writing_submissions` | `supabase.from('writing_submissions').select(...)` | VERIFIED | Query 3 at lines 117-124; scoped `.eq('user_id', user.id)`; ordered by `created_at` descending |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `WrittenCard.tsx` | `feedback` (state) | `fetch('/api/check-writing')` POST → `data.feedback` | Yes — route queries Anthropic and stores in DB | FLOWING |
| `WrittenCard.tsx` | `feedback` (revisit) | `initialFeedback` prop from `feedbackMap[sc.id]` | Yes — built from real DB rows in `writing_submissions` | FLOWING |
| `page.tsx` | `feedbackMap` | `supabase.from('writing_submissions').select(...)` | Yes — parameterized query with `eq('user_id', user.id)` | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles without errors | `npx tsc --noEmit` | No output (zero errors) | PASS |
| Full test suite passes | `npx jest --no-coverage` | 18 suites, 156 passed, 3 skipped (unrelated Phase 2 RLS), 0 failed | PASS |
| `writing_submissions` appears in lesson page | `grep -c "writing_submissions" page.tsx` | 2 | PASS |
| `feedbackMap` appears in lesson page | `grep -c "feedbackMap" page.tsx` | 3 | PASS |
| `initialFeedback` appears in lesson page | `grep -c "initialFeedback" page.tsx` | 2 | PASS |
| `ANTHROPIC_API_KEY` not exposed in client code | `grep -r "ANTHROPIC_API_KEY" src/components src/app/dashboard src/app/levels` | No matches | PASS |
| `rateLimited` in route.ts | `grep -c "rateLimited" route.ts` | 2 | PASS |
| No green tokens in WrittenCard | `grep -c "text-tertiary\|bg-tertiary\|border-tertiary" WrittenCard.tsx` | 1 (in JSDoc comment: "NEVER text-tertiary...") | PASS — comment only, no class usage |
| `case 'written'` in PracticeCardRouter | `grep -c "case 'written'" PracticeCardRouter.tsx` | 1 | PASS |
| `kind === 'writing'` in SubComponentItem | `grep -c "kind === 'writing'" SubComponentItem.tsx` | 3 | PASS |
| `cache_control` in route.ts | `grep -c "cache_control" route.ts` | 2 | PASS |
| `WrittenProblem` in types.ts | `grep -c "WrittenProblem" types.ts` | 2 | PASS |
| No TBD/FIXME/XXX in phase 6 files | Anti-pattern scan across all 6 modified files | No matches | PASS |
| ANTHROPIC_API_KEY not NEXT_PUBLIC_ prefixed | `grep "NEXT_PUBLIC_ANTHROPIC" .env.local` | No match | PASS |

---

### Probe Execution

Step 7c: SKIPPED — no probe scripts declared in plans and no `scripts/*/tests/probe-*.sh` found.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AI-01 | 06-01, 06-02, 06-03, 06-04 | Open-ended writing submissions receive one concise line of feedback via Claude Haiku 4.5 | SATISFIED | Full data flow: WrittenCard → POST route → Anthropic Haiku 4.5 → feedback stored and returned; 156 tests pass |
| AI-02 | 06-02, 06-04 | Prompt caching used for grading instructions (reduces per-call cost ~90%) | SATISFIED (code) / HUMAN (live) | `cache_control: { type: 'ephemeral' }` on 4096+ token `GRADING_SYSTEM_PROMPT` at module scope; live cache hit ratio requires human check |
| AI-03 | 06-01, 06-02, 06-03, 06-04 | Per-user rate limits enforced to prevent cost abuse | SATISFIED | UTC midnight window, count >= 10 gate, burst guard (CR-02), test asserting 200+rateLimited:true; Anthropic not called when rate-limited |
| AI-04 | 06-01, 06-02, 06-03, 06-04 | If AI checker unavailable, lesson continues gracefully — no crash, clear message | SATISFIED | Try/catch in route returns fallback text; WrittenCard catch branch shows fallback; sub-component auto-completes regardless |
| AI-05 | 06-04 | Billing alerts configured on Anthropic API account | HUMAN NEEDED | REQUIREMENTS.md: `[ ] AI-05` (incomplete); documented in Phase 12 ROADMAP checklist; no code path |

---

### Security Checks

| Check | Status | Evidence |
|-------|--------|----------|
| API key never exposed to client | PASS | `ANTHROPIC_API_KEY` only in `process.env` server-side in `route.ts`; zero matches in `src/components`, `src/app/dashboard`, `src/app/levels`; no `NEXT_PUBLIC_` variant |
| `writing_submissions` query scoped to `user.id` with RLS | PASS | Route rate-limit query: `.eq('user_id', user.id)` at line 394; lesson page query: `.eq('user_id', user.id)` at line 120; migration RLS policy uses `(select auth.uid()) = user_id` |
| Input validated with Zod before reaching Anthropic | PASS | `RequestSchema.safeParse()` at line 344; `text.max(4000)` cap; validation before Anthropic call at line 431 |
| Rate limit enforced per user | PASS | Count query with `eq('user_id', user.id).gte('created_at', today.toISOString())` before Anthropic call; burst guard (CR-02) for double-tap; `count >= 10` gate |
| user_id never from request body (T-06-05) | PASS | `RequestSchema` has no `user_id` field; only `subComponentId` and `text`; `user.id` from `supabase.auth.getUser()` exclusively |
| Ownership check for sub_component_id (CR-01) | PASS | Route lines 357-364: `supabase.from('sub_components').select('id').eq('id', subComponentId).single()` with RLS — returns 404 if not accessible |
| No null audit row on rate limit (CR-03) | PASS | Route lines 403-426: rate-limit upsert stores friendly message string in `feedback_text`, not null; comment explicitly documents this fix |
| Single `markSubComponentComplete` call (CR-04) | PASS | `WrittenCard.tsx` comment at lines 91-94 documents fix; `finally` block only calls `onComplete(subComponentId)` — no direct `markSubComponentComplete` import or call |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | Anti-pattern scan across all 6 phase-modified files returned clean (no TBD, FIXME, XXX, placeholder copy, return null stubs, or hardcoded empty data arrays in render paths) |

---

### Human Verification Required

#### 1. Prompt Caching Active (AI-02 / ROADMAP SC-2)

**Test:** Start the dev server with a real `ANTHROPIC_API_KEY` in `.env.local`. Submit a writing exercise. Check the terminal for the log line `[check-writing] cache stats: { ... }`. Make a second submission within 5 minutes.

**Expected:** First call: `cache_creation_input_tokens > 0`. Second call: `cache_read_input_tokens > 0` (cache hit confirmed).

**Why human:** Requires a live Anthropic API key and a running dev server. Cannot verify Anthropic's server-side caching behavior programmatically from the codebase.

#### 2. Cost Per Check <= $0.001 (ROADMAP SC-6)

**Test:** After completing test calls with a real API key, check the Anthropic usage dashboard.

**Expected:** Cost per call to Haiku 4.5 with 80 max output tokens and prompt caching is at or below $0.001.

**Why human:** Requires live Anthropic account access and funded API key. Cost depends on cache hit ratio and actual token counts.

#### 3. Billing Alert Configured (AI-05 / ROADMAP SC-5)

**Test:** Log into the Anthropic Console at `console.anthropic.com/settings/billing`. Set a low-threshold spending alert.

**Expected:** An email alert is triggered when the threshold is reached.

**Why human:** This is a manual Anthropic dashboard task — no code to deploy or verify. Documented in Phase 12 ROADMAP checklist as the appropriate time to complete this.

---

### Gaps Summary

No blocking gaps. All code artifacts exist, are substantive, are wired, and data flows correctly through the full stack.

Three human verification items remain:
- **AI-02 live cache confirmation** — cannot verify without a funded API key
- **AI-05 billing alert** — manual dashboard task, correctly deferred to Phase 12
- **ROADMAP SC-6 cost per check** — operational verification, requires live usage data

The phase goal ("Students can submit open-ended French writing and receive one concise line of feedback via Claude Haiku 4.5. Prompt caching, per-user rate limits, and graceful fallback are all in place.") is **fully implemented in code**. The 3 human items are operational/live verification — the implementation that enables them is complete and correct.

---

**Notable deviation from plan contract:** The 06-02 PLAN specified the rate-limit path should return HTTP 200 with `{ feedback: "...", rateLimited: true }`. The PLAN also said "not 429 — the client handles the message; lessons must never block." The implementation matches this — rate-limit daily path returns 200. However, the burst guard (CR-02, a later code review fix) returns 429. WrittenCard checks `data.rateLimited` (not `res.status`), so the 200+rateLimited path is what triggers the friendly message. The 429 burst guard path is treated by WrittenCard as a generic error (falls into the catch block or is handled as a non-rateLimited response). This is consistent behavior — burst guard is a server-side dedup guard, not a user-facing rate limit message path. Tests confirm the expected 200+rateLimited:true contract for the daily rate limit.

---

_Verified: 2026-06-26T20:45:00Z_
_Verifier: Claude (gsd-verifier)_
