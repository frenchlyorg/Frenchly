---
phase: 04-diagnostic-system
plan: 02
wave: 1
status: complete
requirements: [DIAG-01, DIAG-02, DIAG-03]
---

# 04-02 Summary — Diagnostic schema migration + RLS + seed (live)

## What was built

The full diagnostic data layer: three tables, RLS, the watermark column, the
concurrency-guard index, and seeded question pools — applied to the live
Supabase DB.

## Key files

- **created** `supabase/migrations/20260622_phase4_diagnostic.sql`
  - `diagnostic_questions` (content table + answer key), `diagnostic_attempts`
    (per-student), `diagnostic_answers` (per-question).
  - `profiles.unlocked_through_level_number` watermark column (check ≥ 1).
  - Partial unique index `idx_one_active_attempt` (one in_progress attempt per
    user/level/type — Pitfall 3).
  - ~14-question seed pool per level (French 1: greetings / definite-articles;
    French 2: passe-compose / vocabulary), mixing mc + fill_in with lesson tags.

## Security decisions

- **correct_answer is column-locked** (security-review fix): authenticated gets a
  column-scoped `SELECT` on the non-secret columns only; `correct_answer` is
  readable solely by `service_role`. Enforced by PostgreSQL/PostgREST column
  privileges — a raw client select of the answer key is rejected (not merely
  hidden by app discipline). [T-04-ID-01]
- **Watermark is service_role-write-only**: `unlocked_through_level_number` is NOT
  in the authenticated UPDATE grant — students cannot self-unlock. [T-04-EoP-01,
  carries Phase 3 T-03-01]
- **Cross-student isolation**: attempts scoped via `(select auth.uid()) = user_id`;
  answers scoped via `exists()` join to the parent attempt. [T-04-Tamp-02]
- **Concurrency**: partial unique index prevents duplicate in_progress attempts. [T-04-Tamp-01]

## Verification

- Migration applied to live Supabase DB (SQL editor: "Success. No rows returned").
  The seed `do` block executed without error, confirming both level slugs resolved
  and FK-constrained inserts succeeded.
- `npx jest` full suite green (105 passed, 3 skipped) — no schema-driven type regression.
- Static checks: 3 tables, watermark column, partial index, select+insert join
  policies, column-scoped grant all present; full-table authenticated grant removed.

## Commits

- `9b114c4` feat(04-02): add phase 4 diagnostic schema migration
- `e9caeb2` fix(04-02): protect correct_answer with column-scoped grant

## Self-Check: PASSED
