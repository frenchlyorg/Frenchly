# Phase 6: AI Writing Checker — Research

**Researched:** 2026-06-24
**Domain:** Anthropic SDK prompt caching, Next.js App Router API routes, Supabase RLS, React client component patterns
**Confidence:** HIGH

## Summary

Phase 6 adds one new component (`WrittenCard`), one new API route (`/api/check-writing`), one new DB table (`writing_submissions`), and small additions to the existing type/schema/router files. The entire implementation is a single-direction extension of the already-established Phase 5 patterns — no new architectural concepts are introduced.

The `@anthropic-ai/sdk` is not yet in `package.json` and must be installed. The SDK is published by Anthropic maintainers at `github.com/anthropics/anthropic-sdk-typescript`, has no postinstall script, and the current version (0.106.0) was published 2026-06-24. The `ANTHROPIC_API_KEY` env var slot is absent from `.env.local` — it must be added before the route can function.

A critical constraint for prompt caching with `claude-haiku-4-5`: the minimum cacheable prefix is **4,096 tokens**. A short grading system prompt will not receive cache hits. The system prompt must be padded to exceed this threshold, or the route must accept that caching does not apply and cost savings come only from `max_tokens` capping (60–100 tokens) and Haiku's low base rate. This is the single highest-risk technical assumption in the phase.

**Primary recommendation:** Implement WrittenCard as a peer practice card component, route it through PracticeCardRouter exactly as the Phase 5 cards, and keep the API route minimal — auth check, rate limit check, Anthropic call with system prompt marked `cache_control: { type: 'ephemeral' }`, DB write, return. Use `createClient()` (not `createAdminClient()`) in the route since users insert their own rows and RLS handles scoping.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Writing textarea + word count | Browser / Client | — | Interactive UI state — auto-resize, live word count, spinner |
| Submit + loading state | Browser / Client | — | Button disabled + spinner during fetch |
| AI feedback call | API / Backend | — | Server-side only per CLAUDE.md; API key never touches client |
| Rate limit enforcement | API / Backend | — | Count rows WHERE user_id AND created_at > today before calling AI |
| Feedback persistence (write) | API / Backend | Database | Insert into writing_submissions with feedback_text |
| Feedback persistence (read) | Database | API / Backend | Load stored feedback when isCompleted=true on mount |
| Sub-component completion | API / Backend | — | markSubComponentComplete Server Action — existing pattern |
| RLS isolation | Database | — | Policy scopes writing_submissions to auth.uid() |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.106.0 | Anthropic API client for Claude Haiku 4.5 | Official SDK from Anthropic; no beta header required for caching |
| `zod` | ^4.4.3 | Request body validation in the API route | Already in project; same schema-first pattern as practice types |
| `@supabase/ssr` | ^0.12.0 | Server Supabase client in the API route | Already in project; `createClient()` factory is the established pattern |

[VERIFIED: npm registry] `@anthropic-ai/sdk` version 0.106.0, published 2026-06-24. Repository: `github.com/anthropics/anthropic-sdk-typescript`. Maintainers include zak-anthropic, dylanc-anthropic, and other @anthropic.com accounts. No postinstall script.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next` (built-in) | 16.2.9 | `NextRequest`/`NextResponse` for route handler | App Router API route pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` | Raw `fetch` to `api.anthropic.com` | SDK handles retries, types, and stream parsing; no reason to use raw fetch here |
| DB rate limit | In-memory counter / Redis | DB approach is consistent with existing RLS pattern; no new infrastructure |

**Installation:**

```bash
npm install @anthropic-ai/sdk
```

**Version verification:**

```bash
npm view @anthropic-ai/sdk version
# 0.106.0 (verified 2026-06-24)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@anthropic-ai/sdk` | npm | 3+ years (scoped @anthropic-ai) | High (official SDK) | github.com/anthropics/anthropic-sdk-typescript | [ASSUMED — slopcheck unavailable] | Approved — official Anthropic maintainers, no postinstall, verified on npmjs.com |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time (auto-mode restriction). `@anthropic-ai/sdk` is tagged `[ASSUMED]` for the legitimacy check only. The package is verified on npm with Anthropic company maintainers and the official GitHub repository. Planner should include a `checkpoint:human-verify` before the install task as a procedural gate, but confidence in package legitimacy is HIGH.*

