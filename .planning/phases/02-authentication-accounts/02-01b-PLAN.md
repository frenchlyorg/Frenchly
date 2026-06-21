---
phase: 02-authentication-accounts
plan: 01b
type: execute
wave: 1
depends_on: ["02-01a"]
files_modified:
  - src/app/proxy.ts
  - jest.config.ts
  - jest.setup.ts
  - package.json
  - __tests__/auth/signup.test.ts
  - __tests__/auth/login.test.ts
  - __tests__/auth/errors.test.ts
  - __tests__/auth/logout.test.ts
  - __tests__/auth/delete.test.ts
  - __tests__/auth/ratelimit.test.ts
  - __tests__/middleware.test.ts
  - __tests__/rls.test.ts
autonomous: false
requirements: [SEC-02, SEC-04]
user_setup:
  - service: supabase
    why: "Remote project must be linked so `supabase db push` can apply the migration authored in Plan 02-01a"
    dashboard_config:
      - task: "Confirm the local project is linked to the remote Supabase project (supabase link --project-ref <ref>) — done in Plan 02-01a Task 1"
        location: "Supabase CLI"

must_haves:
  truths:
    - "The 20260620_phase2_auth migration is applied to the live database; profiles + login_attempts exist with RLS"
    - "A new auth.users row automatically produces a public.profiles row via the handle_new_user trigger"
    - "proxy.ts refreshes the session on every request and redirects unauthenticated users away from /dashboard, /admin, /account"
    - "Jest runs and the eight auth test scaffolds exist (failing or todo, not absent)"
  artifacts:
    - path: "src/app/proxy.ts"
      provides: "session refresh + protected-route redirect"
      exports: ["proxy", "config"]
    - path: "jest.config.ts"
      provides: "Jest test runner configuration"
    - path: "__tests__/rls.test.ts"
      provides: "RLS cross-user isolation test scaffold (fleshed out in Plan 04)"
    - path: "__tests__/middleware.test.ts"
      provides: "proxy redirect test scaffold (fleshed out in Plan 04)"
  key_links:
    - from: "src/app/proxy.ts"
      to: "supabase.auth.getUser"
      via: "createServerClient + getUser (NOT getSession)"
      pattern: "auth\\.getUser"
    - from: "supabase migration list"
      to: "20260620_phase2_auth"
      via: "supabase db push applies the migration to the remote DB"
      pattern: "20260620_phase2_auth"
---

<objective>
Wire the authentication foundation live: push the Plan 02-01a migration to the remote Supabase database, create the Next.js 16 proxy.ts for session refresh and route protection, and stand up the Jest harness with the eight auth test scaffolds every later plan verifies against.

Purpose: Plan 02-01a authored the migration and clients but touched no live state. This plan makes the schema real (db push), adds the session/route-protection spine (proxy), and creates the never-absent test harness so the feature slices (Plans 02, 03, 04) can be thin and verifiable.

Output: A live database with the schema applied and the signup trigger active, a working proxy guarding the protected routes, and a green-or-todo (never-absent) Jest harness with all eight scaffold files.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@CLAUDE.md
@.planning/phases/02-authentication-accounts/02-CONTEXT.md
@.planning/phases/02-authentication-accounts/02-RESEARCH.md
@.planning/phases/02-authentication-accounts/02-PATTERNS.md
@.planning/phases/02-authentication-accounts/02-VALIDATION.md
@.planning/phases/02-authentication-accounts/02-01a-SUMMARY.md

<interfaces>
<!-- Contracts from Plan 02-01a this plan consumes, and contracts this plan CREATES for downstream plans. -->

From Plan 02-01a:
  supabase/migrations/20260620_phase2_auth.sql  // the migration to push live
  src/lib/supabase/server.ts: export async function createClient(): Promise<SupabaseClient>

This plan creates:
src/app/proxy.ts:
  export async function proxy(request): Promise<NextResponse>   // session refresh + protected-route redirect
  export const config                                           // matcher excluding static assets

Test scaffolds (todo placeholders, fleshed out by Plans 02/03/04):
  __tests__/auth/{signup,login,errors,logout,delete,ratelimit}.test.ts
  __tests__/middleware.test.ts, __tests__/rls.test.ts
