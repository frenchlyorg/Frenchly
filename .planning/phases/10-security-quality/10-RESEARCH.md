# Phase 10: Security & Quality - Research

**Researched:** 2026-06-28
**Domain:** Next.js App Router error boundaries, GitHub Dependabot, input validation hardening, test suite verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Page-level / load failures render a full-page warm error card (centered on cream/charcoal background: short heading, friendly one-liner, retry button). Matches the DiagnosticGate visual language. Implement as Next.js `error.tsx` (route-level) + `global-error.tsx` (root fallback).

**D-02:** Action-level failures (e.g. save-progress) stay inline — the existing coral save-error banner in `SubComponentList` is the pattern. Do not convert those to full-page.

**D-03:** Supabase-unavailable (success criterion 5) surfaces through the same full-page error card — never a blank page.

**D-04:** Custom branded full-page `not-found.tsx` — warm centered card matching the error page, with a "Back to dashboard" link. Replaces the current plain inline "Lesson not found." / "Level not found." text where a full page is appropriate.

**D-05:** Error card and 404 card share the warm-card visual treatment but carry distinct copy (404 = "page wandered off"; error = "something went wrong"). A shared presentational component is acceptable if copy stays distinct.

**D-06:** `.github/dependabot.yml` configured for the npm ecosystem.

**D-07:** Grouped weekly PR for minor + patch updates (low noise). Security alerts open a PR immediately. Major-version bumps come as separate flagged PRs.

**D-08:** No auto-merge. Developer reviews and merges after CI is green.

**D-09:** API routes validate input and return HTTP 400 + a short friendly message ("That didn't look right — try again."). Never leak stack traces, raw errors, or internal details.

**D-10:** Server errors return 500 + a generic friendly line (no internals). The lesson/flow continues gracefully.

**D-11:** Primary surface is the `/api/check-writing` route. Field-specific error breakdowns are out of scope.

### Claude's Discretion

- Test framework + how to fill SEC-05 gaps (Jest already in place; login/diagnostic/save-progress paths largely covered — verify and gap-fill).
- SQL-audit method (grep for string concatenation in `.from()`/`rpc()`/raw queries; all current queries use the Supabase query builder = parameterized).
- Exact Dependabot YAML schema, error-boundary file placement, and shared error-card component structure.
- Error/404 copy wording (warm, sentence case, per DESIGN.md + CLAUDE.md rule 9).

### Deferred Ideas (OUT OF SCOPE)

- Fuller test pyramid (unit + integration + e2e + regression with CI thresholds) — v2.
- Chaos / load testing — premature at this scale.
- LCP / render-blocking performance optimization — noted in Phase 9 follow-ups; revisit post-deploy.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-05 | Basic automated test suite covers the three highest-stakes paths: login, save-progress, diagnostic unlock | All three paths verified passing (18 suites, 156 tests). Gap-fill = confirm the "diagnostic-unlock" path explicitly tests the watermark advance. |
| SEC-08 | Dependency scanning enabled (GitHub Dependabot or equivalent) | `.github/dependabot.yml` does not exist yet. Schema and exact YAML verified via GitHub Docs. |
</phase_requirements>

---

## Summary

Phase 10 is a hardening phase, not a feature phase. The codebase is already in excellent shape: all 18 Jest test suites pass (156 tests, 3 skipped, 6 seconds), the `/api/check-writing` route already validates input with Zod and returns 400/401/404/429 appropriately, and all Supabase queries use the builder pattern (zero raw SQL strings). The SQL audit is a verification task, not a remediation task.

The four genuine work items are: (1) create `src/app/error.tsx` and `src/app/global-error.tsx` as client components that render the warm error card, (2) create `src/app/not-found.tsx` with the branded 404 card, (3) add `.github/dependabot.yml`, and (4) do a brief gap-fill pass on the diagnostic-unlock test path to confirm the watermark-advance assertion exists (it does exist in `actions.test.ts` — verification only). The shared `ErrorCard` presentational component avoids duplication across error.tsx / global-error.tsx / not-found.tsx.

