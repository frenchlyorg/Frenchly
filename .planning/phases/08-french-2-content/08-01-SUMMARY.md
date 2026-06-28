---
id: 08-01
phase: 8
title: French 2 Content — All 10 Lessons SQL Migration
status: COMPLETE
completed: 2026-06-28
---

# 08-01 Summary: French 2 Content Migration

## Outcome

All 10 French 2 lessons are seeded with real grammar content. French 2 is now completable end-to-end for students who have passed the French 1 diagnostic.

## What was done

**Task 1 — Migration authored**

File written: `supabase/migrations/20260628_phase8_french2_content.sql`

- Single `DO $body$ … $body$;` block wrapping the entire migration
- Guard at top: raises exception if `french-2` level is missing (Phase 3 prerequisite check)
- 11 DECLARE variables: `v_french2_id` + `v_lesson1_id` through `v_lesson10_id`
- 10 lesson INSERT blocks using `ON CONFLICT (level_id, slug) DO NOTHING RETURNING id INTO v_lessonN_id`
- 40 sub-component INSERTs inside `IF v_lessonN_id IS NOT NULL THEN` guards (idempotent by design)
- Dollar-quoting: `$body$` outer block, `$json$` for JSON content, `$txt$` for markdown explainers — no bare single-quoted strings with apostrophes or accented characters

**Task 2 — Migration applied**

Run manually in Supabase SQL Editor. Result: "Success. No rows returned." — no errors.

**Task 3 — UAT verification (all pass)**

| Query | Expected | Actual | Result |
|-------|----------|--------|--------|
| A: lesson COUNT for French 2 level | 10 | 10 | PASS |
| B: sub-component COUNT joined to those lessons | 40 | 40 | PASS |
| C: problem type distribution (all 5 types present) | mc, fill-in, conjugation-table, conjugation-single, matching | all present | PASS |
| D: writing sub-components with hints field | 10 | 10 | PASS |

## Lesson inventory

| # | Slug | Title | Pos 2 problem type | Pos 3 problem type |
|---|------|-------|--------------------|--------------------|
| 1 | er-verbs | Regular -ER verbs | conjugation-table (parler) | fill-in |
| 2 | ir-verbs | Regular -IR verbs | conjugation-table (finir) | fill-in |
| 3 | re-verbs | Regular -RE verbs | conjugation-table (vendre) | fill-in |
| 4 | negation | Negation: ne...pas | mc | fill-in |
| 5 | questions | Question formation | mc | fill-in |
| 6 | futur-proche | Futur proche: aller + infinitive | conjugation-single | fill-in |
| 7 | passe-compose-avoir | Passé composé with avoir | conjugation-table (manger, full PC forms) | fill-in |
| 8 | passe-compose-etre | Passé composé with être | matching (VANDERTRAMP pairs) | conjugation-single |
| 9 | object-pronouns | Direct object pronouns | mc | fill-in |
| 10 | adjective-placement | Adjective placement: BAGS rule | fill-in | matching (BAGS categories) |

## Problem type distribution (practice sub-components only)

| Problem type | Count |
|--------------|-------|
| fill-in | 9 |
| conjugation-table | 4 |
| mc | 3 |
| conjugation-single | 2 |
| matching | 2 |
| **Total** | **20** |

All 5 auto-graded problem type families are represented. Every lesson pos 4 is `kind='writing'` with a `hints` field containing 3 newline-separated French phrases.

## Acceptance criteria check

- [x] 10 rows in `public.lessons` with `level_id = 97600976-de70-45af-ab50-4aedd2852f3a`
- [x] 40 rows in `public.sub_components` joined to those lessons
- [x] All 5 auto-graded problem type families present (mc, fill-in, conjugation-table, conjugation-single, matching)
- [x] Every writing sub-component carries a `hints` field
- [x] Migration is idempotent — re-running produces no errors and no duplicate rows
- [x] Migration file exists at `supabase/migrations/20260628_phase8_french2_content.sql`
- [x] Single `DO $body$` block wraps the entire migration
- [x] Guard raises exception if `french-2` level is missing
- [x] `conjugation-table` blocks include all six pronoun keys (je, tu, il, nous, vous, ils)
- [x] `mc` blocks have 2–4 options and `correctAnswer` matches one option exactly
- [x] `matching` blocks have 2–6 pairs
- [x] No content JSON block is missing the `"type"` field

## Files modified

- `supabase/migrations/20260628_phase8_french2_content.sql` — created (French 2 content seed, 10 lessons × 4 sub-components)

## Phase 8 status

Phase 08-01 is the only planned work unit for Phase 8. Phase 8 is **COMPLETE**.