## Architecture Patterns

### System Architecture Diagram

```
[WrittenCard — Client Component]
        |
        | fetch POST /api/check-writing
        |   body: { subComponentId, text }
        v
[/api/check-writing — Next.js Route Handler]
        |
        |-- getUser() via createClient()    ──> Supabase Auth (server)
        |   redirect /login if unauthenticated
        |
        |-- COUNT writing_submissions       ──> Supabase DB
        |   WHERE user_id = X AND created_at > today
        |   → 429 JSON if >= 10
        |
        |-- sanitize + token-cap input
        |
        |-- client.messages.create()        ──> Anthropic API (claude-haiku-4-5)
        |   system: [{ type, text, cache_control: { type: 'ephemeral' } }]
        |   messages: [{ role: 'user', content: studentText }]
        |   max_tokens: 80
        |
        |-- INSERT writing_submissions      ──> Supabase DB
        |   { user_id, sub_component_id, feedback_text, created_at }
        |
        └── return { feedback: string }
        
[WrittenCard — Client Component]
        |
        | receives { feedback }
        |-- setState(feedback)
        |-- markSubComponentComplete(id)    ──> Server Action
        |-- render feedback display
```

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       └── check-writing/
│           └── route.ts          # New: POST handler
├── components/
│   └── practice/
│       ├── WrittenCard.tsx       # New: writing submission card
│       ├── PracticeCardRouter.tsx  # Modified: add 'written' case
│       └── [existing cards]
├── lib/
│   └── practice/
│       ├── types.ts              # Modified: add WrittenProblem
│       └── schema.ts             # Modified: add WrittenProblem schema
└── supabase/
    └── migrations/
        └── 20260624_phase6_writing.sql  # New: writing_submissions table + RLS
```

### Pattern 1: WrittenProblem type addition

**What:** Add `WrittenProblem` to the `ProblemData` discriminated union in `types.ts`.
**When to use:** Any sub-component with `type: 'written'` in its JSON content.

```typescript
// src/lib/practice/types.ts — add alongside existing types
export type WrittenProblem = {
  type: 'written'
  prompt: string   // The writing task instruction shown to the student
}

// Update union:
export type ProblemData =
  | MCProblem
  | FillInProblem
  | ConjugationTableProblem
  | ConjugationSingleProblem
  | MatchingProblem
  | WrittenProblem   // add this
```

### Pattern 2: Zod schema addition

**What:** Add `WrittenProblem` schema variant to `ProblemDataSchema` in `schema.ts`.

```typescript
// src/lib/practice/schema.ts
const WrittenSchema = z.object({
  type: z.literal('written'),
  prompt: z.string(),
})

export const ProblemDataSchema = z.discriminatedUnion('type', [
  MCSchema,
  FillInSchema,
  ConjTableSchema,
  ConjSingleSchema,
  MatchingSchema,
  WrittenSchema,   // add this
])
```

### Pattern 3: PracticeCardRouter addition

**What:** Add `'written'` case to the switch in `PracticeCardRouter.tsx`.

```typescript
// src/components/practice/PracticeCardRouter.tsx
import WrittenCard from '@/components/practice/WrittenCard'

// Inside switch:
case 'written':
  return (
    <WrittenCard
      problem={problemData}
      subComponentId={subComponentId}
      isCompleted={isCompleted}
      onComplete={onComplete}
    />
  )
```

TypeScript exhaustiveness is automatically enforced once `WrittenProblem` is added to the union — the `default: return null` branch becomes unreachable.

### Pattern 4: Anthropic SDK — prompt caching API shape

**What:** The system prompt must be passed as a `ContentBlockParam[]` array with `cache_control` on the text block. The top-level `system` field accepts either a `string` or this array form.

```typescript
// Source: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
// SDK version: @anthropic-ai/sdk 0.106.0 — no beta header required
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GRADING_SYSTEM_PROMPT = `...` // Must be static and word-for-word identical every call

const response = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 80,
  system: [
    {
      type: 'text',
      text: GRADING_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    {
      role: 'user',
      content: studentText,   // Only the student's writing goes here
    },
  ],
})