**Primary recommendation:** Three new files (`error.tsx`, `global-error.tsx`, `not-found.tsx`) + one shared `ErrorCard` component + one `.github/dependabot.yml`. Audit SQL and test coverage as verification tasks. No new packages required.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page-level error boundary | Frontend Server (Next.js route segment) | Browser (client component reset) | `error.tsx` is a route-level React error boundary; `reset()` runs client-side |
| Root error fallback | Frontend Server (`global-error.tsx`) | Browser | Replaces the entire root layout; must own `<html>/<body>` |
| 404 routing | Frontend Server (`not-found.tsx`) | — | Next.js catches unmatched routes and `notFound()` calls server-side |
| Input validation on API route | API (`/api/check-writing`) | — | Already implemented with Zod; this phase adds/verifies 400 guard for the remaining error path in D-09/D-10 |
| Dependency scanning | External (GitHub Dependabot) | — | Runs in GitHub CI, independent of app tier |
| Test coverage verification | Dev toolchain (Jest) | — | Existing suite; gap-fill only |

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.9 | App Router error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`) | Locked project stack |
| React | 19.2.4 | Client component `'use client'` required for error boundaries | Required by Next.js error.tsx contract |
| Zod | already installed (see route.ts) | Input schema validation on API routes | Already in use for check-writing route |
| Jest + ts-jest | 29.7.0 / 29.4.11 | Test runner | Already configured, 18 suites green |
| @testing-library/react | 16.3.2 | Component tests | Already installed |

### No New Packages

All tooling is in place. This phase adds zero new npm dependencies.

**Version verification:** Confirmed by reading `package.json` directly from the repository. [VERIFIED: local package.json]

---

## Package Legitimacy Audit

> No external packages are being installed in this phase. All capabilities are met by existing dependencies.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser request
      │
      ▼
Next.js App Router
      │
      ├─ Route matched ──► Page renders normally
      │
      ├─ Route unmatched ──► not-found.tsx (404 warm card)
      │
      └─ Runtime throw during render
             │
             ├─ Segment-level ──► error.tsx (warm card + reset button) [CLIENT COMPONENT]
             │
             └─ Root layout throw ──► global-error.tsx (warm card + html/body) [CLIENT COMPONENT]

POST /api/check-writing
      │
      ├─ No auth ──────────────────────────── 401 Unauthorized
      ├─ Malformed JSON ───────────────────── 400 Invalid JSON body       [already done]
      ├─ Schema invalid (Zod) ─────────────── 400 Invalid request body    [already done]
      ├─ Sub-component not found ──────────── 404 Sub-component not found  [already done]
      ├─ Burst guard triggered ────────────── 429 Duplicate request        [already done]
      ├─ Rate limit exceeded (daily) ──────── 200 rateLimited:true         [already done]
      ├─ Anthropic error ──────────────────── 200 fallback message         [already done]
      └─ Success ──────────────────────────── 200 feedback text            [already done]

Supabase unavailable path:
      createClient() throws / getUser() throws
             │
             └─ error.tsx catches ──► warm full-page error card
```

### Recommended Project Structure

```
src/app/
├── error.tsx              # NEW — route-level error boundary (use client)
├── global-error.tsx       # NEW — root fallback (use client, owns html/body)
├── not-found.tsx          # NEW — global 404 (server component, no use client needed)
src/components/ui/
├── ErrorCard.tsx          # NEW — shared warm-card presentational component
.github/
├── dependabot.yml         # NEW — npm dependency scanning
```

### Pattern 1: Next.js error.tsx (route-level boundary)

**What:** A `'use client'` React component exported as default from `src/app/error.tsx`. Next.js wraps every route segment in a React error boundary automatically.

**When to use:** Catches errors thrown during Server Component rendering, data fetching, or Server Actions within the route segment. Does NOT catch errors in the root layout itself (that requires `global-error.tsx`).

**Props:** `{ error: Error & { digest?: string }, reset: () => void }`

- `error.message` is sanitized in production (Next.js does not expose server error details to the client)
- `error.digest` is a server-generated hash for cross-referencing server logs; safe to display
- `reset()` attempts to re-render the segment (retries the data fetch)

```typescript
// Source: https://nextjs.org/docs/app/getting-started/error-handling
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorCard
      heading="Something went wrong"
      body="We couldn't load this. Give it another try."
      action={{ label: 'Try again', onClick: reset }}
    />
  )
}
```

