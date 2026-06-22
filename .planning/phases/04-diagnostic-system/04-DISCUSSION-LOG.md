# Phase 4: Diagnostic System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 4-Diagnostic System
**Areas discussed:** Diagnostic content & format, Placement logic, End-of-level pass bar & retry, Placement gate UX, Question pool, Review mapping, Placement-up semantics, Result screen, Timing, Resume, Cooldown

---

## Diagnostic content & format

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple-choice only | MC fully code-gradable, simplest mechanism proof | |
| Mixed types (MC + fill-in) | More test-like; pulls forward fill-in grading from Phase 5 | ✓ |
| Reuse Phase 5 engine | Wait/depend on Phase 5 — creates a backward dependency | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated diagnostic table | New `diagnostic_questions` table, clean separation | ✓ |
| Reuse sub_components | Tag lesson sub_components — mixes content + assessment | |

**User's choice:** Mixed types (MC + fill-in); dedicated diagnostic table.
**Notes:** Accepted that fill-in grading overlaps Phase 5 PROB-02 — Phase 4 ships a minimal inline grader. Flagged for planner.

### Fill-in grading strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Case-insensitive, accent-required | Require correct accents; pedagogically honest | |
| Lenient (accent-insensitive too) | Accept missing/wrong accents | (see notes) |
| Accept-list per question | Multiple acceptable answers authored per blank | |

**User's choice (free text):** "Be lenient but tell them that there was a slight error with accents and such."
**Notes:** Grade leniently (accent/case-insensitive) → counts as correct, but show a soft inline note when accents/minor spelling were the only difference. Drives D-D03.

---

## Placement logic

| Option | Description | Selected |
|--------|-------------|----------|
| 80% or higher → French 2 | Conservative mastery bar | ✓ |
| 90% or higher | Stricter; only near-perfect skips French 1 | |
| 70% or higher | More lenient; risks over-placing | |

| Option | Description | Selected |
|--------|-------------|----------|
| ~10 questions | Meaningful but low-fatigue | ✓ |
| ~15-20 questions | More thorough, heavier first-run gate | |
| ~5 questions | Very quick, noisy signal | |

**User's choice:** ≥80% → French 2; ~10 questions.

---

## End-of-level pass bar & retry

| Option | Description | Selected |
|--------|-------------|----------|
| 80% (match placement) | One consistent mastery standard | ✓ |
| 70% | More forgiving | |
| 90% | Strict gate | |

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate retry, reshuffled | Lowest friction | |
| Retry after review prompt | Nudge to weak lessons first | (partial) |
| Cooldown before retry | Lock retake for a period | (partial) |

**User's choice (free text):** "Add a 3 hour cooldown as well as a review section."
**Notes:** Combine BOTH — feedback + weak-area review section + 3-hour cooldown, then reshuffled retry. Drives D-E03.

---

## Placement gate UX

| Option | Description | Selected |
|--------|-------------|----------|
| Forced before lessons | Must complete placement before any lesson | ✓ |
| Skippable → default French 1 | Prompt but allow skip | |

| Option | Description | Selected |
|--------|-------------|----------|
| One-time, no retake | Placement runs once; movement via end-of-level diagnostics | ✓ |
| Allow retake | Redo placement from settings | |

**User's choice:** Forced before lessons; one-time, no retake.

---

## End-of-level availability

| Option | Description | Selected |
|--------|-------------|----------|
| After completing all lessons | Matches roadmap "after completing a level" | ✓ |
| Available anytime | Attempt whenever, even with lessons incomplete | |

**User's choice:** After completing all lessons.

---

## Question pool

| Option | Description | Selected |
|--------|-------------|----------|
| Pool per level, draw subset | ~20 pool, draw ~10; supports reshuffle | ✓ |
| Fixed set, reorder only | Same ~10 every attempt, memorizable | |

**User's choice:** Pool per level, draw subset.

---

## Review mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Tag questions to lessons/topics | Targeted review of exactly the missed lessons | ✓ |
| Generic level review link | Link to full lesson list, less targeted | |

**User's choice:** Tag questions to lessons/topics.

---

## Placed-up semantics (placed at French 2)

| Option | Description | Selected |
|--------|-------------|----------|
| Stays accessible, not required | Watermark unlocks 1 & 2; French 1 optional review | ✓ |
| Hidden / skipped | French 1 not shown; conflicts with Phase 3 model | |

**User's choice:** French 1 stays accessible, not required.

---

## Result screen

| Option | Description | Selected |
|--------|-------------|----------|
| Level + encouraging message | No raw %, honest-motivation framing | ✓ |
| Score + level + message | Fully transparent score | |
| Level only, minimal | No motivational framing | |

**User's choice:** Level + encouraging message (no raw percentage).

---

## Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Untimed | No pressure, no time tracking | |
| Soft timer (display only) | Show elapsed time, no enforcement | ✓ |
| Hard time limit | Enforced cap | |

**User's choice:** Soft timer (display only).

---

## Resume

| Option | Description | Selected |
|--------|-------------|----------|
| One sitting, no save | Leaving discards the attempt | |
| Resume where left off | Persist drawn set + answers, resumable | ✓ |

**User's choice:** Resume where left off.

---

## Cooldown details

| Option | Description | Selected |
|--------|-------------|----------|
| Per-level + live countdown | Live "available in 2h 14m" on retry button | ✓ |
| Per-level, static message | "try again later" without a ticking timer | |

**User's choice:** Per-level + live countdown.

---

## Claude's Discretion

- Exact schema (table/column names, attempt + answer modeling, RLS specifics, migration structure).
- Watermark representation (int `unlocked_through_level_number` vs level_id pointer).
- Placement gate mechanics (middleware/interceptor vs server-component guard).
- Exact seed question content/topics (minimal sample only).
- Diagnostic UI layout within DESIGN.md tokens.
- How weak/missed topics are computed from tags for the review section.
- MC vs fill-in score weighting (assume equal).

## Deferred Ideas

- Full practice-problem engine (conjugation, matching, open writing) → Phase 5.
- Real French 1/French 2 diagnostic content + topics → Phases 7–8.
- Richer per-lesson scoring beyond the diagnostic → still out of v1.
- Levels beyond French 2 — out of v1; watermark must not hard-code a 2-level ceiling.