</interfaces>
</context>

<tasks>

<task type="auto" gate="blocking">
  <name>Task 1: [BLOCKING] Push schema to the live Supabase database</name>
  <read_first>
    - supabase/migrations/20260620_phase2_auth.sql (the migration produced in Plan 02-01a Task 3 — must exist and be complete first)
    - .planning/phases/02-authentication-accounts/02-RESEARCH.md (Supabase project must be configured/linked — Environment Availability)
    - .planning/phases/02-authentication-accounts/02-01a-SUMMARY.md (confirms the migration file and the project link from 01a)
  </read_first>
  <action>
    Run `supabase db push` (fall back to `npx supabase db push` if the CLI is not globally installed) to apply `20260620_phase2_auth.sql` to the linked remote database. This MUST run after Plan 02-01a (migration written + project linked) and before any verification that depends on live tables. The phase cannot pass verification without it — build and tsc pass without the push because types come from config, not the live DB, producing a false-positive. If the push requires an interactive confirmation prompt that cannot be suppressed, stop and surface it for manual run (this plan is autonomous:false to allow that).
  </action>
  <verify>
    <automated>npx supabase migration list 2>/dev/null | grep -q 20260620_phase2_auth && echo PUSHED || echo "MANUAL: run 'supabase db push' and confirm profiles + login_attempts exist in the dashboard"</automated>
  </verify>
  <done>The migration appears as applied in `supabase migration list`; profiles and login_attempts tables are visible in the Supabase dashboard Table Editor</done>
  <acceptance_criteria>
    - `supabase db push` (or npx equivalent) completed without error
    - `supabase migration list` shows 20260620_phase2_auth as applied to remote
    - profiles and login_attempts tables exist in the live database (visible in dashboard)
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Create proxy.ts (session refresh + route protection)</name>
  <read_first>
    - .planning/phases/02-authentication-accounts/02-PATTERNS.md (proxy.ts section — full pattern, the two-forEach setAll requirement, anti-patterns table)
    - .planning/phases/02-authentication-accounts/02-RESEARCH.md (Pattern 1 proxy.ts lines 210-273; Pitfalls 1, 2, 3 about middleware rename, getUser, setAll)
    - .planning/phases/02-authentication-accounts/02-CONTEXT.md (D-09: unauthenticated -> /login?next=<original>)
    - src/lib/supabase/server.ts (the server factory pattern proxy mirrors for its createServerClient call)
  </read_first>
  <action>
    Create `src/app/proxy.ts` (NOT src/middleware.ts) exporting an async function named `proxy` (NOT middleware) and a `config` with the matcher excluding _next/static, _next/image, favicon.ico, and image extensions. Inside: build a mutable supabaseResponse via NextResponse.next({ request }); construct createServerClient with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and a cookies object implementing getAll (returns request.cookies.getAll()) and setAll (TWO forEach passes — first request.cookies.set for each, then reassign supabaseResponse = NextResponse.next({ request }), then supabaseResponse.cookies.set with options for each; missing either pass breaks refresh silently). Call `await supabase.auth.getUser()` (NEVER getSession). Define protectedPaths = ['/dashboard','/admin','/account']; if no user and pathname startsWith any protected path, redirect to a /login URL with searchParam next set to the original pathname (D-09). Return supabaseResponse otherwise. Do not put the admin-role DB lookup here (that happens in the signIn action per RESEARCH Open Question 1, RESOLVED).
  </action>
  <verify>
    <automated>grep -q "export async function proxy" src/app/proxy.ts && grep -q "auth.getUser" src/app/proxy.ts && ! grep -q "getSession\|export function middleware\|export async function middleware" src/app/proxy.ts && test ! -f src/middleware.ts && npx tsc --noEmit && echo OK</automated>
  </verify>
  <done>proxy.ts exports proxy + config, uses getUser, protects the three paths with next-param redirect, typechecks; no middleware.ts exists</done>
  <acceptance_criteria>
    - `src/app/proxy.ts` exists; `src/middleware.ts` does not
    - Exports `proxy` (async) and `config` with a matcher
    - Calls `auth.getUser()`; never calls `getSession()`
    - setAll has two forEach passes (request.cookies + supabaseResponse.cookies)
    - Unauthenticated request to a protected path redirects to /login with a `next` search param
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Install Jest and create the auth test scaffolds (Nyquist Wave 0)</name>
  <read_first>
    - .planning/phases/02-authentication-accounts/02-VALIDATION.md (Test Infrastructure, Wave 0 Requirements, Per-Task Verification Map — the exact test file paths and run commands every later task uses)
    - package.json (devDeps — confirm jest not yet present)
    - tsconfig.json (TS config the ts-jest transform must respect)
  </read_first>
  <action>
    Install devDeps `jest@29`, `ts-jest`, `@types/jest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`. Create `jest.config.ts` using the ts-jest preset with testEnvironment jsdom, a setupFilesAfterEnv pointing at `jest.setup.ts`, and moduleNameMapper for the `@/` -> `src/` alias. Create `jest.setup.ts` importing `@testing-library/jest-dom`. Add an npm script `"test": "jest"`. Create the eight scaffold test files exactly as named in 02-VALIDATION.md: `__tests__/auth/signup.test.ts`, `__tests__/auth/login.test.ts`, `__tests__/auth/errors.test.ts`, `__tests__/auth/logout.test.ts`, `__tests__/auth/delete.test.ts`, `__tests__/auth/ratelimit.test.ts`, `__tests__/middleware.test.ts`, `__tests__/rls.test.ts`. Each scaffold uses `test.todo(...)` describing the requirement it will cover (e.g. signup.test.ts -> `test.todo('signUp creates a profiles row with username and student role (AUTH-01)')`) so the file is present and the suite passes without false greens. Do NOT use watch-mode flags anywhere.
  </action>
  <verify>
    <automated>npx jest --passWithNoTests 2>&1 | tail -5 && test -f __tests__/rls.test.ts && test -f __tests__/auth/ratelimit.test.ts && grep -q '"test"' package.json && echo OK</automated>
  </verify>
  <done>Jest runs green via `npx jest`; all eight scaffold files exist with test.todo placeholders; @/ alias resolves; no watch flags</done>
  <acceptance_criteria>
    - `npx jest --passWithNoTests` exits 0
    - All eight files from 02-VALIDATION.md Wave 0 exist
    - `jest.config.ts` maps `@/` to `src/` and uses jsdom environment
    - `package.json` has a `test` script with no `--watch` flag
    - Each scaffold contains at least one `test.todo` naming its requirement ID
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> proxy | Untrusted cookies cross into server session refresh |
| unauthenticated request -> protected paths | proxy redirect boundary |
| application -> Supabase Postgres | db push applies DDL; RLS becomes live isolation guard |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-03 | Spoofing | Forged session cookie in proxy.ts | mitigate | proxy calls `getUser()` (server round-trip verification), never `getSession()` (unverified cookie read) |
| T-02-05 | Information Disclosure | login_attempts table readable by clients | mitigate | RLS enabled with zero policies (live after db push) → accessible only via service_role admin client (SEC-04) |
| T-02-02 | Elevation of Privilege | profiles RLS not actually live | mitigate | db push applies the RLS policies authored in 01a to the remote DB; verified via migration list (SEC-02) |
| T-02-SC | Tampering | npm installs (jest, ts-jest, @testing-library/*) | mitigate | RESEARCH Package Legitimacy Audit rated all packages [OK] with no postinstall network scripts; versions pinned and verified against npm registry 2026-06-20 |
</threat_model>

<verification>
- `npx tsc --noEmit` exits 0
- `npx jest --passWithNoTests` exits 0
- `supabase migration list` shows 20260620_phase2_auth applied
- profiles + login_attempts visible in Supabase dashboard
- `src/middleware.ts` does not exist; `src/app/proxy.ts` exports `proxy`
</verification>

<success_criteria>
- Schema pushed live with RLS on both tables and the signup trigger active
- proxy.ts refreshes sessions via getUser and guards /dashboard, /admin, /account
- Jest harness green with all eight scaffold files present
</success_criteria>

<output>
Create `.planning/phases/02-authentication-accounts/02-01b-SUMMARY.md` when done
</output>
</content>
