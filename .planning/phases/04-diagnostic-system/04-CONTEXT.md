# Phase 4: Diagnostic System - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

The unlock mechanism. A first-time student takes a **placement diagnostic** (forced, before any lesson) and is placed at French 1 or French 2. After completing all lessons in a level, the student takes an **end-of-level diagnostic**; passing it unlocks the next level. Failing shows feedback, a weak-area review section, and a cooldown before retry.

Phase 4 builds the diagnostic **mechanism + minimal seed questions**, mirroring how Phase 3 shipped the lesson framework with minimal seed data. Real French content (questions/topics) lands in Phases 7–8; the full practice-problem engine lands in Phase 5.

**In scope:**
- `diagnostic_questions` content table (per-level pool, seeded MC + fill-in samples) with a question→lesson/topic tag.
- Diagnostic attempt model (in-progress + completed attempts, per-student, RLS-scoped) with resumable state.
- Placement diagnostic flow: forced first-run gate, scoring, French 1 vs French 2 placement.
- End-of-level diagnostic flow: availability gate (level lessons complete), scoring, pass→unlock, fail→feedback + review + cooldown.
- Generalize the lock model from a single `current_level_id` to an `unlocked_through` watermark; drive the existing locked-level UI from it.
- Minimal inline code-grader for MC + fill-in (no AI).

**Out of scope (other phases):**
- Full practice-problem engine — conjugation, matching, open-writing types → Phase 5 (PROB-03/04/05).
- AI writing checker → Phase 6.
- Real French 1 / French 2 lesson + diagnostic content → Phases 7–8 (this phase seeds samples only).
- Levels beyond French 2 (French 3–5, Culture, Above & Beyond) — out of v1.
</domain>

<decisions>
## Implementation Decisions

### Diagnostic content & format
- **D-D01:** Questions live in a **dedicated `diagnostic_questions` table** (NOT reused `sub_components`). Per-level. Clean separation from lesson content; easy to swap real content in later.
- **D-D02:** Question types = **MC + fill-in only**, code-graded (no AI). This intentionally **pulls forward** MC (PROB-01) and fill-in (PROB-02) grading from Phase 5 — Phase 4 ships its own **minimal inline grader** for these two types; Phase 5 later builds the full engine. ⚠ Overlap flagged for the planner.
- **D-D03:** Fill-in grading is **lenient** for correctness — case-insensitive, **accent-insensitive**, whitespace-trimmed → `café` == `cafe` == `Cafe` all count as **correct**. BUT when the normalized answer matches and the only difference is accents/diacritics (or minor spelling), surface a **soft inline note** ("Correct — watch the accents: café, not cafe"). Still scored as correct. *(Direct user instruction — see specifics.)*
- **D-D04:** Each level has a **question pool (~20 seed questions)**; each attempt **draws ~10**. Pool must exceed draw count so retries reshuffle/re-draw rather than repeat. Reduces pure memorization.
- **D-D05:** Each diagnostic question carries a **lesson/topic tag** so the fail-flow review section can point at exactly the lessons covering missed questions.

### Placement diagnostic
- **D-P01:** **Forced** before any lesson access for first-time students (matches success criterion 1). Reuses the existing locked-level UI as the gate.
- **D-P02:** **One-time — no retake.** All later movement happens via end-of-level diagnostics. Prevents gaming placement to jump levels.
- **D-P03:** ~10 questions drawn. **≥80% → French 2; below → French 1.** French 1 is the floor (every student lands at least at French 1).
- **D-P04:** Placed at French 2 ⇒ watermark unlocks levels **1 & 2**; current level = French 2. **French 1 stays accessible** (optional review) and its end-of-level diagnostic is **not required** (placement already cleared it). Consistent with Phase 3 "lower levels stay open."
- **D-P05:** Result screen shows the **placement level + a short encouraging message — NO raw percentage.** Aligns with the product's "honest motivation" value.

### End-of-level diagnostic
- **D-E01:** Becomes available **only after the student completes all lessons** (all sub-components) in the level.
- **D-E02:** **80% to pass** → unlocks the next level (advances the watermark). Same bar as placement — one mastery standard.
- **D-E03:** On **fail** → show score + a **weak-area review section** listing the specific lessons covering missed questions (via D-D05 tags) + a **3-hour per-level cooldown** before retry. User explicitly wanted **both** review section AND cooldown, not either/or.
- **D-E04:** Retry **re-draws/reshuffles** from the level pool (not the identical set).

### Diagnostic UX (shared)
- **D-U01:** **Soft timer** — display elapsed time only. Not enforced, not used in grading.
- **D-U02:** In-progress attempts are **persisted and resumable** — a started attempt keeps its drawn question set + saved answers; leaving and returning resumes the **same** attempt (no mid-attempt re-draw).
- **D-U03:** Cooldown shows a **live countdown** on the retry button ("available in 2h 14m"); **per-level** scope (other levels unaffected).

### Security / unlock model
- **D-S01:** All placement/unlock writes to `profiles` (current level + new watermark) go through **service-role / admin client only** — students cannot self-promote (carries Phase 3 threat T-03-01 guard). Scoring + the unlock decision happen **server-side** (Server Action / route), never trusting client-reported scores.
- **D-S02:** Generalize `deriveIsLevelLocked` ([src/lib/lessons/locking.ts](src/lib/lessons/locking.ts)) to an **`unlocked_through` watermark**: a level is locked when `levelNumber > unlockedThroughNumber`. Keep the signature stable (it already reserves `levelNumber`). Introduce the watermark field this phase. Do **not** hard-code a 2-level ceiling — the model must extend to future levels.

