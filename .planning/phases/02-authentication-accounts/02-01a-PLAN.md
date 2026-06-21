---
phase: 02-authentication-accounts
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - .env.local
  - .env.example
  - package.json
  - src/lib/supabase/client.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/admin.ts
  - supabase/migrations/20260620_phase2_auth.sql
autonomous: false
requirements: [SEC-01, SEC-02, SEC-03]
user_setup:
  - service: supabase
    why: "Auth backend + Postgres database for profiles, RLS, and session management"
    env_vars:
      - name: NEXT_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard -> Project Settings -> Data API -> Project URL"
      - name: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        source: "Supabase Dashboard -> Project Settings -> API Keys -> Publishable key (client-safe)"
      - name: SUPABASE_SECRET_KEY
        source: "Supabase Dashboard -> Project Settings -> API Keys -> Secret key (server-only, never NEXT_PUBLIC)"
      - name: NEXT_PUBLIC_SITE_URL
        source: "http://localhost:3000 for local; production Vercel URL later (used for password-reset redirect)"
    dashboard_config:
      - task: "Set Auth password policy: minimum length 12, require digit (Auth -> Policies / Sign In Up -> Password Requirements)"
        location: "Supabase Dashboard -> Authentication -> Sign In / Up -> Password settings"
      - task: "Link the local project to the remote Supabase project for db push (supabase link --project-ref <ref>)"
        location: "Supabase CLI"

must_haves:
  truths:
    - "Supabase env vars are present and the dev server boots without missing-env errors"
    - "Three Supabase client factories (client/server/admin) exist, typecheck, and enforce the publishable/secret key split"
    - "The migration SQL file defines profiles + login_attempts with RLS, the two auth.uid()-scoped profiles policies, no login_attempts policy, and the handle_new_user trigger"
  artifacts:
    - path: "supabase/migrations/20260620_phase2_auth.sql"
      provides: "profiles + login_attempts tables, RLS policies, handle_new_user trigger, indexes"
      contains: "create table public.profiles"
    - path: "src/lib/supabase/server.ts"
      provides: "createServerClient factory for server components and actions"
      exports: ["createClient"]
    - path: "src/lib/supabase/client.ts"
      provides: "createBrowserClient factory for client components"
      exports: ["createClient"]
    - path: "src/lib/supabase/admin.ts"
      provides: "service-role admin client (server-only)"
      exports: ["createAdminClient"]
  key_links:
    - from: "supabase/migrations/20260620_phase2_auth.sql"
      to: "auth.users"
      via: "on_auth_user_created trigger calling handle_new_user"
      pattern: "on_auth_user_created"
    - from: "src/lib/supabase/admin.ts"
      to: "SUPABASE_SECRET_KEY"
      via: "createServerClient with secret key, server-only, no-op cookies"
      pattern: "SUPABASE_SECRET_KEY"
---

<objective>
Lay the static half of the authentication foundation: Supabase project wiring (env), the three Supabase client factories (client/server/admin), and the database migration SQL (profiles + login_attempts + RLS + signup trigger) authored as a file. This plan produces everything that can be created and typechecked WITHOUT touching the live database — Plan 02-01b then pushes the schema live, adds the proxy, and stands up the Jest harness.

Purpose: Splitting the foundation into a static-artifacts half (01a) and a live-wiring half (01b) keeps each plan at or under the 3-task / ~50% context target. 01a is the prerequisite spine: the migration must be authored and the clients must exist before they can be pushed or exercised.

Output: A bootable app with Supabase env configured, three client factories that typecheck and enforce the secret/publishable split, and a complete migration SQL file ready to push.
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

<interfaces>
<!-- Contracts this plan CREATES — Plan 01b and downstream plans 02/03/04 consume these. -->

src/lib/supabase/server.ts:
  export async function createClient(): Promise<SupabaseClient>   // cookie-bound, for Server Components + Server Actions

src/lib/supabase/client.ts:
  export function createClient(): SupabaseClient                  // browser, for "use client" components

src/lib/supabase/admin.ts:
  export function createAdminClient(): SupabaseClient             // SUPABASE_SECRET_KEY, server-only, bypasses RLS