const feedback = response.content[0].type === 'text' ? response.content[0].text : ''
// Cache hit detection:
// response.usage.cache_read_input_tokens > 0  → cache hit
// response.usage.cache_creation_input_tokens > 0 → cache write (first call)
```

**CRITICAL CONSTRAINT — 4,096 token minimum for Haiku caching:** `claude-haiku-4-5` requires the cached prefix to exceed 4,096 tokens before any cache hit occurs. If the grading system prompt is shorter than ~3,000 words, `cache_creation_input_tokens` returns 0 and every call pays full input price. [CITED: startdebugging.net/2026/04/how-to-add-prompt-caching, verified against Anthropic docs structure]

**Implication for this phase:** The grading system prompt must either be padded to 4,096+ tokens (e.g., include example French sentences and grading rubric prose) OR the phase must acknowledge that AI-02 (prompt caching) cannot reduce per-call costs at the Haiku minimum threshold and the savings come from `max_tokens: 80` only. This is an open question that must be resolved before planning.

### Pattern 5: Next.js App Router API route — POST handler

**What:** Route handler at `src/app/api/check-writing/route.ts`. The `src/app/api/` directory does not yet exist — create it.

```typescript
// src/app/api/check-writing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse + validate body
  // 3. Rate limit check (COUNT rows in writing_submissions)
  // 4. Anthropic call
  // 5. DB insert
  // 6. Return feedback
}
```

### Pattern 6: SubComponentItem integration — cleanest path

Examining `SubComponentItem.tsx`: the `kind='writing'` branch currently falls through to the generic toggle button (not the practice spacer) and renders the `content` block below (because `content && kind !== 'practice'` — writing is not excluded). The cleanest integration is to add a `kind === 'writing'` branch parallel to `kind === 'practice'`, treating it identically: non-interactive spacer + PracticeCardRouter below the title row.

This requires:
1. Pass `problemData` for writing sub-components (same as practice — the parent `LessonPage` already passes this prop for `kind='practice'`)
2. Add a `kind === 'writing'` block below the practice block in SubComponentItem
3. The writing block renders `<PracticeCardRouter>` which routes to `WrittenCard`

The action label should read `'In progress'` / `'Done'` matching the practice pattern (not `'Mark complete'`).

### Pattern 7: DB migration — writing_submissions table

Mirror the `sub_component_progress` RLS pattern from Phase 3:

```sql
-- supabase/migrations/20260624_phase6_writing.sql

create table public.writing_submissions (
  id                 uuid        not null primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users on delete cascade,
  sub_component_id   uuid        not null references public.sub_components on delete cascade,
  feedback_text      text,                    -- null if rate-limited or API error (graceful fallback)
  created_at         timestamptz not null default now()
);

-- One submission per student per sub-component (D-12: one-shot)
create unique index idx_ws_user_sub on public.writing_submissions (user_id, sub_component_id);

-- Rate limit index: fast COUNT WHERE user_id AND created_at > date
create index idx_ws_user_created on public.writing_submissions (user_id, created_at);

grant select, insert on public.writing_submissions to authenticated;
grant all on public.writing_submissions to service_role;

alter table public.writing_submissions enable row level security;

create policy "Students can read own writing submissions"
  on public.writing_submissions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can insert own writing submissions"
  on public.writing_submissions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
```

**Note on schema choice (Claude's Discretion from CONTEXT.md):** A separate `writing_submissions` table is preferred over a feedback column on `sub_component_progress`. Reasons: (1) it carries metadata (created_at) needed for rate limiting, (2) it keeps `sub_component_progress` clean as a pure completion signal, (3) it allows future extension (teacher views, audit). The one-shot constraint (D-12) is enforced by the unique index on `(user_id, sub_component_id)`.

### Pattern 8: Feedback display — color constraint

DESIGN.md and CLAUDE.md rule 3 explicitly prohibit using green (tertiary color) for AI feedback. AI feedback is not a "correct answer" — it is informational commentary. Use a warm neutral tonal surface for the feedback box:

```tsx
// Feedback display — warm neutral, NOT tertiary/green
<div className="mt-4 rounded-lg bg-surface-container border border-outline-variant px-4 py-3">
  <p className="font-body text-[16px] text-on-surface">{feedback}</p>
