# Phase 3: Lesson Framework - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 3-Lesson Framework
**Areas discussed:** Sub-component model, Completion semantics, Unlock + placement, Time estimates

---

## Sub-component model

| Option | Description | Selected |
|--------|-------------|----------|
| Typed blocks + flexible content | One `sub_components` table, `kind` field + flexible content column; problem specifics deferred to Phase 5 | ✓ |
| Generic JSON blocks | Each sub-component a structured-JSON blob rendered by shape | |
| Separate table per kind | Distinct tables for readings / practice / writing | |

**User's choice:** Typed blocks + flexible content (recommended)
**Notes:** Simplest schema that still grows; problem-type detail belongs to Phase 5.

---

## Completion semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Binary done, save on finish action | done/not-done, written to DB the instant a sub-component is finished | ✓ |
| Binary done, auto-detect | mark done on scroll-to-end or correct answer | |
| Store a 0–100 score | per-sub-component score | |

**User's choice:** Binary done, save on finish action (recommended)
**Notes:** Real-time save = immediate write on the done action. Scoring deferred to Phase 4.

---

## Unlock + placement

| Option | Description | Selected |
|--------|-------------|----------|
| French 1 fully open, default to French 1 | no sequential gating; French 2+ locked; Phase 4 flips placement later | ✓ |
| Sequential within level | must finish lesson 1 to open lesson 2 | |
| Everything open | all levels + lessons unlocked | |

**User's choice (free text):** "french one fully open ... all the lessons within french one to be open so you can jump between lessons if you want to."
**Notes:** Free in-level navigation is deliberate. French 2+ shown locked; placement default = French 1; Phase 4 changes only data, not the locked/unlocked UI.

---

## Time estimates

| Option | Description | Selected |
|--------|-------------|----------|
| Manual minutes per lesson | authored `estimated_minutes` field | ✓ |
| Computed from sub-component count | auto-derived estimate | |

**User's choice:** Manual minutes per lesson (recommended)
**Notes:** Accurate and trivial; no computation.

---

## Claude's Discretion

- Schema column names/types, relationships, migration structure
- Level-page and lesson-view layout (within DESIGN.md tokens)
- Amount of sample French 1 data to seed (minimal)
- Data-fetching approach + real-time UI update mechanism

## Deferred Ideas

- Per-sub-component scoring (0–100) — Phase 4 if needed
- Sequential lesson gating within a level — rejected for v1
- Culture + Above & Beyond levels — out of v1 content scope
