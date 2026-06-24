# Phase 5: Practice Problem Engine — Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver interactive practice problems embedded in `kind='practice'` lesson sub-components. Four problem types — multiple choice, fill-in-the-blank, conjugation (two variants), and matching — all graded client-side instantly with no AI and no network call. Correct answers auto-complete the sub-component (except where noted). Wrong answers allow retry.

This phase does NOT build lesson content (Phase 7/8), the AI writing checker (Phase 6), or any new pages.

</domain>

<decisions>
## Implementation Decisions

### Conjugation format
- **D-01:** Two conjugation problem sub-types must be supported:
  - **Full table**: student fills all 6 conjugation forms at once (je/tu/il/nous/vous/ils). Requires a new grid/table component. Any submission auto-completes the sub-component (feedback shown, but not gated on all-correct).
  - **Single blank**: student fills one form given a subject prompt (e.g. "Je ___ (parler)"). Reuses `FillInInput` directly. Auto-completes on correct answer only.
- **D-02:** Explainer sub-components for conjugation lessons MUST include the full paradigm table in their markdown content. This is a content authoring requirement — the reading material always shows the complete conjugation table before practice problems.

### Matching UI
- **D-03:** Matching uses a **click-to-pair** interaction: student clicks a left-column item to select it, then clicks a right-column item to connect them. Visual feedback (highlight/line) shows the connection.
- **D-04:** Feedback appears **all at once** after a "Check" button press. Correct pairs show green; incorrect pairs show red (design token: tertiary = correct, error = incorrect — UX-10).
- **D-05:** Clicking "Check" **auto-completes the sub-component** regardless of how many pairs were correct. Feedback is shown but completion is not gated on perfection.

### Completion trigger
- **D-06:** Auto-complete rules by type:
  | Problem type | Auto-completes when |
  |---|---|
  | Multiple choice | Correct answer selected |
  | Fill-in / single conjugation | Correct answer submitted |
  | Conjugation table (6-form) | Any submission ("Check" clicked) |
  | Matching | "Check" clicked (any submission) |
- **D-07:** Incorrect answers on MC and fill-in do NOT auto-complete. The sub-component stays open for retry.

### Wrong answer retry
- **D-08:** For MC and fill-in (including single conjugation): **retry until correct**. After seeing the wrong state + correct answer revealed, student can try again. Input/options **reset clean** on retry — no previous wrong answer shown.
- **D-09:** Conjugation table and matching: no retry concept — a single "Check" submission completes the sub-component. Feedback (which cells/pairs were wrong) is shown, but the student doesn't re-attempt.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system
- `DESIGN.md` — all color tokens, typography, spacing. No ad-hoc hex values.
- `CLAUDE.md` — UX-10 (green/tertiary = correct-answer feedback ONLY, nowhere else), color rules, sentence case, component guidelines

### Existing reusable components (read before building new ones)
- `src/components/diagnostic/MCOptionButton.tsx` — MC option with correct/incorrect/selected states; reuse directly for practice MC problems
- `src/components/diagnostic/FillInInput.tsx` — fill-in input with correct/incorrect/accent-note states; reuse for fill-in and single conjugation
- `src/components/lessons/SubComponentItem.tsx` — current placeholder for practice kind; this phase replaces the title-only placeholder with an interactive problem

### Existing data layer
- `supabase/migrations/20260622_phase3_lessons.sql` — lessons + sub_components schema (kind, content columns); understand before designing problem data model
- `src/actions/` — Server Action pattern for saving sub-component progress (Phase 3 established this; practice completion calls the same action)

### Requirements
- `REQUIREMENTS.md` — PROB-01 through PROB-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MCOptionButton` — full MC interaction already built (default/selected/correct/incorrect states, aria-checked, 44px touch target, green=correct/red=incorrect tokens). Import directly.
- `FillInInput` — fill-in input already built (correct/incorrect/accent-note states, focus coral border, Enter-to-submit). Import directly for fill-in and single conjugation problems.
- `sub_component_progress` table + Server Action — progress saving infrastructure is live from Phase 3. Practice completion calls the same save action.

### Established Patterns
- **Green (tertiary) = correct ONLY.** `MCOptionButton` and `FillInInput` already enforce this. Any new components (conjugation table, matching) must follow the same rule. No green outside of correct-answer feedback.
- **Client component + Server Action.** Problem UI is a client component (interactivity); progress save calls a Server Action. Same pattern as Phase 3's optimistic sub-component toggle.
- **Sub-component `kind='practice'`** currently renders as a title-only row in `SubComponentItem`. Phase 5 replaces this with the interactive problem UI embedded below the title row.

### Integration Points
- `SubComponentItem` — needs a new branch for `kind='practice'` that renders the appropriate problem component below the title, replacing the current placeholder
- Problem data: sub_components currently has a `content` text column (markdown). Practice problems need structured data (problem type, prompt, options, answer). Researcher should evaluate: extend content as JSON vs. new `practice_problems` table linked by sub_component_id
- The mark-complete toggle button should be hidden (or auto-triggered) for practice sub-components — completion is driven by the problem result, not manual click

</code_context>

<specifics>
## Specific Ideas

- Conjugation lessons: the explainer (reading) sub-component must always include the full paradigm table. This is a content authoring convention that should be noted in any seed data or content guidelines the planner produces.
- Conjugation table problem: a grid where each row is a pronoun + blank (je ___, tu ___, etc.). Student fills all 6, clicks Check, sees per-cell correct/incorrect feedback.
- Matching: typical French lesson use case is word↔translation or infinitive↔conjugated-form pairs. ~4–6 pairs per problem.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-practice-problem-engine*
*Context gathered: 2026-06-23*