</div>
```

### Anti-Patterns to Avoid

- **Injecting lesson-specific context into the system prompt:** Cache hits require byte-for-byte identical system prompts every call. Any per-lesson or per-student variation in the system prompt breaks caching. Student text goes in the user message only.
- **Using `createAdminClient()` in the API route:** The admin client bypasses RLS. Use `createClient()` (cookie-authenticated) so RLS policies enforce user isolation on both the rate limit query and the insert.
- **Calling `getSession()` for auth in the route:** Use `getUser()` per the established pattern in `actions.ts`. `getSession()` does not re-validate with the server.
- **Accepting `user_id` from the client request body:** Never. Derive it server-side from `getUser()`. Matches the security contract in `actions.ts`.
- **Using green/tertiary for feedback:** DESIGN.md and CLAUDE.md rule 3. Feedback is informational, not a correctness signal.
- **Adding per-lesson context to system prompt:** Breaks caching. Prompt must be static.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI API client | Custom fetch wrapper | `@anthropic-ai/sdk` | Handles retries, timeouts, streaming, type inference |
| Input validation | Manual string checks | `zod` (already installed) | Consistent with existing schema pattern; covers edge cases |
| Auth in API route | JWT parsing | `supabase.auth.getUser()` | Established pattern from `actions.ts`; server-validates token |
| Rate limit counting | In-memory Map | Supabase DB COUNT query | Survives restarts; consistent across serverless replicas |

**Key insight:** The entire Phase 5 infrastructure (types, schema, router, Server Action) exists precisely to be extended — WrittenCard is the 6th card type, not a new system.

## Common Pitfalls

### Pitfall 1: Haiku 4,096-token caching threshold

**What goes wrong:** System prompt is < 4,096 tokens. Every call returns `cache_creation_input_tokens: 0`. AI-02 requirement (prompt caching) is technically satisfied in code (the `cache_control` field is present) but produces zero cost reduction.

**Why it happens:** claude-haiku-4-5 has a higher minimum token threshold than other models. A compact grading prompt (200–500 tokens) does not meet it.

**How to avoid:** Write a rich grading system prompt that includes grading criteria, examples of good/bad feedback, French grammar context, and persona — padding it past 4,096 tokens. The cache TTL is 5 minutes (default) or 1 hour (`{ type: 'ephemeral', ttl: '1h' }`); use 1-hour TTL for a single-server environment.

**Warning signs:** `response.usage.cache_creation_input_tokens === 0` on the first call after a cold start.

### Pitfall 2: System prompt byte-for-byte identity

**What goes wrong:** Two code paths produce slightly different system prompt strings (trailing whitespace, newline difference, template literal vs string literal). Caching never hits.

**Why it happens:** Cache key is the exact byte content of the cached prefix. Any change — even a trailing space — forces a cache miss.

**How to avoid:** Export `GRADING_SYSTEM_PROMPT` as a module-level `const` string. Never construct it dynamically. No template literals with variable content.

**Warning signs:** `cache_creation_input_tokens > 0` on every call (should only be > 0 on cold start; should be `cache_read_input_tokens > 0` after that).

### Pitfall 3: Rate limit window — UTC vs local

**What goes wrong:** Rate limit query uses `created_at > NOW() - INTERVAL '24 hours'` (rolling window) when D-10 specifies calendar-day reset (midnight UTC). Students could get < 10 checks if they use some early in the UTC day and the 24h window hasn't expired.

**How to avoid:** Use `created_at >= date_trunc('day', now() at time zone 'UTC')` for midnight-UTC calendar-day semantics. Document the UTC choice in the API route comment.

### Pitfall 4: WrittenCard feedback persistence on revisit

**What goes wrong:** `isCompleted=true` on mount but no `storedFeedback` prop — card renders the disabled textarea but no feedback text below it (D-08, D-09).

**Why it happens:** The lesson page Server Component loads `sub_component_progress` but does not load `writing_submissions` feedback text.

**How to avoid:** The lesson page query must JOIN or separately fetch `writing_submissions.feedback_text` for the current user when rendering writing sub-components. Pass `initialFeedback?: string | null` as a prop to `WrittenCard`. If `isCompleted && initialFeedback`, display the feedback on mount.

### Pitfall 5: Graceful fallback still inserts a row

**What goes wrong:** API error triggers fallback message, `markSubComponentComplete` is called (D-06), but no row is written to `writing_submissions` — rate limit count is unaffected but no feedback stored. On revisit, card renders as completed with no feedback.

**How to avoid:** On API error, still INSERT a row with `feedback_text = null`. The unique index on `(user_id, sub_component_id)` prevents duplicates if the route is retried.

### Pitfall 6: `src/app/api/` directory does not exist

**What goes wrong:** Attempting to create `src/app/api/check-writing/route.ts` without first creating `src/app/api/`. Git and filesystem are fine with deep directory creation, but planner tasks should explicitly create the directory.

**How to avoid:** Wave 0 task creates `src/app/api/check-writing/` directory structure before any file writes.

### Pitfall 7: SubComponentItem writing branch missing

**What goes wrong:** `kind='writing'` sub-components show the manual toggle button (not the auto-complete spacer) and the `content` markdown block renders below (because `content && kind !== 'practice'` — writing is not in the exclusion). Student can manually mark it complete without interacting with WrittenCard.

**How to avoid:** Add a `kind === 'writing'` exclusion to the content block condition, mirror the practice spacer for the toggle, and render `<PracticeCardRouter>` in a `kind === 'writing'` panel — exactly like the `kind === 'practice'` branch.

### Pitfall 8: ANTHROPIC_API_KEY missing from .env.local

**What goes wrong:** `.env.local` has no `ANTHROPIC_API_KEY` key. The route crashes with an env var undefined error on the first request.

**How to avoid:** Wave 0 task adds `ANTHROPIC_API_KEY=` slot to `.env.local` and documents where to get it. Vercel env vars must also be set before any deployment.

## Code Examples

### Rate limit query (parameterized, no raw SQL string building)

```typescript
// Inside the API route, after auth
const today = new Date()
today.setUTCHours(0, 0, 0, 0)

