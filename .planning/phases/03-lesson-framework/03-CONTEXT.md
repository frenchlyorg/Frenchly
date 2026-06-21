# Phase 3: Lesson Framework - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

The lesson data model lives in Supabase. A student can open a lesson, see its sub-components listed, complete sub-components, and have progress saved per sub-component in real time. Level pages show, per lesson: time estimate, locked/unlocked state, and the sub-component list. Seeded with sample French 1 data.

**In scope:** lesson + sub-component schema (with RLS), progress persistence, lesson view, level page with locked/unlocked + time estimates, minimal sample French 1 seed.

**Out of scope (other phases):**
- Actual problem types — MC, fill-in, conjugation, matching, open writing → Phase 5 (PROB-01–05)
- Real French 1/French 2 grammar content → Phases 7–8
- Placement diagnostic + end-of-level diagnostic (the unlock *mechanism*) → Phase 4
- AI writing checker → Phase 6
</domain>

<decisions>
## Implementation Decisions

### Sub-component model
- **D-L01:** One `sub_components` table, typed via a `kind` field (e.g. reading/explainer, practice, writing) plus a **flexible content column** (markdown/JSONB). Problem-type specifics (MC, fill-in, etc.) are NOT modeled here — Phase 5 fills them in. Simplest schema that still grows.

### Completion semantics
- **D-L02:** Sub-component completion is **binary** (done / not-done) — no score in this phase.
- **D-L03:** Progress is written to the DB **the instant a sub-component is finished** (the "real-time" save in LESSON-03). UI updates without a page reload (success criterion 3).
- A 0–100 score model was explicitly deferred — Phase 4 (diagnostics) can add scoring if needed.

### Unlock + interim placement
- **D-L04:** **French 1 is fully open** — every lesson within French 1 is unlocked and **freely jumpable in any order** (no sequential gating inside the level).
- **D-L05:** New users **default to French 1**. French 2+ levels are shown in a **locked** state.
- **D-L06:** The placement diagnostic doesn't exist yet (Phase 4). Phase 3 ships a single placement default (French 1); Phase 4 later flips that field to unlock higher levels. Keep the locked/unlocked UI real so Phase 4 only has to change data, not UI.

### Time estimates
- **D-L07:** Time estimate is a **manual `estimated_minutes` field authored per lesson** — not computed from sub-component count.

### Claude's Discretion
- Exact schema column names/types, table relationships, and migration structure.
- Level-page and lesson-view layout (within DESIGN.md tokens).
- How much sample French 1 data to seed (minimal — enough to prove open → complete → restore works).
- Client/server data-fetching approach and the real-time UI update mechanism.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §Lesson Framework — LESSON-01 (levels), LESSON-02 (trackable sub-components), LESSON-03 (real-time progress save), LESSON-04 (level page: time estimate, locked/unlocked, sub-component list)
- `.planning/ROADMAP.md` §"Phase 3: Lesson Framework" — goal + 5 success criteria
- `.planning/PROJECT.md` — product vision; level universe (French 1–5 + Culture + Above & Beyond), v1 ships French 1 & 2

### Design
- `DESIGN.md` — all colors/typography/spacing/components; lesson content max-width 720px, dashboard container 1040px, guillemet « » = active-lesson marker; warm palette per mode; green = correct-answer feedback only

### Backend / security (carried from Phase 2)
- `.planning/phases/02-authentication-accounts/02-CONTEXT.md` — Supabase client factories (browser/server/admin), RLS conventions (students read/write only own rows)
- `supabase/migrations/20260620_phase2_auth.sql` — existing profiles + RLS pattern to mirror for lesson/progress tables
- `CLAUDE.md` §Security Rules — RLS required on every user-data table, parameterized queries only, input sanitization
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/{client,server,admin}.ts` — three-tier Supabase factories; reuse for all lesson/progress reads/writes.
- `src/app/dashboard/page.tsx` — async Server Component pattern with `getUser()` defense-in-depth redirect; the level page / dashboard lesson UI extends this.
- `src/app/auth/actions.ts` — Server Action pattern (validation + DB write) to mirror for "mark sub-component complete".
- `src/components/*` + theme-provider — design-system components and light/dark theming already wired.

### Established Patterns
- RLS-on-every-user-table (Phase 2): lesson *content* tables are likely public-read; **per-student progress tables MUST have RLS** scoping rows to `auth.uid()`.
- `getUser()` (not `getSession()`) for auth checks; `NEXT_PUBLIC_*` keys only client-side, secret key server-only.

### Integration Points
- New lesson/progress migration sits alongside `20260620_phase2_auth.sql`.
- Progress rows reference `profiles`/`auth.users` (the placement field for D-L05/D-L06 likely lives on `profiles`).
- Dashboard stub becomes the entry point into level pages → lessons.
</code_context>

<specifics>
## Specific Ideas

- User emphasis on unlock: "french one fully open ... all the lessons within french one to be open so you can jump between lessons if you want to." Free navigation within French 1 is a deliberate UX choice, not an oversight.
</specifics>

<deferred>
## Deferred Ideas

- Per-sub-component scoring (0–100) — revisit in Phase 4 (diagnostics) if needed.
- Sequential lesson gating within a level — explicitly rejected for v1; could be a future setting.
- Culture + Above & Beyond levels — exist in the level universe but out of v1 content scope.
</deferred>

---

*Phase: 3-Lesson Framework*
*Context gathered: 2026-06-21*
