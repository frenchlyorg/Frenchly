# Phase 5: Practice Problem Engine — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 05-practice-problem-engine
**Areas discussed:** Conjugation format, Matching UI, Completion trigger, Wrong answer retry

---

## Conjugation format

| Option | Description | Selected |
|--------|-------------|----------|
| Single blank — one form | Reuses FillInInput. Given subject, fill one conjugation. | ✓ (partial) |
| Full table — all 6 forms | New grid component. Fill je/tu/il/nous/vous/ils at once. | ✓ (partial) |

**User's choice:** Both — "Have one full table at the start then single blanks"
**Notes:** User clarified this means conjugation problems have two sub-types: a 6-form table problem and single-blank problems. Also specified that explainer sub-components for conjugation lessons must always include the full paradigm table in the reading material.

---

## Matching UI

**Q1: Interaction model**

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-pair | Click left item, then right item to connect. Works on mobile. | ✓ |
| Drag-and-drop | Drag left items onto right targets. Complex on mobile. | |
| Select-to-match (dropdown) | Dropdown per row. Simplest but least interactive. | |

**Q2: Feedback timing**

| Option | Description | Selected |
|--------|-------------|----------|
| All at once — check button | Student matches all pairs, taps Check, sees all feedback. | ✓ |
| Per-pair — instant feedback | Each pair locks in with immediate green/red. | |

**User's choice:** Click-to-pair with all-at-once Check button feedback.
**Notes:** No additional notes.

---

## Completion trigger

**Q1: General trigger**

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-complete on correct answer | Answering correctly saves progress automatically. | ✓ |
| Manual — student taps 'Mark complete' | Consistent with explainer sub-components. | |

**Q2: Conjugation table**

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 correct = auto-complete | Only marks done when every form is right. | |
| Any submission = auto-complete | Submitting once marks done; feedback shown regardless. | ✓ |

**Q3: Matching**

| Option | Description | Selected |
|--------|-------------|----------|
| All pairs correct = auto-complete | Only marks done when every pair is right. | |
| Clicking Check = auto-complete | Submitting once marks done. | ✓ |

**User's choice:** Auto-complete on correct for MC/fill-in/single conjugation; any submission completes conjugation table and matching.
**Notes:** No additional notes.

---

## Wrong answer retry

**Q1: Retry policy**

| Option | Description | Selected |
|--------|-------------|----------|
| Retry until correct | Student sees correct answer, then can try again. Input resets clean. | ✓ |
| One shot — show answer, move on | Shows correct form, then manual mark-complete. No retry. | |

**Q2: Reset behavior on retry**

| Option | Description | Selected |
|--------|-------------|----------|
| Reset clean | Input clears, MC options return to default state. | ✓ |
| Keep wrong answer visible | Show incorrect state, let student edit/reselect. | |

**User's choice:** Retry until correct, reset clean.
**Notes:** Retry applies to MC and fill-in (including single conjugation). Conjugation table and matching don't have a retry concept — they auto-complete on any submission.

---

## Claude's Discretion

- Problem data model (JSON in sub_components.content vs. new practice_problems table) — left to researcher/planner to evaluate based on codebase constraints
- Number of matching pairs per problem (~4–6 is standard; planner to decide)
- Specific visual treatment for click-to-pair connection (highlight, line, or badge)

## Deferred Ideas

None — discussion stayed within phase scope.