const { count, error: countError } = await supabase
  .from('writing_submissions')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', today.toISOString())

if (countError) {
  // Fail open: if we can't read the count, allow the call
  console.error('Rate limit query failed', countError)
} else if ((count ?? 0) >= 10) {
  return NextResponse.json(
    { error: 'rate_limited', message: "You've used all your writing checks for today — come back tomorrow!" },
    { status: 429 }
  )
}
```

### Full API route skeleton

```typescript
// src/app/api/check-writing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const RequestSchema = z.object({
  subComponentId: z.string().uuid(),
  text: z.string().min(1).max(4000),  // cost-control cap on input tokens
})

// Module-level const — byte-for-byte identical every call (caching requires this)
const GRADING_SYSTEM_PROMPT = `You are a French language tutor grading a student's open-ended writing exercise. ...`
// Must exceed 4,096 tokens to qualify for claude-haiku-4-5 prompt caching.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate body
  const body = await request.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { subComponentId, text } = parsed.data

  // 3. Rate limit
  const today = new Date(); today.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('writing_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // 4. AI call
  let feedbackText: string | null = null
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 80,
      system: [{ type: 'text', text: GRADING_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: text }],
    })
    feedbackText = response.content[0]?.type === 'text' ? response.content[0].text : null
  } catch (err) {
    console.error('Anthropic API error', err)
    // Graceful fallback: feedbackText stays null
  }

  // 5. Persist (even on failure — null feedback, row still written for rate limit integrity)
  await supabase.from('writing_submissions').insert({
    user_id: user.id,
    sub_component_id: subComponentId,
    feedback_text: feedbackText,
    created_at: new Date().toISOString(),
  })

  // 6. Respond
  return NextResponse.json({
    feedback: feedbackText ?? "We couldn't check that right now — keep going!",
    rateLimited: false,
  })
}
```

### WrittenCard component shape

```tsx
'use client'

import { useCallback, useState } from 'react'
import { markSubComponentComplete } from '@/app/lessons/actions'
import type { WrittenProblem } from '@/lib/practice/types'

interface WrittenCardProps {
  problem: WrittenProblem
  subComponentId: string
  isCompleted: boolean
  initialFeedback?: string | null   // loaded from DB on revisit
  onComplete: (id: string) => void
}

