# Phase 6: AI Writing Checker — Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver interactive open-ended writing submission for `kind='writing'` lesson sub-components. Students write in a textarea, click "Check my writing", and receive one concise line of feedback from Claude Haiku 4.5 via a server-side API route. Prompt caching, per-user rate limits (10/day via DB), and graceful fallback are all in place. Feedback is stored in the DB and shown on revisit.

**In scope:**
- `WrittenCard` component replacing the `kind='writing'` placeholder in SubComponentItem
- `WrittenProblem` type added to the `ProblemData` union + PracticeCardRouter case
- `/api/check-writing` route (server-side only, never exposes API key)
- Prompt caching for the grading system prompt
- `writing_submissions` DB table (rate limit tracking + feedback storage)
- Supabase RLS on the new table
- Graceful fallback on API failure

**Out of scope:**
- Writing lesson content (Phases 7–8)
- Billing alert setup — this is a manual Anthropic dashboard config (Phase 12 checklist, AI-05)
- UX polish — skeleton loaders, mobile layout refinements (Phase 9)
- Full security audit and test suite (Phase 10)

</domain>

<decisions>
## Implementation Decisions

### Writing card UX
- **D-01:** Textarea is **auto-resize** — starts small, expands as the student types. No fixed row count.
- **D-02:** **Live word count** displayed below the textarea. No hard cap enforced or displayed. Backend can enforce a max token input limit for cost control, but the student sees no cap.
- **D-03:** Submit button text: **"Check my writing"** (sentence case; matches the existing lesson card pattern).
- **D-04:** While awaiting the API response: **spinner on the button + textarea disabled**. No card overlay, no skeleton.

### Completion trigger
- **D-05:** Sub-component auto-completes **after feedback is shown** — API response arrives, feedback renders, then `markSubComponentComplete` is called. Student sees the result before progress is saved.
- **D-06:** On API failure: show fallback message **"We couldn't check that right now — keep going!"** and auto-complete the sub-component anyway. Lesson never blocks.
- **D-07:** On rate limit hit: show message **"You've used all your writing checks for today — come back tomorrow!"** and auto-complete the sub-component. Lesson never blocks.
- **D-08:** Completed state — textarea stays **readable but non-editable**; feedback line persists below it. Card does not collapse. Student can re-read their writing alongside the correction.

### Feedback persistence
- **D-09:** Feedback text is **stored in the DB** (writing_submissions table or a feedback column on sub_component_progress). On revisit to a completed writing sub-component, the stored feedback is loaded and displayed alongside the non-editable textarea.

