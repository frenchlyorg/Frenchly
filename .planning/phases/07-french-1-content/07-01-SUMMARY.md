---
phase: 07-french-1-content
plan: "01"
subsystem: content-migration
tags: [sql, migration, french-1, greetings, content]
dependency_graph:
  requires: [03-01, 05-01]
  provides: [07-02]
  affects: [public.sub_components]
tech_stack:
  added: []
  patterns: [dollar-quoting, UPDATE-by-title-and-lesson-id, DO-block-with-guard]
key_files:
  created:
    - supabase/migrations/20260625_phase7_french1_content.sql
  modified: []
decisions:
  - "Used $json$...$json$ dollar-quoting for content literals to avoid escaping apostrophes in French phrases"
  - "DO block resolves lesson ID by slug and raises NOTICE if not found (same guard pattern as Phase 5)"
  - "problem_type set to 'matching' on the practice sub-component; NULL preserved on the writing sub-component"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-06-27T17:14:48Z"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 7 Plan 01: Lesson 1 Greetings Content SQL Migration Summary

**One-liner:** Idempotent UPDATE SQL for Lesson 1 (Greetings) — matching problem (4 pairs) and written prompt with 3 French hints using dollar-quoted content literals.

---

## What Was Built

Created `supabase/migrations/20260625_phase7_french1_content.sql` — Wave 1 of the French 1 content migration. The file updates two previously-NULL sub-components on the Greetings lesson seeded in Phase 3:

1. **'Practice: match the greeting'** (position=2, kind=practice) — sets `problem_type='matching'` and `content` to a valid `MatchingProblem` JSON with 4 pairs (Bonjour, Salut, Bonsoir, Bonne nuit mapped to their English meanings/registers).

2. **'Write your own introduction'** (position=3, kind=writing) — sets `content` to a valid `WrittenProblem` JSON with a contextual introduction prompt and 3 newline-separated French hint phrases.

The file is safe to re-run (idempotent UPDATEs) and includes a RAISE NOTICE guard if the greetings lesson slug cannot be resolved.

---

## Verification

Node validation script output:
```
UPDATE present: true
Matching JSON present: true
Written JSON present: true
Dollar-quoting used: true
Greetings slug referenced: true
PASS
```

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 275df28 | feat(07-01): add Lesson 1 Greetings content SQL migration |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Checkpoint State

**Task 2** is a `checkpoint:human-verify` gate. Execution stopped here per plan design (D-02 sample review gate). Wave 2 (07-02-PLAN.md) is blocked until the user approves the Lesson 1 content format.

---

## Known Stubs

None — both updated sub-components now have real content. The explainer sub-component ('How French greetings work', position=1) was already seeded with real markdown in Phase 3 and is not touched by this migration.

---

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. Migration file contains only curriculum content (no secrets). T-07-01 mitigation applied: dollar-quoting + title+lesson_id scoped WHERE clause.

---

## Self-Check

- [x] `supabase/migrations/20260625_phase7_french1_content.sql` exists
- [x] Commit `275df28` exists in git log
- [x] Node validation script printed PASS for all 5 checks