export default function WrittenCard({
  problem,
  subComponentId,
  isCompleted,
  initialFeedback,
  onComplete,
}: WrittenCardProps) {
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(initialFeedback ?? null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  // Word count: simple whitespace split (D-02)
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || loading || done) return
    setLoading(true)
    try {
      const res = await fetch('/api/check-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subComponentId, text }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setFeedback("You've used all your writing checks for today — come back tomorrow!")
      } else {
        setFeedback(data.feedback ?? "We couldn't check that right now — keep going!")
      }
    } catch {
      setFeedback("We couldn't check that right now — keep going!")
    } finally {
      setLoading(false)
      setDone(true)
      onComplete(subComponentId)  // D-05: complete after feedback shown
      await markSubComponentComplete(subComponentId)
    }
  }, [text, loading, done, subComponentId, onComplete])

  // ... render
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Beta header `anthropic-beta: prompt-caching-2024-07-31` | No beta header needed; `cache_control` is GA | 2025 | Simplifies route code; no header to add |
| `system: string` only | `system: ContentBlockParam[]` for caching | SDK ~0.27 | Must pass array form to attach `cache_control` |
| `cache_control: { type: 'ephemeral' }` only | Optional `ttl: '1h'` for extended cache | Recent | 1-hour TTL useful for low-traffic apps to avoid cold-start misses |

**Deprecated/outdated:**

- `anthropic-beta` header for prompt caching: no longer required as of SDK 0.106.0. Do not include it.
- `getSession()` for server-side auth: use `getUser()` per established project pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | claude-haiku-4-5 requires 4,096 token minimum for cache hits | Standard Stack, Pitfall 1 | If threshold is lower, caching works with a compact prompt; if higher, no cache hits at any reasonable prompt size |
| A2 | `cache_control: { type: 'ephemeral' }` on the system prompt block in SDK 0.106.0 is the correct API shape (no beta header needed) | Code Examples | If shape changed, route throws a 400 from Anthropic; easy to fix but blocks testing |
| A3 | `ANTHROPIC_API_KEY` is the correct env var name for the SDK | Pitfall 8 | SDK reads this name by default; confirmed by Anthropic docs structure but not re-verified in this session |
| A4 | The lesson page currently loads `writing_submissions` data — or does not and must be extended | Pitfall 4 | If lesson page does not query this table, `initialFeedback` is always null and completed writing cards show no feedback on revisit |

**A4 is the most consequential unknown** — the lesson page Server Component query must be inspected during planning or Wave 0 to determine if it must be extended.

## Open Questions

1. **Will the grading system prompt reach 4,096 tokens?**
   - What we know: Haiku requires 4,096 token minimum; a simple grading instruction is far shorter
   - What's unclear: Whether the product vision allows padding the prompt with rubric content and examples
   - Recommendation: Design a rich French grading system prompt as part of Wave 1. If it can't reach 4,096 tokens naturally, use extended `ttl: '1h'` cache and accept that AI-02 is satisfied in API shape but provides no cache-read savings at this volume level. Log `cache_creation_input_tokens` in the route for verification.

2. **Does the lesson page query need to be extended to load writing_submissions feedback?**
   - What we know: `LessonPage` loads `sub_component_progress`; it does not currently query `writing_submissions` (that table does not exist yet)
   - What's unclear: Whether the planner should add a feedback-fetch step to the lesson page query in the same phase
   - Recommendation: Yes — add to the lesson page query. Without it, Pitfall 4 occurs. This is a small addition to an existing Server Component query.

