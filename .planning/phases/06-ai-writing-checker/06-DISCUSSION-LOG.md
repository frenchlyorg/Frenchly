# Phase 6: AI Writing Checker — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-24
**Phase:** 06-ai-writing-checker
**Areas discussed:** Writing card UX, Completion trigger, Rate limit specifics, Re-submission

---

## Writing card UX

| Option | Description | Selected |
|--------|-------------|----------|
| Small (3–4 rows) | Compact, consistent with lesson card layout | |
| Medium (6–8 rows) | More room for full paragraph | |
| Auto-resize | Starts small, expands as student types | ✓ |

**User's choice:** Auto-resize textarea

---

| Option | Description | Selected |
|--------|-------------|----------|
| No limit shown | Clean UI, no arbitrary cap | |
| Show character count (0/500) | Familiar pattern, slight cognitive load | |
| Show word count | Natural for writing tasks | ✓ |

**User's choice:** Show live word count, no hard cap displayed (combined answer: "show word count and no limit shown")

---

| Option | Description | Selected |
|--------|-------------|----------|
| Check my writing | Consistent with existing "Check" pattern | ✓ |
| Submit | Generic | |
| Get feedback | Explicit about AI response | |

**User's choice:** "Check my writing"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner on button + textarea disabled | Simple loading state | ✓ |
| Skeleton below textarea | Placeholder where result will appear | |
| Full card loading overlay | Heavier but unmissable | |

**User's choice:** Spinner on button, textarea disabled

---

## Completion trigger

| Option | Description | Selected |
|--------|-------------|----------|
| After feedback is shown | API responds → feedback renders → auto-complete | ✓ |
| Immediately on submit | Before API responds | |
| Manual complete button after feedback | Extra step, student control | |

**User's choice:** Auto-complete after feedback is shown

---

| Option | Description | Selected |
|--------|-------------|----------|
| Textarea stays readable, feedback persists | Student reads writing + correction side by side | ✓ |
| Card collapses to feedback line | Compact, hides original writing | |
| Card collapses to title-only | Consistent with other completed sub-components | |

**User's choice:** Textarea stays readable (non-editable), feedback persists below

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show fallback message and auto-complete | Lesson never blocks, AI-04 requirement met | ✓ |
| Show error, let student retry | Transient errors handled but risk of student getting stuck | |
| Silent complete | No message shown | |

**User's choice:** Fallback message + auto-complete on API failure

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stored in DB, shown on revisit | Persistent across devices, student can re-read feedback | ✓ |
| Not stored, show placeholder on revisit | Simpler schema | |
| Not stored, textarea pre-filled | Original writing visible, no feedback | |

**User's choice:** Feedback stored in DB and shown on revisit

---

## Rate limit specifics

| Option | Description | Selected |
|--------|-------------|----------|
| 10 per day | ~$0.005/user/day max | ✓ |
| 5 per day | More conservative | |
| 20 per day | Generous, higher cost ceiling | |

**User's choice:** 10 checks per user per day

---

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase DB table | Persistent, consistent with existing patterns | ✓ |
| Upstash Redis / Vercel KV | Fast but new infrastructure | |
| In-memory (per-deployment) | Easiest but unreliable for production | |

**User's choice:** Supabase DB table

---

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly message + auto-complete | Never blocks lesson progress | ✓ |
| Friendly message + sub-component stays open | Student blocked today | |
| Friendly message + show reset countdown | More informative, adds countdown UI | |

**User's choice:** Friendly message + auto-complete at rate limit

---

## Re-submission

| Option | Description | Selected |
|--------|-------------|----------|
| One-shot per sub-component | Submit once → feedback → complete | ✓ |
| Edit and resubmit before completing | More educational, complex UI state | |
| Up to 3 re-submissions | Capped retries | |

**User's choice:** One-shot — no re-submission loop

---

## Claude's Discretion

- Exact DB schema (separate `writing_submissions` table vs feedback column on `sub_component_progress`)
- API route path (`src/app/api/check-writing/route.ts`)
- Grading system prompt wording (must be static for cache hits)
- `max_tokens` cap (60–100 tokens recommended)
- `WrittenProblem` type fields beyond `{ type: 'written', prompt: string }`
- Word count implementation
- Rate limit window timezone (UTC vs local)

## Deferred Ideas

- Billing alert (AI-05) — manual Anthropic dashboard config, note for Phase 12 checklist
- Teacher visibility into student writing submissions — potential v2 feature
- Retry circuit breaker — v3 requirement per REQUIREMENTS.md
