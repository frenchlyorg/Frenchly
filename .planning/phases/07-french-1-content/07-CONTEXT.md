# Phase 7: French 1 Content — Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and seed the complete French 1 curriculum: 6 lessons covering the standard French 1 grammar sequence, each with 3–4 sub-components (explainer + practice + writing). All content delivered via SQL migration file, run directly in Supabase dashboard.

</domain>

<decisions>
## Implementation Decisions

### D-01: Curriculum scope
- **6 total lessons** for French 1 (ROADMAP: "lighter lesson count" vs French 2)
- **Standard French 1 grammar sequence:**
  1. Greetings and introductions (exists — expand with real problem content)
  2. Definite articles: le, la, l', les (exists — expand with real problem content)
  3. Numbers and counting (new)
  4. Subject pronouns + être (new)
  5. Indefinite articles: un, une, des (new)
  6. Être + adjectives — basic descriptions (new)
- **Expand existing 2 lessons** (do NOT delete/reinsert — UPDATE by title match to preserve sub_component_progress rows)
- **3–4 sub-components per lesson:** 1 explainer + 1–2 practice problems + 1 writing prompt

### D-02: Content authorship
- **Claude generates all content** from the topic
- **Sample review gate during planning:** Planner generates ONE complete sample lesson in the plan document; user approves format/style before any SQL is written
- **Template locked after review:** All remaining lessons follow the approved sample exactly
- **Explainer style: short and direct** — 3–5 sentence intro + table or bullet list; no long prose

### D-03: Problem type selection
- **Flexible by topic** — choose the problem type that best matches the grammar being taught:
  - Greetings → matching pairs (formal/informal, time-of-day)
  - Articles → MC (choose the correct article)
  - Numbers → fill-in or matching
  - Pronouns + être → conjugation-table or fill-in
  - Indefinite articles → MC
  - Être + adjectives → fill-in or conjugation-single
- **Writing prompt in every lesson** — always the last sub-component; prompt is contextually relevant to the lesson topic
- **Hints field populated** on every writing sub-component (collapsible helpful phrases the student can reference)

### D-04: Content delivery
- **SQL migration file:** `supabase/migrations/20260625_phase7_french1_content.sql`
- **Existing lessons:** UPDATE sub_components SET content = '...' WHERE title = '[title]' AND lesson_id = (SELECT id FROM lessons WHERE slug = '[slug]')
- **New lessons:** INSERT into lessons then INSERT sub_components — same pattern as phase3 migration
- **Migration executed manually** in Supabase SQL Editor (CLI not installed)
- **Idempotent:** Migration uses UPDATE for existing rows (safe to re-run); new rows use INSERT

### Claude's Discretion
- Exact French sentences in MC options, fill-in blanks, and matching pairs
- Time estimate (estimated_minutes) per lesson — infer from 3–4 sub-components at ~3 min each
- Exact wording of writing prompts and hints — follow the approved sample template
- Position values for new sub-components (increment from highest existing position)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and problem types
- `supabase/migrations/20260622_phase3_lessons.sql` — lessons/sub_components schema, RLS policies, existing seed pattern (INSERT into levels/lessons/sub_components)
- `supabase/migrations/20260623_phase5_practice.sql` — problem_type column, content JSON format reference
- `src/lib/practice/types.ts` — WrittenProblem, MCProblem, FillInProblem, ConjugationTableProblem, ConjugationSingleProblem, MatchingProblem type definitions (content JSON must match these exactly)
- `src/lib/practice/schema.ts` — Zod validation schema for all problem types (content must pass parse)

### Design system
- `DESIGN.md` — design tokens; lesson content max-width 720px; typography (Literata headings, Be Vietnam Pro body)
- `CLAUDE.md` — sentence case for all UI copy; Green (tertiary) = correct-answer only

### Requirements
- `REQUIREMENTS.md` §CONTENT-01, CONTENT-03 — "French 1 lessons fully built out" + "each lesson has a mix of problem types"
- `ROADMAP.md` Phase 7 — success criteria: completable end-to-end, time estimates within 20% of actual, at least one of each problem type across French 1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 6 problem card components are built and wired: MCPracticeCard, FillInPracticeCard, ConjugationTableCard, ConjugationSingleCard (reuses FillIn), MatchingCard, WrittenCard
- `src/lib/practice/schema.ts` → `parseProblemContent()` validates content JSON at render time — malformed JSON shows "not available yet" silently
- `src/components/lessons/SubComponentItem.tsx` — handles kind='practice' and kind='writing' panels

### Established Patterns
- Content JSON is stored in `sub_components.content` as a JSON string matching ProblemData discriminated union
- All sub-component kinds already handled: explainer (markdown), practice (JSON), writing (JSON with `type:'written'`)
- Writing sub-components need `{ "type": "written", "prompt": "...", "hints": "..." }` JSON
- Practice sub-components need type-specific JSON per `src/lib/practice/types.ts`
- SQL escaping: use `$$...$$` dollar-quoting for string literals with apostrophes (see phase3 migration pattern)

### Integration Points
- `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — fetches sub_components and parses content server-side; no code changes needed for new content
- `src/app/levels/[levelSlug]/page.tsx` — displays lesson list; picks up new lessons automatically from DB query
- Diagnostic seed data in phase4 migration references French 1 lesson IDs — new lessons are independent (different slug/id) and don't affect diagnostics

</code_context>

<specifics>
## Specific Ideas

- Sample lesson review gate is critical: planner generates one full lesson (SQL + rendered preview description) so user can see the format before all 6 lessons are written
- Hints on writing sub-components should be 3–5 short French phrases relevant to the lesson topic, formatted as one phrase per line
- Explainer markdown should use `##` heading + short intro paragraph + table or bullet list — no nested headers

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 7-French-1-Content*
*Context gathered: 2026-06-25*