3. **Sub_components table check constraint for 'written' kind**
   - What we know: Phase 5 added a `problem_type` check constraint that lists `('mc', 'fill-in', 'conjugation-table', 'conjugation-single', 'matching')`
   - What's unclear: Whether `'written'` needs to be added to this constraint, or whether writing sub-components should use `problem_type = NULL` (since `kind='writing'` is the discriminant at the row level)
   - Recommendation: Writing sub-components should have `problem_type = NULL` (consistent with explainers). The `kind` column already discriminates writing rows. No migration change to the check constraint is needed — the existing `NULL OR IN (...)` structure allows it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@anthropic-ai/sdk` | AI checker route | Not installed | — | Must install; no fallback |
| `ANTHROPIC_API_KEY` env var | `@anthropic-ai/sdk` | Not in .env.local | — | Route cannot call Haiku without it |
| `src/app/api/` directory | Route handler | Does not exist | — | Must create in Wave 0 |
| Node.js / Next.js | Route handler | Available | Next 16.2.9 | — |
| Supabase client | Auth + DB in route | Available | @supabase/ssr ^0.12.0 | — |
| Jest | Unit tests | Available | ^29.7.0 | — |

**Missing dependencies with no fallback:**

- `@anthropic-ai/sdk` — must install before implementing the route
- `ANTHROPIC_API_KEY` — must be added to `.env.local` by the user; Wave 0 should create the slot and document the Anthropic console URL

**Missing dependencies with fallback:**

- `src/app/api/` directory — Wave 0 task creates it

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest + jest-environment-jsdom |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npx jest src/__tests__/practice/ --testPathPattern="writing" -x` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | WrittenProblem schema parses correctly | unit | `npx jest src/__tests__/practice/schema.test.ts -x` | Partial — schema.test.ts exists, needs 'written' case |
| AI-01 | WrittenCard renders prompt text | unit | `npx jest src/__tests__/practice/WrittenCard.test.tsx -x` | No — Wave 0 |
| AI-02 | Prompt caching shape in route | manual-only | — | API-level verification; check `cache_creation_input_tokens` in logs |
| AI-03 | Rate limit blocks at 10 submissions | unit | `npx jest src/__tests__/api/check-writing.test.ts -x` | No — Wave 0 |
| AI-04 | Fallback message shown on API error | unit | `npx jest src/__tests__/practice/WrittenCard.test.tsx -x` | No — Wave 0 |
| AI-05 | Billing alerts configured | manual-only | — | Anthropic console; not code |

### Sampling Rate

