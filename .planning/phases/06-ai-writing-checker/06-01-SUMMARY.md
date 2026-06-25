---
phase: 06-ai-writing-checker
plan: 01
status: complete
completed_at: "2026-06-25"
---

# 06-01 Summary: Migration SQL + Env Slot + Wave 0 Test Scaffolds

**One-liner:** Foundation layer complete — writing_submissions migration SQL, ANTHROPIC_API_KEY env slot, and three Wave 0 failing test scaffolds all in place.

## What Was Built

**Task 1 — Migration SQL**
`supabase/migrations/20260624_phase6_writing.sql` — writing_submissions table with:
- uuid PK, user_id FK (auth.users cascade), sub_component_id FK (sub_components cascade), nullable feedback_text, created_at
- UNIQUE index (user_id, sub_component_id) — enforces D-12 one-shot model
- Rate-limit index (user_id, created_at) — supports daily COUNT query in API route
- RLS enabled, select/insert policies scoped to auth.uid()
- No UPDATE policy (rows immutable), no DELETE policy (cascade handles cleanup)

**Task 2 — ANTHROPIC_API_KEY slot**
`.env.local` line 12: `ANTHROPIC_API_KEY=` with comment pointing to console.anthropic.com. Empty — developer fills in real key before Plan 02 execution.

**Task 3 — Wave 0 test scaffolds**
- `src/__tests__/practice/schema.test.ts` — two new `it()` cases for `written` type appended (valid JSON → returns typed object; missing prompt → null)
- `src/__tests__/practice/WrittenCard.test.tsx` — new file, 6 test cases covering AI-01 (render/prompt) and AI-04 (fallback, 429, error, isCompleted restore)
- `src/__tests__/api/check-writing.test.ts` — new file, 3 test cases covering SEC-01 (401), AI-03 (429 rate limit), and 400 invalid body

## Verification

```
npx jest src/__tests__/practice/schema.test.ts src/__tests__/practice/WrittenCard.test.tsx src/__tests__/api/check-writing.test.ts --no-coverage
```

Result: 3 suites failed (expected RED), 12 existing schema tests passed, 1 new written-type test failed.
- schema.test.ts: import resolves, new written tests RED (type not in union yet)
- WrittenCard.test.tsx: import fails on '@/components/practice/WrittenCard' (Plan 03)
- check-writing.test.ts: import fails on '@anthropic-ai/sdk' (Plan 02 installs SDK)

All failures are import/resolution errors — no syntax errors. Existing 12 schema tests green.

## Decisions Made

- `feedback_text` is nullable — null means API error, row still written (D-06, Pitfall 5)
- No UPDATE policy on writing_submissions — immutable once written (D-12)
- `written` sub-components use `problem_type = NULL` — no phase5 check constraint change needed
- ANTHROPIC_API_KEY left blank — real key deferred until full launch (confirmed in session S162)

## Unblocks

- Plan 02: can read migration file for schema push; env slot ready for SDK install
- Plan 03: WrittenCard test scaffolds define the component contract
- Plan 02: check-writing test scaffolds define the API route contract