DB schema (authored here, pushed live in Plan 01b):
  public.profiles(id uuid PK -> auth.users, username text unique, role text 'student'|'admin' default 'student', deleted_at timestamptz, created_at, updated_at)
  public.login_attempts(id bigserial PK, email text, attempted_at timestamptz default now(), ip_address text)
  trigger on_auth_user_created on auth.users -> handle_new_user() inserts profiles row from raw_user_meta_data->>'username'
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Verify Supabase env vars and project link</name>
  <read_first>
    - .planning/phases/02-authentication-accounts/02-RESEARCH.md (Environment Availability section — required env vars and naming)
    - .gitignore (confirms .env* is already ignored — secrets never committed)
    - CLAUDE.md (SEC-01: no secrets in client code; only NEXT_PUBLIC_* keys are client-safe)
  </read_first>
  <what-built>
    This is a human-action gate because Supabase secret values cannot be generated by Claude — they come from the user's Supabase dashboard. Claude will create `.env.example` (committed, no secrets) and `.env.local` (gitignored) with placeholder structure, but the human must paste real values and confirm the project is linked for `supabase db push` (which runs in Plan 02-01b).
  </what-built>
  <how-to-verify>
    1. Create a Supabase project at supabase.com if one does not exist.
    2. Copy `.env.example` to `.env.local` and fill in real values:
       - NEXT_PUBLIC_SUPABASE_URL (Project Settings -> Data API -> Project URL)
       - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Project Settings -> API Keys -> Publishable key)
       - SUPABASE_SECRET_KEY (Project Settings -> API Keys -> Secret key)
       - NEXT_PUBLIC_SITE_URL=http://localhost:3000
    3. In the Supabase dashboard, set the password policy to minimum 12 characters and require a digit (Authentication -> Sign In / Up -> Password settings) per D-03.
    4. Link the CLI to the remote project: `npx supabase link --project-ref <your-project-ref>` (needed for Plan 02-01b's db push).
    5. Confirm `.env.local` is present and `git status` does NOT list it (it is gitignored).
  </how-to-verify>
  <action>
    Create `.env.example` (committed) listing the four required variable NAMES with empty/placeholder values and a comment marking SUPABASE_SECRET_KEY as server-only. Create `.env.local` (gitignored) with the same four keys. Use the exact names NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, NEXT_PUBLIC_SITE_URL. Do NOT use the legacy name NEXT_PUBLIC_SUPABASE_ANON_KEY. Then pause for the human to fill real values and link the project.
  </action>
  <verify>
    <automated>test -f .env.local && grep -q NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env.local && ! grep -q NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local && echo OK</automated>
  </verify>
  <resume-signal>Type "approved" once .env.local has real values and the Supabase project is linked</resume-signal>
  <acceptance_criteria>
    - `.env.local` exists and contains NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, NEXT_PUBLIC_SITE_URL
    - `.env.example` is committed and lists the same four keys with no real secret values
    - `git status` does not show `.env.local` (gitignored)
    - The string NEXT_PUBLIC_SUPABASE_ANON_KEY appears in zero files
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Install auth packages and Supabase client factories</name>
  <read_first>
    - src/components/theme-provider.tsx (analog: thin third-party-client wrapper export pattern)
    - .planning/phases/02-authentication-accounts/02-PATTERNS.md (sections for client.ts, server.ts, admin.ts — exact patterns and the try/catch-on-setAll constraint)
    - .planning/phases/02-authentication-accounts/02-RESEARCH.md (Pattern 2 Server Client, client.ts, admin.ts; Standard Stack versions)
    - package.json (current deps — confirm none of the new packages are present yet)
  </read_first>
  <action>
    Install runtime deps `@supabase/ssr@0.12.0`, `@supabase/supabase-js@2.108.2`, `bad-words@4.0.0`, `zod` via npm. Create three factory modules under `src/lib/supabase/`: `server.ts` exporting an async `createClient()` that calls `createServerClient` with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and awaits `cookies()` from `next/headers`, implementing only `getAll`/`setAll` with the setAll body wrapped in try/catch (Server Components cannot write cookies — proxy handles it; do not remove the catch). `client.ts` exporting a synchronous `createClient()` calling `createBrowserClient` with the same two NEXT_PUBLIC vars. `admin.ts` exporting `createAdminClient()` calling `createServerClient` with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY and no-op cookie handlers (`getAll: () => []`, `setAll: () => {}`). Never use get/set/remove cookie methods (only getAll/setAll). Never add "use client" to admin.ts or server.ts.
  </action>
  <verify>
    <automated>node -e "require('@supabase/ssr');require('bad-words');require('zod')" && npx tsc --noEmit && grep -q createAdminClient src/lib/supabase/admin.ts && ! grep -rq "getSession\|ANON_KEY\|auth-helpers" src/lib/supabase/ && echo OK</automated>
  </verify>
  <done>Three factory files exist and typecheck; packages installed at pinned versions; no anon-key, getSession, or auth-helpers references in src/lib/supabase</done>
  <acceptance_criteria>
    - `package.json` lists @supabase/ssr, @supabase/supabase-js, bad-words, zod as dependencies
    - `src/lib/supabase/server.ts` exports async `createClient`, awaits `cookies()`, implements getAll + setAll (setAll in try/catch)
    - `src/lib/supabase/client.ts` exports `createClient` using createBrowserClient
    - `src/lib/supabase/admin.ts` exports `createAdminClient` using SUPABASE_SECRET_KEY and no-op cookie handlers
    - `npx tsc --noEmit` exits 0
    - grep finds zero occurrences of getSession, ANON_KEY, or auth-helpers under src/lib/supabase/
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Write the database migration (profiles + login_attempts + RLS + trigger)</name>
  <read_first>
    - .planning/phases/02-authentication-accounts/02-PATTERNS.md (migration section — two-table schema, RLS pattern, trigger pattern, login_attempts no-policy rule)
    - .planning/phases/02-authentication-accounts/02-RESEARCH.md (Pattern 4 profiles migration + Pattern 5 login_attempts; lines 390-470)
    - CLAUDE.md (SEC-02 RLS required on every user table; SEC-03 parameterized queries)
  </read_first>
  <action>
    Create `supabase/migrations/20260620_phase2_auth.sql` defining: (1) `public.profiles` with columns id uuid PK referencing auth.users on delete cascade, username text unique not null with a username_length check (3-20 chars) and username_format check (`^[a-zA-Z0-9_]+$`), role text not null default 'student' with check role in ('student','admin'), deleted_at timestamptz, created_at and updated_at timestamptz not null default now(). (2) Grants: select to anon; select/insert/update to authenticated; all to service_role. (3) Enable RLS on profiles and add exactly two policies — "Users can view own profile" (select, to authenticated, using (select auth.uid()) = id) and "Users can update own profile" (update, to authenticated, using and with check (select auth.uid()) = id). Add NO insert policy (the trigger owns inserts). (4) Indexes idx_profiles_username and idx_profiles_role. (5) `handle_new_user()` function: language plpgsql, security definer, set search_path = '', inserts into public.profiles (id, username) from new.id and new.raw_user_meta_data ->> 'username'. (6) Trigger on_auth_user_created after insert on auth.users for each row. (7) `public.login_attempts` table (id bigserial PK, email text not null, attempted_at timestamptz default now(), ip_address text) with index idx_login_attempts_email_time on (email, attempted_at desc), RLS enabled, and ZERO policies (service-role-only access).
  </action>
  <verify>
    <automated>grep -q "create table public.profiles" supabase/migrations/20260620_phase2_auth.sql && grep -q "on_auth_user_created" supabase/migrations/20260620_phase2_auth.sql && grep -q "enable row level security" supabase/migrations/20260620_phase2_auth.sql && grep -cq "create policy" supabase/migrations/20260620_phase2_auth.sql && echo OK</automated>
  </verify>
  <done>Migration file defines both tables, RLS on both, two profiles policies, no login_attempts policy, the trigger, and indexes</done>
  <acceptance_criteria>
    - File contains `create table public.profiles` and `create table public.login_attempts`
    - profiles has username unique constraint, username_format check `^[a-zA-Z0-9_]+$`, and role check in ('student','admin')
    - Exactly two policies on profiles (select + update), both scoped to `(select auth.uid()) = id`; no insert policy
    - `handle_new_user` is `security definer set search_path = ''` and reads `raw_user_meta_data ->> 'username'`
    - Trigger `on_auth_user_created after insert on auth.users` exists
    - login_attempts has RLS enabled and zero `create policy` statements targeting it
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| application -> Supabase Postgres | Queries cross into the database; RLS is the isolation guard |
| env (.env.local) -> client bundle | Secret key must never cross into NEXT_PUBLIC / client code |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Information Disclosure | SUPABASE_SECRET_KEY in .env.local | mitigate | Secret used only in admin.ts (server-only); .env* gitignored; client factories use only NEXT_PUBLIC_* publishable key (SEC-01) |
| T-02-02 | Elevation of Privilege | profiles table cross-user reads | mitigate | RLS enabled with select/update policies scoped to `(select auth.uid()) = id`; no insert policy (trigger-only) (SEC-02) |
| T-02-04 | Tampering | Raw SQL string building | accept/mitigate | Only the migration file contains SQL (static DDL, no interpolation); application code uses Supabase SDK parameterized queries exclusively (SEC-03) |
| T-02-05 | Information Disclosure | login_attempts table readable by clients | mitigate | RLS enabled with zero policies → accessible only via service_role admin client (SEC-04, enforced live in Plan 01b) |
| T-02-SC | Tampering | npm installs (@supabase/ssr, supabase-js, bad-words, zod) | mitigate | RESEARCH Package Legitimacy Audit rated all packages [OK] with no postinstall network scripts; versions pinned and verified against npm registry 2026-06-20 |
</threat_model>

<verification>
- `npx tsc --noEmit` exits 0
- Three client factories exist and enforce the secret/publishable split
- Migration SQL file authored with both tables, RLS, two profiles policies, no login_attempts policy, and the trigger
- No NEXT_PUBLIC_SUPABASE_ANON_KEY, getSession, or auth-helpers anywhere in src/lib/supabase
</verification>

<success_criteria>
- Supabase env configured; dev server boots
- Three client factories typecheck and enforce the secret/publishable split
- Migration SQL authored (profiles + login_attempts + RLS + trigger), ready for Plan 01b to push live
</success_criteria>

<output>
Create `.planning/phases/02-authentication-accounts/02-01a-SUMMARY.md` when done
</output>
</content>
</invoke>