- **Per task commit:** `npx jest src/__tests__/practice/ -x`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/practice/WrittenCard.test.tsx` — covers AI-01 (render), AI-04 (fallback UI)
- [ ] `src/__tests__/api/check-writing.test.ts` — covers AI-03 (rate limit logic); note: full HTTP route testing requires mocking Supabase + Anthropic
- [ ] Add `'written'` test cases to existing `src/__tests__/practice/schema.test.ts`
- [ ] `ANTHROPIC_API_KEY=` slot in `.env.local`
- [ ] `src/app/api/check-writing/` directory creation

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `supabase.auth.getUser()` — never `getSession()` |
| V3 Session Management | no | Handled by Supabase SSR; no new session logic |
| V4 Access Control | yes | RLS on `writing_submissions` scoped to `auth.uid()` |
| V5 Input Validation | yes | Zod schema on request body; `text` length-capped at API route |
| V6 Cryptography | no | No new crypto; ANTHROPIC_API_KEY stays in server env only |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure in client bundle | Information Disclosure | `ANTHROPIC_API_KEY` in `.env.local` server-only; never imported in `'use client'` files |
| Cross-user rate limit bypass (different user_id) | Tampering | `user_id` derived server-side from `getUser()`; never accepted from client body |
| Cost amplification via high-volume requests | Denial of Service | Rate limit: 10/day/user enforced before Anthropic call |
| Prompt injection in student text | Tampering | System prompt is fixed + static; student text lands in user message only — model sees it as user turn, not instructions |
| Phantom rate limit escape (submitting after limit) | Tampering | Rate check occurs before Anthropic call in every request; no client-side bypass path |
| Raw SQL injection | Tampering | Supabase parameterized queries only; no raw SQL string building |

**CLAUDE.md enforcement note:** `ANTHROPIC_API_KEY` must never appear in any client component import. The API route file must be `src/app/api/check-writing/route.ts` — App Router guarantees this runs server-side only.

## Sources

### Primary (HIGH confidence)

- npm registry `@anthropic-ai/sdk` version 0.106.0 — package legitimacy, maintainers, repo URL
- Official Anthropic prompt caching docs (`docs.anthropic.com/en/docs/build-with-claude/prompt-caching`) — `cache_control` API shape, TypeScript example
- Project codebase (verified via Read tool): `types.ts`, `schema.ts`, `PracticeCardRouter.tsx`, `SubComponentItem.tsx`, `actions.ts`, `server.ts`, `admin.ts`, all migration files, `package.json`, `.env.local`

### Secondary (MEDIUM confidence)

- [startdebugging.net — How to Add Prompt Caching to an Anthropic SDK App](https://startdebugging.net/2026/04/how-to-add-prompt-caching-to-an-anthropic-sdk-app-and-measure-the-hit-rate/) — Published 2026-04-29; cross-verified minimum token threshold claim (4,096 for Haiku 4.5) against the Anthropic docs page structure
- WebSearch result summary — `cache_control: { type: 'ephemeral' }` shape confirmed across multiple sources

### Tertiary (LOW confidence)

- A1–A4 in Assumptions Log — based on training knowledge and partial doc verification; flag for validation during planning

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — `@anthropic-ai/sdk` 0.106.0 confirmed on npm registry; all other packages already in project
- Architecture: HIGH — directly extends verified Phase 5 patterns; all integration points inspected in codebase
- Anthropic SDK cache_control API shape: HIGH — confirmed from official docs page
- Haiku 4,096-token minimum: MEDIUM — confirmed in secondary source (startdebugging.net, April 2026); consistent with search results; flagged as A1
- Pitfalls: HIGH — derived from code inspection + documented SDK behavior

**Research date:** 2026-06-24
**Valid until:** 2026-07-24 (Anthropic SDK moves fast; verify `@anthropic-ai/sdk` latest before installing)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Textarea is auto-resize — starts small, expands as the student types. No fixed row count.
- **D-02:** Live word count displayed below the textarea. No hard cap enforced or displayed. Backend can enforce a max token input limit for cost control, but the student sees no cap.
- **D-03:** Submit button text: "Check my writing" (sentence case).
- **D-04:** While awaiting the API response: spinner on the button + textarea disabled. No card overlay, no skeleton.
- **D-05:** Sub-component auto-completes after feedback is shown — API response arrives, feedback renders, then `markSubComponentComplete` is called.
- **D-06:** On API failure: show fallback message "We couldn't check that right now — keep going!" and auto-complete the sub-component anyway.
- **D-07:** On rate limit hit: show message "You've used all your writing checks for today — come back tomorrow!" and auto-complete the sub-component.
- **D-08:** Completed state — textarea stays readable but non-editable; feedback line persists below it. Card does not collapse.
- **D-09:** Feedback text is stored in the DB. On revisit to a completed writing sub-component, the stored feedback is loaded and displayed alongside the non-editable textarea.
- **D-10:** 10 AI writing checks per user per calendar day. Window resets at midnight UTC.
- **D-11:** Rate limit tracked via Supabase DB table. Count rows WHERE `user_id = X AND created_at > today`. No new infrastructure.
- **D-12:** One-shot per sub-component — student submits once, gets feedback, sub-component auto-completes. No edit-and-resubmit loop.

### Claude's Discretion

- Exact schema: whether feedback lives in `writing_submissions` (separate table) or a column on `sub_component_progress` — either works; pick whichever is simpler.
- API route path: `src/app/api/check-writing/route.ts` is the obvious location.
- Grading system prompt wording — must be static and identical every call for prompt cache hits. No lesson-specific context in the system prompt.
- `max_tokens` cap for feedback: 60–100 tokens recommended (one line, Haiku-fast).
- `WrittenProblem` type fields — at minimum `{ type: 'written', prompt: string }`.
- Word count implementation (simple split on whitespace).

### Deferred Ideas (OUT OF SCOPE)

- Billing alert (AI-05) — manual Anthropic dashboard config, not code. Note for Phase 12 deployment checklist.
- Retry circuit breaker — v3 requirement (REQUIREMENTS.md). Not in Phase 6.
- Teacher visibility into student writing submissions — potential v2 feature; not in v1 scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | Open-ended writing submissions receive one concise line of feedback via Claude Haiku 4.5 | WrittenCard + `/api/check-writing` route; `max_tokens: 80` enforces one-line cap; feedback stored in `writing_submissions.feedback_text` |
| AI-02 | Prompt caching used for grading instructions (reduces per-call cost ~90%) | `cache_control: { type: 'ephemeral' }` on system prompt block in `client.messages.create()`; critical: 4,096-token minimum for Haiku — system prompt must be substantive |
| AI-03 | Per-user rate limits enforced to prevent cost abuse | COUNT query on `writing_submissions` WHERE `user_id = X AND created_at >= today UTC` before Anthropic call; 429 response triggers client-side fallback message + auto-complete |
| AI-04 | If AI checker unavailable, lesson continues gracefully — no crash, clear message shown | try/catch around Anthropic call; fallback text "We couldn't check that right now — keep going!"; `markSubComponentComplete` always fires (D-06) |
| AI-05 | Billing alerts configured on Anthropic API account | Out of scope for code; manual Anthropic dashboard task — deferred to Phase 12 checklist |

</phase_requirements>