[CITED: https://nextjs.org/docs/app/getting-started/error-handling]

### Pattern 2: global-error.tsx (root fallback)

**What:** Same `'use client'` contract but must render its own `<html>` and `<body>` tags because it replaces the root layout.

**Critical:** `global-error.tsx` only activates in **production**. In development, Next.js shows its own error overlay. This is by design — do not test it in dev mode.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/error-handling
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorCard
          heading="Something went wrong"
          body="We couldn't load this. Give it another try."
          action={{ label: 'Try again', onClick: reset }}
        />
      </body>
    </html>
  )
}
```

[CITED: https://nextjs.org/docs/app/getting-started/error-handling]

### Pattern 3: not-found.tsx (404)

**What:** A Server Component (no `'use client'` required). Triggered automatically by Next.js for unmatched routes, or explicitly by calling `notFound()` from `next/navigation` inside any server component or server action.

**No props** — unlike error.tsx, not-found.tsx receives no props.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/not-found
import Link from 'next/link'

export default function NotFound() {
  return (
    <ErrorCard
      heading="Page not found"
      body="That page wandered off. Let's get you back on track."
      action={{ label: 'Back to dashboard', href: '/dashboard' }}
    />
  )
}
```

[CITED: https://nextjs.org/docs/app/api-reference/file-conventions/not-found]

### Pattern 4: Shared ErrorCard component

**What:** A presentational server/client-compatible component that renders the warm centered card. Accepts either an `onClick` (for reset) or an `href` (for navigation links), avoiding duplication across error.tsx / global-error.tsx / not-found.tsx.

```typescript
// Inline with DiagnosticGate visual language (CONTEXT.md canonical ref)
interface ErrorCardProps {
  heading: string
  body: string
  action:
    | { label: string; onClick: () => void; href?: never }
    | { label: string; href: string; onClick?: never }
}

export default function ErrorCard({ heading, body, action }: ErrorCardProps) {
  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-[480px] rounded-[16px] bg-surface-container-low p-8 text-center">
        <h1 className="font-heading text-[28px] font-semibold text-on-surface">{heading}</h1>
        <p className="mt-4 font-body text-[16px] leading-7 text-on-surface-variant">{body}</p>
        {/* action.onClick → button (error/global-error reset); action.href → Link (not-found) */}
      </div>
    </main>
  )
}
```

**Note:** Because `error.tsx` is always a client component and calls `reset()` on click, the ErrorCard's action button must work in a client context. If ErrorCard stays server-compatible, the button with `onClick` must live in a small wrapper or the component itself must be `'use client'`. The simplest resolution: make `ErrorCard` a `'use client'` component — it has no server-only data fetching.

[ASSUMED] — this component structure is recommended but the exact prop interface is at Claude's discretion per CONTEXT.md.

### Pattern 5: Dependabot YAML schema

```yaml
# Source: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configuring-dependabot-version-updates
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
    open-pull-requests-limit: 5
```

**Key facts:**
- Security updates (`dependabot security updates`) are always immediate — they are not governed by the `schedule` interval. The schedule only controls **version updates**. [CITED: https://docs.github.com/en/code-security/concepts/supply-chain-security/about-dependabot-security-updates]
- `groups` batches minor+patch into one PR per week (D-07 low noise).
- Major version bumps are NOT in the group — they arrive as separate PRs automatically (Dependabot default behavior for versions outside the group pattern).
- No `auto-merge` key = auto-merge is disabled by default (D-08 satisfied without explicit config).

[CITED: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configuring-dependabot-version-updates]

### Anti-Patterns to Avoid

- **Server component in error.tsx:** `error.tsx` MUST be `'use client'`. The `reset` prop is a function — functions cannot be passed from server to client across the RSC boundary. Forgetting `'use client'` causes a Next.js build error.
- **Missing html/body in global-error.tsx:** `global-error.tsx` replaces the root layout, so omitting `<html>/<body>` produces a malformed document.
- **Leaking error.message in production UI:** `error.message` may contain sensitive server details. Do NOT render `{error.message}` in the UI. The warm static copy ("We couldn't load this") is correct. `error.digest` is safe to display or log.
- **Relying on global-error.tsx in development:** It only fires in production. Test the full-page error card in a production build or by simulating the error at the segment level via `error.tsx`.
- **Raw SQL string building:** Already absent from this codebase. All queries use the Supabase query builder (`.from().select().eq()`) which parameterizes by construction. The audit is a grep-confirm, not remediation.
- **500 responses leaking stack traces:** The existing check-writing route already catches Anthropic errors with a friendly fallback. D-09/D-10 asks to confirm the same discipline applies to any other API route handlers (if any exist).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundaries | Custom `<ErrorBoundary>` class component wrapper | Next.js `error.tsx` convention | Built into the App Router — no library needed, zero boilerplate |
| 404 detection | Manual URL matching / try-catch | `not-found.tsx` + `notFound()` from `next/navigation` | Framework-native, works with static generation and dynamic routes |
| Input validation on API routes | Manual string checks / regex | Zod (already installed, already used in check-writing route) | Type-safe, composable, already in the codebase |
| Dependency scanning | Manual `npm audit` scripts | GitHub Dependabot | Runs in CI without any app-side code, sends PRs automatically |

**Key insight:** Every capability in this phase is either already implemented or handled by framework conventions. The planner should not introduce new libraries.

---

## Common Pitfalls

### Pitfall 1: error.tsx missing 'use client'
**What goes wrong:** Build error or silent failure — the `reset` function prop cannot cross the server/client boundary.
**Why it happens:** Developers forget that error boundaries are inherently client-side React.
**How to avoid:** Always start `error.tsx` and `global-error.tsx` with `'use client'` as the first line.
**Warning signs:** TypeScript or Next.js build error mentioning "functions cannot be passed from Server Components to Client Components."

### Pitfall 2: global-error.tsx not tested in development
**What goes wrong:** Developer tests the error page in `next dev` and sees the Next.js error overlay instead of the custom card — concludes it's broken.
**Why it happens:** By design, `global-error.tsx` is production-only.
**How to avoid:** Test with `next build && next start` or test `error.tsx` (the segment-level boundary) in dev mode as a proxy.
**Warning signs:** Custom card never appears in dev mode even when throwing deliberately.

### Pitfall 3: ErrorCard component using onClick in a server component
**What goes wrong:** RSC serialization error — functions (like `reset`) cannot be passed as props to server components.
**Why it happens:** Shared component trying to serve both the `reset` (client) and `href` (navigation) action patterns.
**How to avoid:** Mark the ErrorCard as `'use client'` since all three consumers (error.tsx, global-error.tsx, not-found.tsx) can use a client component.

### Pitfall 4: Dependabot YAML committed but GitHub Dependabot not enabled
**What goes wrong:** The `.github/dependabot.yml` file exists but Dependabot never runs — the repo setting may need enabling.
**Why it happens:** Some repositories have Dependabot disabled at the repo or org level.
**How to avoid:** After merging the YAML, verify in GitHub → Settings → Security → Code security and analysis → "Dependabot version updates" is enabled. Also trigger a manual check or wait for the first scheduled run.
**Warning signs:** No Dependabot PRs appear within the first week after merging the config.

### Pitfall 5: Supabase-down path not triggering error.tsx
**What goes wrong:** `createClient()` or `getUser()` throws, but the page shows a blank screen instead of the error card.
**Why it happens:** The throw happens inside a Server Component that is not wrapped by an `error.tsx` boundary (e.g., it throws in a layout, not a page).
**How to avoid:** Ensure the top-level `src/app/error.tsx` exists. Errors in `src/app/layout.tsx` require `src/app/global-error.tsx`. Add try/catch in critical Server Components (layout, dashboard page) to throw into the boundary explicitly.
**Warning signs:** Blank page in production when Supabase is unreachable.

---

## Code Examples

### error.tsx placement and full signature
```typescript
// src/app/error.tsx
// Source: https://nextjs.org/docs/app/getting-started/error-handling
'use client'

import ErrorCard from '@/components/ui/ErrorCard'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Do NOT render error.message — may contain server internals
  return (
    <ErrorCard
      heading="Something went wrong"
      body="We couldn't load this. Give it another try."
      action={{ label: 'Try again', onClick: reset }}
    />
  )
}
```

### global-error.tsx (must own html/body)
```typescript
// src/app/global-error.tsx
'use client'

import ErrorCard from '@/components/ui/ErrorCard'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorCard
          heading="Something went wrong"
          body="We couldn't load this. Give it another try."
          action={{ label: 'Try again', onClick: reset }}
        />
      </body>
    </html>
  )
}
```

### not-found.tsx (no props, server component)
```typescript
// src/app/not-found.tsx
// No 'use client' needed — this is a server component
import ErrorCard from '@/components/ui/ErrorCard'

export default function NotFound() {
  return (
    <ErrorCard
      heading="Page not found"
      body="That page wandered off. Let's get you back on track."
      action={{ label: 'Back to dashboard', href: '/dashboard' }}
    />
  )
}
```

### Dependabot YAML (D-06, D-07, D-08)
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
    open-pull-requests-limit: 5
```

### SQL audit grep command
```bash
# Confirm zero raw SQL strings — expected result: no output
grep -rn "\.rpc\|\.sql\|`SELECT\|`INSERT\|`UPDATE\|`DELETE\|query.*\`.*WHERE" \
  src/ --include="*.ts" --include="*.tsx"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based `<ErrorBoundary>` component (React 16) | `error.tsx` file convention (Next.js App Router) | Next.js 13+ | No wrapper component needed; file placement = scope |
| `pages/_error.js` (Pages Router) | `error.tsx` + `global-error.tsx` (App Router) | Next.js 13+ | Per-segment boundaries replace single global handler |
| `pages/404.js` (Pages Router) | `not-found.tsx` (App Router) | Next.js 13+ | `notFound()` callable from any server component |

---

## Existing Test Coverage — SEC-05 Gap Analysis

**Current state (verified by running `npx jest`):** 18 suites, 156 passing, 3 skipped, 6 seconds.

| SEC-05 Path | Test File | Coverage Status |
|-------------|-----------|-----------------|
| Login flow | `__tests__/auth/login.test.ts` | COVERED — signIn success, wrong password, role-based redirect, rate limit (4 tests) |
| Save-progress flow | `__tests__/lessons/actions.test.ts` | COVERED — upsert, auth guard, UUID validation, revalidatePath, user_id source (5 tests in `markSubComponentComplete` describe block) |
| Diagnostic-unlock flow | `__tests__/diagnostic/actions.test.ts` | COVERED — watermark advance via admin client verified in `submitDiagnosticAnswer` completion test and end-of-level passing test |

**Gap-fill needed:** None — all three paths have passing tests that assert the critical behaviors. The SEC-05 task in this phase is verification + documentation, not greenfield test writing. The planner may optionally add one smoke test asserting the diagnostic-unlock path produces `unlocked_through_level_number: 2` (this is already present in `actions.test.ts` line 158).

**Run command:** `npm test` — runs all 18 suites in ~6 seconds.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ErrorCard as `'use client'` is the simplest resolution for the onClick/href dual-action pattern | Architecture Patterns, Pattern 4 | Minor — could instead use two separate subcomponents (one server, one client); low risk either way |
| A2 | `.github/` directory does not exist yet | Dependabot pattern | None — creating it is always safe; the worst case is adding a directory that already exists |

---

## Open Questions

1. **Does the project use per-route `error.tsx` files (e.g., `src/app/lessons/error.tsx`) or just the root?**
   - What we know: Only `src/app/error.tsx` is specified in CONTEXT.md. DiagnosticGate lives under `/dashboard` and `/levels`.
   - What's unclear: If a lesson page throws (e.g., Supabase down for lesson data), `src/app/error.tsx` at the root catches it only if no segment-level boundary is closer.
   - Recommendation: A single root `src/app/error.tsx` is sufficient for the success criteria. Add segment-level boundaries only if the planner identifies a specific segment that needs different error copy.

2. **The `global-error.tsx` production-only behavior — how to verify before launch?**
   - What we know: It only fires in production builds.
   - Recommendation: Test with `npm run build && npm start` locally, deliberately throw in `layout.tsx`, confirm the card appears.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Jest, Next.js | Yes | confirmed (project runs) | — |
| Jest | SEC-05 test verification | Yes | 29.7.0 | — |
| GitHub repository | Dependabot (D-06) | Yes | — | — |
| `.github/` directory | dependabot.yml | No (needs creation) | — | Create it as part of this phase |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:**
- `.github/` directory — doesn't exist, created by the plan as part of adding `dependabot.yml`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.4.11 |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern="auth/login|lessons/actions|diagnostic/actions" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-05 (login) | signIn with valid creds redirects to /dashboard | unit | `npm test -- --testPathPattern="auth/login"` | Yes (`__tests__/auth/login.test.ts`) |
| SEC-05 (save-progress) | markSubComponentComplete upserts progress row | unit | `npm test -- --testPathPattern="lessons/actions"` | Yes (`__tests__/lessons/actions.test.ts`) |
| SEC-05 (diagnostic-unlock) | submitDiagnosticAnswer at 100% advances watermark via admin client | unit | `npm test -- --testPathPattern="diagnostic/actions"` | Yes (`__tests__/diagnostic/actions.test.ts`) |
| SEC-08 | Dependabot config exists and is valid YAML | manual | Review `.github/dependabot.yml` after merge | No (Wave 0 — create file) |
| D-09/D-10 | check-writing returns 400 on malformed input, no stack trace | unit | `npm test -- --testPathPattern="check-writing"` | Yes (`src/__tests__/api/check-writing.test.ts`) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="<relevant file>" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `.github/dependabot.yml` — does not exist; created in Wave 1
- [ ] `src/app/error.tsx` — does not exist; created in Wave 1
- [ ] `src/app/global-error.tsx` — does not exist; created in Wave 1
- [ ] `src/app/not-found.tsx` — does not exist; created in Wave 1
- [ ] `src/components/ui/ErrorCard.tsx` — does not exist; created in Wave 1

No new test files needed — existing test suite already covers SEC-05 paths.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Already implemented (Phase 2) |
| V3 Session Management | no | Already implemented (Supabase sessions, Phase 2) |
| V4 Access Control | no | RLS in place (Phase 2 + 3) |
| V5 Input Validation | yes | Zod (already in check-writing route); confirm no raw SQL in SQL audit |
| V6 Cryptography | no | No hand-rolled crypto |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via string concatenation | Tampering | Supabase query builder (parameterized by construction) — audit confirms absence |
| Server internals in error responses | Information Disclosure | Warm static copy only; never render `error.message` in client UI |
| Stack traces in 500 responses | Information Disclosure | catch-all in API route handlers returns generic friendly message (D-10) |
| Dependency supply chain vulnerability | Tampering | Dependabot (D-06/SEC-08) |

---

## Sources

### Primary (HIGH confidence)
- [CITED: https://nextjs.org/docs/app/getting-started/error-handling] — error.tsx and global-error.tsx props, 'use client' requirement, production-only global-error behavior
- [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/not-found] — not-found.tsx convention, no-props contract, notFound() integration
- [CITED: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configuring-dependabot-version-updates] — dependabot.yml schema, groups, schedule
- [CITED: https://docs.github.com/en/code-security/concepts/supply-chain-security/about-dependabot-security-updates] — security updates are always immediate regardless of schedule
- [VERIFIED: local package.json] — Next.js 16.2.9, React 19.2.4, Jest 29.7.0, ts-jest 29.4.11
- [VERIFIED: local codebase] — 18 test suites passing, zero raw SQL patterns, no existing error.tsx/not-found.tsx, no .github/dependabot.yml

### Secondary (MEDIUM confidence)
- [WebSearch verified] — error.tsx `{ error: Error & { digest?: string }, reset: () => void }` prop signature confirmed across multiple Next.js documentation references

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified from local package.json and running test suite
- Architecture: HIGH — Next.js error.tsx/global-error.tsx/not-found.tsx are stable, well-documented conventions cited from official docs
- Pitfalls: HIGH — confirmed from official Next.js docs (production-only global-error behavior, 'use client' requirement)
- Test coverage: HIGH — verified by actually running `npx jest` (156 passing, 18 suites)
- Dependabot YAML: HIGH — schema cited from official GitHub docs

**Research date:** 2026-06-28
**Valid until:** 2026-07-28 (stable domain — Next.js error file conventions are unlikely to change in 30 days)
