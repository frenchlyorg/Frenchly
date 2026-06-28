# Phase 10: Security & Quality - Context

**Gathered:** 2026-06-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the app for launch. Five deliverables:
1. **Graceful error states** — page-level failures and 404s show branded warm UI, never a blank/broken page.
2. **Dependency scanning** — Dependabot active (SEC-08).
3. **Input/SQL audit** — confirm no raw SQL string building; API routes reject malformed input with friendly 400s, no 500 crashes or leaked internals.
4. **Test suite green** for the three critical paths: login, save-progress, diagnostic-unlock (SEC-05).
5. **Graceful degradation** — Supabase unavailable → warm error UI.

This phase hardens existing features. It does NOT add new product capabilities, new pages (Phase 11), or deployment wiring (Phase 12).
</domain>

<decisions>
## Implementation Decisions

### Error State UX
- **D-01:** Page-level / load failures render a **full-page warm error card** (centered on cream/charcoal background: short heading, friendly one-liner, **retry button**). Matches the DiagnosticGate visual language. Implement as Next.js `error.tsx` (route-level) + `global-error.tsx` (root fallback).
- **D-02:** Action-level failures (e.g. save-progress) stay **inline** — the existing coral save-error banner in `SubComponentList` is the pattern. Do not convert those to full-page.
- **D-03:** Supabase-unavailable (success criterion 5) surfaces through the same full-page error card — never a blank page.

### 404 / Not-Found Page
- **D-04:** Custom **branded full-page** `not-found.tsx` — warm centered card matching the error page, with a **"Back to dashboard"** link. Replaces the current plain inline "Lesson not found." / "Level not found." text where a full page is appropriate.
- **D-05:** Error card and 404 card share the warm-card visual treatment but carry distinct copy (404 = "page wandered off"; error = "something went wrong"). A shared presentational component is acceptable if copy stays distinct.

### Dependency Scanning (Dependabot)
- **D-06:** `.github/dependabot.yml` configured for the npm ecosystem.
- **D-07:** **Grouped weekly** PR for minor + patch updates (low noise). **Security alerts open a PR immediately.** Major-version bumps come as separate flagged PRs.
- **D-08:** **No auto-merge.** Developer reviews and merges after CI is green. (Solo project — control over noise.)

### Malformed-Input Responses
- **D-09:** API routes **validate input** and return **HTTP 400 + a short friendly message** ("That didn't look right — try again."). Never leak stack traces, raw errors, or internal details.
- **D-10:** Server errors return **500 + a generic friendly line** (no internals). The lesson/flow continues gracefully — matches the existing AI-checker fallback rule in CLAUDE.md.
- **D-11:** Primary surface is the `/api/check-writing` route (the main API handler). Field-specific error breakdowns are out of scope — single friendly message is enough.

### Claude's Discretion
- Test framework + how to fill SEC-05 gaps (Jest already in place; login/diagnostic/save-progress paths largely covered — verify and gap-fill).
- SQL-audit method (grep for string concatenation in `.from()`/`rpc()`/raw queries; all current queries use the Supabase query builder = parameterized).
- Exact Dependabot YAML schema, error-boundary file placement, and shared error-card component structure.
- Error/404 copy wording (warm, sentence case, per DESIGN.md + CLAUDE.md rule 9).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — SEC-05 (3-path test suite), SEC-08 (Dependabot); SEC-06/07 already satisfied in Phase 9.
- `.planning/ROADMAP.md` §"Phase 10: Security & Quality" — goal + 5 success criteria.

### Design / Standards
- `DESIGN.md` — warm palette tokens for the error/404 cards (no ad-hoc hex, no green).
- `CLAUDE.md` §Security Rules — parameterized queries only, input sanitization, no secrets in client; §AI Checker Rules — graceful fallback pattern to mirror for error responses.

### Reusable patterns in code
- `src/components/diagnostic/DiagnosticGate.tsx` — warm full-page card layout to model error/404 pages on.
- `src/components/lessons/SubComponentList.tsx` — existing inline save-error banner (action-level error pattern, D-02).
- `src/app/api/check-writing/route.ts` — main API handler for malformed-input hardening (D-09/10/11).

No external ADRs — requirements fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **DiagnosticGate.tsx** — warm centered card (max-w, rounded-[16px], surface-container-low) → template for `error.tsx` / `not-found.tsx`.
- **LinkButton / Spinner** (`src/components/ui/`) — reuse for the retry button on the error card.
- **18 existing test suites** — login (`__tests__/auth/login.test.ts`), diagnostic (`__tests__/diagnostic/*`), lessons/save-progress (`__tests__/lessons/actions.test.ts`), RLS — SEC-05 is mostly covered; this phase verifies + gap-fills, not greenfield.

### Established Patterns
- All Supabase queries use the **query builder** (`.from().select().eq()`) — parameterized by construction. SQL audit should confirm zero raw string SQL (success criterion 3).
- Server actions already return friendly vague errors (auth) — extend the same discipline to API route 400/500 handling.
- `createClient()` server/client/admin factories — error boundaries wrap pages that call these; Supabase-down path needs a try/catch → error card.

### Integration Points
- `src/app/error.tsx` (new) + `src/app/global-error.tsx` (new) — root error boundaries.
- `src/app/not-found.tsx` (new) — global 404. Per-route not-found can `notFound()` into it.
- `.github/dependabot.yml` (new).
- `src/app/api/check-writing/route.ts` — add input validation guard returning 400.
</code_context>

<specifics>
## Specific Ideas

- Error card copy direction: "Something went wrong / We couldn't load this. Give it another try." + retry.
- 404 copy direction: "Page not found / That page wandered off. Let's get you back on track." + "Back to dashboard".
- Tone: warm, sentence case, no blame, matches the friendly auth-error voice already in the app.
</specifics>

<deferred>
## Deferred Ideas

- Fuller test pyramid (unit + integration + e2e + regression with CI thresholds) — explicitly out of scope per REQUIREMENTS.md; v2.
- Chaos / load testing — premature at this scale (REQUIREMENTS.md).
- LCP / render-blocking performance optimization — noted in Phase 9 follow-ups; revisit post-deploy if Vercel prod LCP stays orange.

None of these block Phase 10.
</deferred>

---

*Phase: 10-security-quality*
*Context gathered: 2026-06-28*