### Claude's Discretion
- Exact schema: table/column names, attempt + answer modeling, RLS policy specifics, migration structure.
- Watermark representation: new int `unlocked_through_level_number` on `profiles` vs a level_id pointer (int watermark likely simplest — implementer's call).
- Placement gate mechanics: middleware/interceptor on first login vs server-component guard before lessons/dashboard.
- Exact seed question content + topics (minimal sample only — enough to prove the mechanism, mirroring Phase 3 seed).
- Diagnostic UI layout within DESIGN.md tokens.
- How "missed/weak topics" are computed from tags for the review section.
- Weighting of MC vs fill-in toward the score (assume equal unless a reason emerges).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §Diagnostic & Adaptive System — DIAG-01 (placement), DIAG-02 (end-of-level gate), DIAG-03 (levels above earned level visibly locked)
- `.planning/ROADMAP.md` §"Phase 4: Diagnostic System" — goal + 5 success criteria; **Mode: mvp**
- `.planning/PROJECT.md` — product vision, "honest motivation" value, level universe (v1 ships French 1 & 2)

### Lesson / level model (Phase 3 — this phase gates it)
- `.planning/phases/03-lesson-framework/03-CONTEXT.md` — level/lock model (D-L04/05/06), binary completion, `current_level_id` placement default, "lower levels stay open"
- `src/lib/lessons/locking.ts` — `deriveIsLevelLocked`; **Phase 4 generalizes this to the `unlocked_through` watermark** (D-S02)
- `supabase/migrations/20260622_phase3_lessons.sql` — levels / lessons / sub_components / sub_component_progress schema, `profiles.current_level_id`, RLS patterns, `handle_new_user` trigger, and the **security guard: only `service_role` may set `current_level_id`** (extend to watermark)
- `src/app/levels/[levelSlug]/page.tsx`, `src/components/lessons/LevelCard.tsx`, `src/components/ui/LockBadge.tsx` — level page + lock UI to drive from the new watermark (no UI rewrite expected)
- `src/app/lessons/actions.ts` — Server Action pattern (`markSubComponentComplete`: validate → DB write) to mirror for diagnostic submit/grade/unlock

### Backend / security
- `.planning/phases/02-authentication-accounts/02-CONTEXT.md` — Supabase client factories (browser/server/admin), RLS conventions (students read/write only own rows)
- `CLAUDE.md` §Security Rules — RLS on every user-data table, parameterized queries only, input sanitization, no secrets client-side. **Note: diagnostics use NO AI — all code-graded.**

### Design
- `DESIGN.md` — colors/typography/spacing; lesson content max-width 720px, dashboard 1040px, warm palette per mode, **green = correct-answer feedback only**, guillemet « » = active marker, sentence-case copy
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/{client,server,admin}.ts` — three-tier factories; **admin/server client for unlock writes**, server client for scoring reads.
- `src/lib/lessons/locking.ts` — `deriveIsLevelLocked` already reserves the `levelNumber` arg specifically for this phase's watermark generalization.
- `src/app/lessons/actions.ts` — Server Action (validation + DB write) pattern to mirror for diagnostic grading + unlock.
- `src/app/levels/[levelSlug]/page.tsx` + `LevelCard` + `LockBadge` — locked/unlocked UI is already real; drive it from the new watermark with no UI rewrite.
- `src/app/dashboard/page.tsx` — async Server Component + `getUser()` defense-in-depth redirect; the placement gate likely extends this pattern.

### Established Patterns
- **RLS on every user-data table**, rows scoped to `auth.uid()`. New `diagnostic_attempts` (+ answers) are user data → MUST have RLS. `diagnostic_questions` is content → authenticated-read like `levels`/`lessons`.
- `getUser()` (not `getSession()`) for auth checks; secret key server-only, `NEXT_PUBLIC_*` client-only.
- `current_level_id` is writable by `service_role` only — **extend that exact guard to the watermark field.** Students never write their own unlock state; the server computes pass/fail and writes the unlock.

### Integration Points
- New migration sits alongside `20260622_phase3_lessons.sql`. Adds `diagnostic_questions`, `diagnostic_attempts` (+ answer rows), and an `unlocked_through` watermark on `profiles`.
- Lock UI (`LevelCard`/`LockBadge`) reads the watermark via the generalized `deriveIsLevelLocked`.
- Placement gate intercepts first-time users (default French 1 + no completed placement) before lessons/dashboard.
</code_context>

<specifics>
## Specific Ideas

- **Direct user instruction on fill-in grading:** "Be lenient but tell them that there was a slight error with accents and such." → grade as correct, but surface a gentle accent/minor-spelling note (D-D03).
- **Fail flow is BOTH/AND:** the user explicitly added a **3-hour cooldown AND a review section** — not either/or (D-E03).
- **Placement result avoids raw scores** — "honest motivation" framing: lead with the level + encouragement, no percentage (D-P05).
- **Soft timer, not a hard limit** — show elapsed time, don't penalize slow answers (D-U01).
</specifics>

<deferred>
## Deferred Ideas

- Full practice-problem engine (conjugation, matching, open-writing types) → Phase 5. Phase 4's grader handles only MC + fill-in.
- Real French 1 / French 2 diagnostic questions + topics → Phases 7–8. Phase 4 seeds minimal samples.
- Richer per-lesson scoring beyond the diagnostic itself — still out of v1 lesson flow (Phase 3 deferred); diagnostics introduce scoring only for the diagnostic.
- Levels beyond French 2 (French 3–5, Culture, Above & Beyond) — out of v1 content; the watermark model must NOT hard-code a 2-level ceiling.
</deferred>

---

*Phase: 4-Diagnostic System*
*Context gathered: 2026-06-22*
