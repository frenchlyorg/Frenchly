---
phase: 10-security-quality
plan: "01"
subsystem: security-quality
tags: [error-boundary, dependabot, api-hardening, sql-audit]
dependency_graph:
  requires: []
  provides: [ErrorCard, dependabot-config, check-writing-400-hardening]
  affects: [src/app/error.tsx, src/app/global-error.tsx, src/app/not-found.tsx]
tech_stack:
  added: []
  patterns: [discriminated-union-props, warm-card-layout, dependabot-grouped-weekly]
key_files:
  created:
    - src/components/ui/ErrorCard.tsx
    - .github/dependabot.yml
  modified:
    - src/app/api/check-writing/route.ts
decisions:
  - "ErrorCard is 'use client' — onClick prop (reset) cannot cross RSC boundary; simplest correct solution"
  - "Dependabot groups minor+patch into one weekly PR; no auto-merge key (D-08); security PRs are always immediate"
  - "check-writing 400 body changed from parsed.error.flatten() to single friendly message per D-09/D-11"
metrics:
  duration: "~50 minutes"
  completed: "2026-06-29"
  tasks: 3
  files_changed: 3
---

# Phase 10 Plan 01: ErrorCard, Dependabot, API Hardening Summary

**One-liner:** Shared warm ErrorCard primitive (discriminated-union action), Dependabot grouped-weekly npm scanning (SEC-08), and check-writing 400 response hardened to strip Zod field-detail leak (D-09/D-11/T-10-01).

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Build shared ErrorCard component | `1d9e9d3` | `src/components/ui/ErrorCard.tsx` (created) |
| 2 | Add Dependabot npm config (SEC-08) | `d2fc537` | `.github/dependabot.yml` (created) |
| 3 | Audit and harden API input validation + SQL audit | `f2c9353` | `src/app/api/check-writing/route.ts` (modified) |

---

## SC-3: SQL Audit Evidence

**Command run:**
```bash
grep -rn "\.rpc\|\.sql\|\`SELECT\|\`INSERT\|\`UPDATE\|\`DELETE\|query.*\`.*WHERE" \
  src/ --include="*.ts" --include="*.tsx"
```

**Output:** (empty — zero matches)

All Supabase queries across `src/` use the query builder pattern (`.from().select().eq()`) — parameterized by construction. No raw SQL string building found. SC-3 satisfied.

---

## SC-4: API Input Validation Audit

**check-writing route guards confirmed present:**

| Guard | Status | Response |
|-------|--------|----------|
| No auth → 401 | Present (line 331) | `{ error: 'Unauthorized' }` |
| Malformed JSON → 400 | Present (try/catch lines 338-342) | `{ error: 'Invalid JSON body' }` |
| Zod schema failure → 400 | Present (safeParse lines 344-350) | `{ error: "That didn't look right — try again." }` (hardened) |
| Unknown sub-component → 404 | Present (lines 363-365) | `{ error: 'Sub-component not found' }` |
| Burst guard → 429 | Present (lines 384-389) | `{ error: 'Duplicate request...' }` |
| Rate limit exceeded → 200 | Present (lines 400-426) | `{ feedback: ..., rateLimited: true }` |
| Anthropic error → 200 fallback | Present (lines 451-454) | `{ feedback: "We couldn't check..." }` |

**Hardening applied (D-09/D-11/T-10-01):** The Zod schema-failure branch previously returned `{ error: 'Invalid request body', details: parsed.error.flatten() }` which leaked field-level Zod validation details. Replaced with `{ error: "That didn't look right — try again." }` — single friendly message, no internals.

**Other API routes:** `ls src/app/api` shows `check-writing` is the only route directory. No additional routes to audit.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / T-10-01] Strip Zod field-detail leak from check-writing 400 response**

- **Found during:** Task 3 audit
- **Issue:** `check-writing` route returned `details: parsed.error.flatten()` in the Zod schema-failure 400 response, exposing field-level validation internals (T-10-01 Information Disclosure, D-09/D-11)
- **Fix:** Replaced response body with `{ error: "That didn't look right — try again." }` — single friendly message, zero field details
- **Files modified:** `src/app/api/check-writing/route.ts`
- **Commit:** `f2c9353`

No other deviations — plan executed as written.

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean (exit 0) |
| ErrorCard acceptance criteria | All 7 passed |
| `.github/dependabot.yml` shape check | Passed (npm ecosystem, grouped, no auto-merge) |
| SQL audit grep | Zero matches (SC-3 clean) |
| `npm test -- --testPathPattern="check-writing"` | 3/3 passed |

---

## Known Stubs

None — all files wire to real behavior with no placeholder data.

---

## Threat Flags

No new security-relevant surface introduced beyond what was planned. The fix to `check-writing` reduces the information disclosure surface (T-10-01 mitigated).

---

## Self-Check: PASSED

- `src/components/ui/ErrorCard.tsx` exists: confirmed
- `.github/dependabot.yml` exists: confirmed
- `src/app/api/check-writing/route.ts` modified: confirmed
- Commit `1d9e9d3` exists: feat(10-01) ErrorCard
- Commit `d2fc537` exists: chore(10-01) dependabot
- Commit `f2c9353` exists: fix(10-01) check-writing hardening