### Rate limiting
- **D-10:** **10 AI writing checks per user per calendar day**. Window resets at midnight (UTC or user local — implementer's call; UTC simpler).
- **D-11:** Rate limit tracked via a **Supabase DB table** (e.g., `writing_submissions`). Count rows WHERE `user_id = X AND created_at > today`. Consistent with the existing RLS + server-action pattern. No new infrastructure.

### Re-submission
- **D-12:** **One-shot per sub-component** — student submits once, gets feedback, sub-component auto-completes. No edit-and-resubmit loop. Each submission consumes one rate-limit count.

### Claude's Discretion
- Exact schema: whether feedback lives in `writing_submissions` (separate table) or a column on `sub_component_progress` — either works; pick whichever is simpler.
- API route path: `src/app/api/check-writing/route.ts` is the obvious location.
- Grading system prompt wording — must be **static and identical every call** for prompt cache hits. No lesson-specific context in the system prompt.
- `max_tokens` cap for feedback: 60–100 tokens recommended (one line, Haiku-fast).
- `WrittenProblem` type fields — at minimum `{ type: 'written', prompt: string }`. Researcher may discover if additional fields help.
- Word count implementation (simple split on whitespace).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §AI Writing Checker — AI-01 (one-line feedback), AI-02 (prompt caching), AI-03 (rate limits), AI-04 (graceful fallback), AI-05 (billing alerts)
- `.planning/ROADMAP.md` §"Phase 6: AI Writing Checker" — goal + 6 success criteria (≤$0.001/check, cache hit > 0, rate-limit behavior)
- `.planning/PROJECT.md` — cost constraints ($0.0005/check target), solo build, school-device performance

### AI checker rules (MANDATORY)
- `CLAUDE.md` §AI Checker Rules — server-side only, one-line max (max_tokens), prompt caching for grading system prompt, graceful fallback, per-user rate limit before calling the API
- `CLAUDE.md` §Security Rules — no API keys in client code, RLS on every user-data table, parameterized queries only

### Existing practice component system (WrittenCard extends this)
- `src/lib/practice/types.ts` — ProblemData discriminated union; **add WrittenProblem here**
- `src/lib/practice/schema.ts` — ProblemDataSchema (Zod); **add WrittenProblem schema variant**
- `src/components/practice/PracticeCardRouter.tsx` — routes by type; **add 'written' case**
- `src/components/lessons/SubComponentItem.tsx:22` — `kind='writing'` already in the union; placeholder at line 190

### Server Action + Supabase patterns to mirror
- `src/app/lessons/actions.ts` — `markSubComponentComplete` Server Action (validate → auth server-side → DB write → revalidatePath); writing completion calls the same action
- `src/lib/supabase/server.ts` — server client factory; use for API route DB reads (rate limit count)
- `src/lib/supabase/admin.ts` — admin client; use for trusted writes if needed (or server client with RLS is fine for user-scoped inserts)

### Design
- `DESIGN.md` — color tokens, typography, spacing. Warm palette only. **Green (tertiary) is NOT used for AI feedback** — it is reserved for correct-answer states only (UX-10). Use a neutral or coral-toned feedback display.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `markSubComponentComplete(subComponentId)` — already wired; `WrittenCard` calls this after feedback renders (D-05)
- `src/lib/supabase/server.ts` `createClient()` — use inside the API route for authenticated DB reads/writes
- `src/components/diagnostic/FillInInput.tsx` — styled input with coral focus state; reference for styling the writing textarea
- `PracticeCardRouter` switch — add `case 'written': return <WrittenCard ... />` (TypeScript exhaustiveness enforced)

### Established Patterns
- **Server Action for completion.** Problem UI is a client component; progress save calls a Server Action. Same pattern as all 5 practice card types.
- **API key = server only.** `ANTHROPIC_API_KEY` lives in `.env.local` / Vercel env vars only. Never imported in client components.
- **RLS on every user-data table.** `writing_submissions` needs `CREATE POLICY` scoped to `auth.uid()`.
- **`getUser()` not `getSession()`** for auth checks in Server Actions and API routes.

### Integration Points
- `SubComponentItem.tsx` — `kind='writing'` renders as a title-only placeholder (line 190). This phase replaces the placeholder with `<PracticeCardRouter>` (which routes to `WrittenCard`) or a direct `<WrittenCard>` branch — researcher should confirm cleanest integration.
- New migration: `writing_submissions` table (user_id, sub_component_id, feedback_text, created_at) alongside existing migrations. RLS: users insert/select their own rows only.
- `PracticeCardRouter` — already imports 4 card components; add `WrittenCard` import and `'written'` case. TypeScript will enforce exhaustiveness.
- No `app/api` directory exists yet — create `src/app/api/check-writing/route.ts`.

</code_context>

<specifics>
## Specific Ideas

- **Fallback message (API error):** "We couldn't check that right now — keep going!" — student not blocked, lesson continues.
- **Rate limit message:** "You've used all your writing checks for today — come back tomorrow!" — friendly, not alarming.
- **Prompt caching key:** The grading system prompt must be **static and word-for-word identical** across every call to get cache hits. No per-lesson context injected. The student's writing goes in the user message only.
- **Cost guardrail:** max_tokens on Haiku responses: 60–100 tokens is sufficient for one feedback line and keeps per-call cost well under $0.001.

</specifics>

<deferred>
## Deferred Ideas

- **Billing alert (AI-05)** — manual Anthropic dashboard config, not code. Note for Phase 12 deployment checklist.
- **Retry circuit breaker** — v3 requirement (REQUIREMENTS.md). Not in Phase 6.
- **Teacher visibility into student writing submissions** — potential v2 feature; not in v1 scope.

</deferred>

---

*Phase: 06-ai-writing-checker*
*Context gathered: 2026-06-24*
