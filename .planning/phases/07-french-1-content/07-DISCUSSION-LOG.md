# Phase 7: French 1 Content — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-25
**Phase:** 7-French-1-Content
**Areas discussed:** Curriculum scope, Content authorship, Problem mix per lesson, Delivery method

---

## Curriculum Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 5–6 lessons | Completable unit, good pilot scope | ✓ |
| 8–10 lessons | Fuller semester feel, more content work | |
| 2–3 lessons | Just expand the 2 existing seeds | |

**User's choice:** 5–6 lessons (landed on exactly 6)

| Option | Description | Selected |
|--------|-------------|----------|
| Standard French 1 sequence | Greetings ✓, Definite articles ✓, Numbers, Pronouns+être, Indefinite articles, Être+adjectives | ✓ |
| User chooses topics | Custom curriculum list | |

**User's choice:** Standard French 1 sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Expand existing 2 lessons | Fill in null content via UPDATE, preserve progress rows | ✓ |
| Rebuild from scratch | Delete and reinsert everything | |

**User's choice:** Expand existing

| Option | Description | Selected |
|--------|-------------|----------|
| 3–4 sub-components per lesson | 1 explainer + 1–2 practice + 1 writing | ✓ |
| 5–6 sub-components per lesson | Richer practice, ~20–25 min | |
| Varies by topic | Decide per lesson | |

**User's choice:** 3–4 per lesson

---

## Content Authorship

| Option | Description | Selected |
|--------|-------------|----------|
| Claude generates everything | User reviews and approves | |
| User supplies content | Claude formats into JSON/SQL | |
| Collaborative | Claude drafts, user corrects | |

**User's choice (free text):** "I want you to generate things after we talk things out on how I want it to look after you give a sample I will tell you the general format/general roadmap of content"

**Notes:** Claude generates all content → sample review during planning → user approves format → Claude builds rest to that template

| Option | Description | Selected |
|--------|-------------|----------|
| During planning (before execution) | Planner generates sample lesson in plan doc | ✓ |
| At start of execution | First executor task generates sample, pauses | |

**User's choice:** During planning

| Option | Description | Selected |
|--------|-------------|----------|
| Short and direct | 3–5 sentence intro + table or bullets | ✓ |
| Longer prose | Narrative style with examples woven in | |
| Varies by topic | Tables for grammar, prose for context | |

**User's choice:** Short and direct

---

## Problem Mix Per Lesson

| Option | Description | Selected |
|--------|-------------|----------|
| Flexible — match type to topic | Best teaching fit per lesson | ✓ |
| Fixed set every lesson | 1 MC + 1 fill-in + 1 writing always | |
| CONTENT-03 minimum only | At least one of each across French 1 | |

**User's choice:** Flexible

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, every lesson has writing | AI checker differentiator | ✓ |
| Most lessons, not all | Skip where writing doesn't fit | |

**User's choice:** Writing in every lesson

---

## Delivery Method

| Option | Description | Selected |
|--------|-------------|----------|
| SQL migration file | Version-controlled, matches existing pattern | ✓ |
| Direct Supabase Table Editor | No code, not reproducible | |

**User's choice:** SQL migration file

| Option | Description | Selected |
|--------|-------------|----------|
| UPDATE by title match | Safe, idempotent, preserves progress rows | ✓ |
| Delete and reinsert sub-components | Cleaner but breaks progress rows | |

**User's choice:** UPDATE by title match

---

## Claude's Discretion

- Exact French sentences, MC options, fill-in blanks, matching pairs
- Time estimates per lesson (estimated_minutes)
- Exact writing prompts and hints wording (following approved sample template)
- Position values for new sub-components

## Deferred Ideas

None — discussion stayed within phase scope.
