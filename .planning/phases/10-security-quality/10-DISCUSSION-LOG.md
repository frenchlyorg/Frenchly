# Phase 10: Security & Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-28
**Phase:** 10-security-quality
**Areas discussed:** Error state UX, 404 / not-found page, Dependabot policy, Malformed-input responses

---

## Error State UX

| Option | Description | Selected |
|--------|-------------|----------|
| Full-page warm error card | Centered card, heading + friendly line + retry button (DiagnosticGate look) | ✓ |
| Inline banner only | Coral banner at top of affected area, page stays | |
| Both — by severity | Page failures → card, action failures → inline | |

**User's choice:** Full-page warm error card
**Notes:** Action-level errors (save banner) already exist inline, so the outcome is effectively severity-split — full-page for page/load/Supabase-down failures, inline retained for action failures.

---

## 404 / Not-Found Page

| Option | Description | Selected |
|--------|-------------|----------|
| Branded full-page | Warm card matching error page + "Back to dashboard" link | ✓ |
| Minimal text | Plain "Page not found" + link | |
| Reuse error card | One shared component, different copy | |

**User's choice:** Branded full-page
**Notes:** Shared warm-card treatment acceptable as long as copy stays distinct from the error page.

---

## Dependabot Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Group + weekly, you review | Grouped weekly PR (minor+patch), instant security PR, manual merge, no auto-merge | ✓ |
| Auto-merge patches | Patch/minor auto-merge on green CI; majors+security reviewed | |
| Everything separate, manual | One PR per dependency | |

**User's choice:** Group + weekly, you review
**Notes:** Solo project — prefers low noise + control. No auto-merge.

---

## Malformed-Input Responses

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly message + 400 | Validate, return 400 + friendly line, no leaked internals | ✓ |
| Silent fallback | Safe default, no error message | |
| Field-specific errors | Per-field validation detail | |

**User's choice:** Friendly message + 400
**Notes:** Primary surface is the /api/check-writing route. Server errors → 500 + generic line. Mirrors the AI-checker graceful-fallback rule. Flow continues, never crashes.

---

## Claude's Discretion

- Test framework + SEC-05 gap-fill (Jest in place; 3 paths largely covered — verify, don't rebuild)
- SQL-audit method (grep for raw string SQL; all queries use Supabase query builder)
- Dependabot YAML schema, error-boundary file placement, shared error-card component structure
- Error/404 copy wording (warm, sentence case)

## Deferred Ideas

- Fuller test pyramid (unit + integration + e2e + CI thresholds) — v2, out of scope per REQUIREMENTS.md
- Chaos / load testing — premature at this scale
- LCP / render-blocking performance optimization — Phase 9 follow-up, revisit post-deploy
