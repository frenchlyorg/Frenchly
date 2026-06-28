# Phase 8: French 2 Content — Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed all French 2 lessons with real grammar content via SQL migration. 10 lessons covering the standard French 2 grammar sequence, each with 4 sub-components (1 explainer + 2 practice + 1 writing). French 2 level row already exists in DB — all lessons are fresh INSERTs (no existing rows to UPDATE).

</domain>

<decisions>
## Implementation Decisions

### D-01: Curriculum scope
- **10 lessons** for French 2 (ROADMAP: "lesson-heavy" vs French 1's 6)
- **Standard French 2 grammar sequence:**
  1. Regular -ER verbs (parler, manger, étudier) — slug: `er-verbs`
  2. Regular -IR verbs (finir, choisir, réussir) — slug: `ir-verbs`
  3. Regular -RE verbs (vendre, attendre, répondre) — slug: `re-verbs`
  4. Negation: ne...pas and variations — slug: `negation`
  5. Question formation (est-ce que, inversion, intonation) — slug: `questions`
  6. Aller + infinitive — futur proche — slug: `futur-proche`
  7. Passé composé with avoir — slug: `passe-compose-avoir`
  8. Passé composé with être (motion verbs) — slug: `passe-compose-etre`
  9. Direct object pronouns (le, la, les, l') — slug: `object-pronouns`
  10. Adjective placement (BAGS rule) — slug: `adjective-placement`
- **All lessons are new INSERTs** — French 2 level exists (id: `97600976-de70-45af-ab50-4aedd2852f3a`, slug: `french-2`) but has 0 seeded lessons
- **4 sub-components per lesson:** 1 explainer + 2 practice problems + 1 writing prompt
- **All 4 auto-graded problem types (MC, fill-in, conjugation, matching) must appear across the 10 lessons** — same distribution rule as Phase 7

### D-02: Problem type selection
- **Flexible by topic** — choose the 2 practice types that best match each lesson's grammar:
  - ER/IR/RE verbs → conjugation-table + fill-in (verb forms are the core skill)
  - Negation → MC + fill-in (choose correct placement / supply ne...pas)
  - Questions → MC + fill-in (identify question type / form a question)
  - Futur proche → conjugation-single + fill-in (aller form + infinitive)
  - Passé composé (avoir) → conjugation-table + fill-in (past participle agreement)
  - Passé composé (être) → matching + conjugation-single (VANDERTRAMP verbs + form)
  - Object pronouns → MC + fill-in (identify/place correct pronoun)
  - Adjective placement → fill-in + matching (BAGS adjectives / order)
- **Writing prompt in every lesson** — always last sub-component, contextually relevant
- **Hints on every writing sub-component** — 3 newline-separated French phrases

### D-03: Content delivery
- **No sample review gate** — Phase 7 established and proven the format; all 10 lessons generated in one plan/execute wave
- **Single plan (08-01):** Generate full SQL migration for all 10 lessons, run manually in Supabase SQL Editor
- **SQL migration file:** `supabase/migrations/20260628_phase8_french2_content.sql`
- **Migration strategy:** All-INSERT (no UPDATEs needed — no existing French 2 lessons)
- **Idempotent:** `ON CONFLICT (level_id, slug) DO NOTHING` on all lesson INSERTs; sub-component INSERTs inside `IF lesson_id IS NOT NULL THEN` guard
- **Manual migration** in Supabase SQL Editor (CLI not installed)

### D-04: SQL structure
- Same dollar-quoting strategy as Phase 7: `$body$` outer block, `$json$` for JSON content, `$txt$` for markdown explainers
- Single `DO $body$ DECLARE ... BEGIN ... END; $body$;` block for the entire migration
- Guard at top: `SELECT id INTO v_french2_id FROM public.levels WHERE slug = 'french-2'; IF v_french2_id IS NULL THEN RAISE EXCEPTION ...`
- Declare one uuid variable per lesson: `v_lesson1_id` through `v_lesson10_id`

### Claude's Discretion
- Exact French sentences in MC options, fill-in blanks, matching pairs, and writing hints
- Time estimate per lesson — same 12 min as Phase 7 (4 sub-components × ~3 min)
- Exact wording of writing prompts — follow Phase 7's established format
- Position values for sub-components (1–4 per lesson)
- Specific vocabulary choices within each grammar topic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and problem types
- `supabase/migrations/20260622_phase3_lessons.sql` — lessons/sub_components schema, RLS policies, level IDs
- `supabase/migrations/20260623_phase5_practice.sql` — problem_type column definition, content JSON format examples
- `supabase/migrations/20260625_phase7_french1_content.sql` — **primary template**: dollar-quoting pattern, DO $body$ block structure, ON CONFLICT clause, variable declarations, sub-component INSERT pattern — replicate exactly
- `src/lib/practice/types.ts` — MCProblem, FillInProblem, ConjugationTableProblem, ConjugationSingleProblem, MatchingProblem, WrittenProblem type definitions (content JSON must match these exactly)
- `src/lib/practice/schema.ts` — Zod validation schema; all content must pass parse at render time

### Design system
- `DESIGN.md` — lesson content max-width 720px; typography tokens
- `CLAUDE.md` — sentence case for all UI copy; Green = correct-answer only

### Requirements
- `REQUIREMENTS.md` §CONTENT-02, CONTENT-03 — "French 2 lessons fully built out" + "each lesson has a mix of problem types"
- `ROADMAP.md` Phase 8 — success criteria: completable end-to-end, gated behind French 1 diagnostic, all 4 problem types represented, no dead ends

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 6 problem card components built and wired: MCPracticeCard, FillInPracticeCard, ConjugationTableCard, ConjugationSingleCard, MatchingCard, WrittenCard — no code changes needed
- `parseProblemContent()` in `src/lib/practice/schema.ts` — validates content at render time; malformed JSON shows "not available yet" silently
- `src/components/lessons/SubComponentItem.tsx` — handles all sub-component kinds automatically

### Established Patterns
- Content JSON stored in `sub_components.content` as a string matching ProblemData discriminated union
- Writing sub-components: `{ "type": "written", "prompt": "...", "hints": "..." }` — hints is newline-separated phrases, rendered `whitespace-pre-line`
- Dollar-quoting: `$body$` outer, `$json$` for JSON strings, `$txt$` for markdown — proven in Phase 7
- `ON CONFLICT (level_id, slug) DO NOTHING RETURNING id INTO v_lessonN_id` — standard idempotency pattern

### Integration Points
- `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` — fetches sub_components and parses content server-side; picks up French 2 content automatically
- `src/app/levels/[levelSlug]/page.tsx` — displays lesson list; picks up new lessons from DB query automatically
- French 2 level is already gated behind the French 1 end-of-level diagnostic (Phase 4 implementation) — no code changes needed

</code_context>

<specifics>
## Specific Ideas

- Phase 7 migration file is the primary template — reuse structure verbatim, just update slugs, titles, and content
- Verb lessons (ER/IR/RE) should use conjugation-table as one practice type — the table format is ideal for showing all 6 person forms
- Passé composé lessons benefit from matching (pair infinitive → past participle) for high recall value
- VANDERTRAMP mnemonic can appear in the être lesson's explainer markdown

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 8-French-2-Content*
*Context gathered: 2026-06-27*
