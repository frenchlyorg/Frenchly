---
phase: 07-french-1-content
plan: 02
status: complete
completed: "2026-06-27"
---

# Plan 07-02 — Summary

## What Was Built

Appended Lessons 2–6 SQL to the Phase 7 migration file and applied it to the live Supabase database.

**Migration applied:** `supabase/migrations/20260625_phase7_french1_content.sql`

Changes per lesson:
- **Lesson 2 (definite-articles):** UPDATE pos-2 to MC; INSERT pos-4 fill-in; INSERT pos-5 writing; UPDATE title and estimated_minutes to 12
- **Lesson 3 (numbers-and-counting):** INSERT lesson + 4 sub-components (explainer, fill-in, matching, writing)
- **Lesson 4 (pronouns-and-etre):** INSERT lesson + 4 sub-components (explainer, conjugation-table, fill-in, writing)
- **Lesson 5 (indefinite-articles):** INSERT lesson + 4 sub-components (explainer, MC, fill-in, writing)
- **Lesson 6 (etre-adjectives):** INSERT lesson + 4 sub-components (explainer, fill-in, conjugation-single, writing)

## Verification

- `SELECT COUNT(*) FROM lessons JOIN levels WHERE slug='french-1'` → **6** ✓
- All 4 auto-graded problem types present: `mc`, `fill-in`, `matching`, `conjugation-table`, `conjugation-single`
- All 6 lessons have non-null content on every sub-component
- Migration idempotent: `ON CONFLICT (level_id, slug) DO NOTHING` on all lesson INSERTs

## Must-Haves Met

- [x] All 6 French 1 lessons exist in the DB with real content
- [x] All 4 auto-graded problem types appear across the 6 lessons
- [x] A student can open every lesson without hitting a null content error
- [x] Time estimates total 72 minutes (6 lessons × 12 min)

## Commits

- `13ebe84` — feat(07-02): append Lessons 2–6 SQL to French 1 content migration
- `a1b1d51` — fix(07-02): dollar-quote Lesson 5 MC content to fix SQL syntax error
- `205695f` — fix(07-02): rewrite migration as single $body$ block with idempotency
- `a2099b8` — fix(07-02): use composite (level_id, slug) for ON CONFLICT constraint
