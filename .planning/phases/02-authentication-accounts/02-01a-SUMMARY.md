---
phase: 02-authentication-accounts
plan: 01a
subsystem: auth-foundation
tags: [supabase, auth, database, migration, typescript]
dependency_graph:
  requires: []
  provides:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - supabase/migrations/20260620_phase2_auth.sql
  affects:
    - Plan 02-01b (consumes client factories and migration for db push + proxy)
    - Plan 02-02 (consumes createClient/createAdminClient for auth actions)
    - Plan 02-03 (consumes profiles table schema)
    - Plan 02-04 (consumes login_attempts table + admin client)
tech_stack:
  added:
    - "@supabase/ssr@0.12.0"
    - "@supabase/supabase-js@2.108.2"
    - "bad-words@4.0.0"
    - "zod@4.4.3"
  patterns:
    - createBrowserClient for client components (publishable key only)
    - createServerClient with getAll/setAll cookie methods (setAll try/catch)
    - Service-role admin client with no-op cookie handlers (secret key, server-only)
    - RLS with auth.uid() subquery optimization
    - security definer + set search_path='' on trigger function
key_files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - supabase/migrations/20260620_phase2_auth.sql
  modified:
    - package.json (4 new runtime deps)
    - package-lock.json
decisions:
  - "Used NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (not legacy ANON_KEY) per RESEARCH.md Pattern 2 — clearer semantics, avoids stale naming"
  - "setAll in server.ts wrapped in try/catch — intentional: Server Components cannot write cookies directly; proxy handles the actual write in Plan 01b"
  - "login_attempts has zero RLS policies — accessible only via service_role admin client, preventing any client-side enumeration of auth attempts (T-02-05)"
  - "handle_new_user uses security definer + set search_path='' to prevent search_path injection attacks on the trigger function"
  - "No INSERT policy on profiles — trigger-only inserts prevent clients from creating arbitrary profiles for other users"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-21"
  tasks_completed: 3
  files_created: 4
  files_modified: 2
---

# Phase 02 Plan 01a: Auth Foundation (Static Artifacts) Summary

**One-liner:** Three Supabase client factories (browser/server/admin) enforcing the publishable/secret key split, plus a complete profiles + login_attempts migration with RLS, two policies, and the handle_new_user trigger — all typechecked and ready for Plan 01b to push live.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Verify Supabase env vars and project link | `9a095c3` | .env.local, .env.example |
| 2 | Install auth packages and Supabase client factories | `b455581` | package.json, src/lib/supabase/*.ts (3 files) |
| 3 | Write the database migration | `d249abe` | supabase/migrations/20260620_phase2_auth.sql |

---

## What Was Built

**Three Supabase client factories** (`src/lib/supabase/`):

- `client.ts` — `createBrowserClient` for `"use client"` components; uses only `NEXT_PUBLIC_*` keys
- `server.ts` — async `createServerClient` for Server Components and Server Actions; `getAll`/`setAll` cookie methods with `setAll` in `try/catch` (Server Components cannot write cookies — proxy handles writes in Plan 01b)
- `admin.ts` — service-role client using `SUPABASE_SECRET_KEY`; no-op cookie handlers; server-only (never imported from client code)

**Migration** (`supabase/migrations/20260620_phase2_auth.sql`):

- `public.profiles`: uuid PK → auth.users (cascade), username (unique, 3-20 chars, `^[a-zA-Z0-9_]+$`), role ('student'|'admin', default 'student'), deleted_at, created_at, updated_at
- RLS enabled on profiles; exactly two policies — select + update, both scoped to `(select auth.uid()) = id`; no insert policy (trigger-only)
- `handle_new_user()` trigger: `security definer set search_path = ''`, reads `raw_user_meta_data ->> 'username'`; fires `after insert on auth.users`
- `public.login_attempts`: bigserial PK, email, attempted_at, ip_address; RLS enabled with zero policies (service_role only)
- Indexes: `idx_profiles_username`, `idx_profiles_role`, `idx_login_attempts_email_time (email, attempted_at desc)`

---

## Deviations from Plan

None — plan executed exactly as written. `bad-words@4.0.0` has a `"type": "module"` / CJS dist inconsistency in its package.json but TypeScript and Next.js/webpack resolve it correctly. The `npx tsc --noEmit` verification passed cleanly.

---

## Threat Model Coverage

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-02-01 | Mitigated | `SUPABASE_SECRET_KEY` used only in `admin.ts` (server-only); `.env*` gitignored; client factories use only `NEXT_PUBLIC_*` |
| T-02-02 | Mitigated | RLS enabled on profiles; select + update policies scoped to `auth.uid() = id`; no insert policy (trigger-only) |
| T-02-04 | Mitigated | Migration SQL is static DDL; no string interpolation; application code uses SDK parameterized queries |
| T-02-05 | Mitigated | RLS enabled on login_attempts with zero policies — service_role only; clients cannot read auth attempt data |
| T-02-SC | Mitigated | All 4 packages verified legitimate pre-install; versions pinned in package.json |

---

## Known Stubs

None — this plan creates infrastructure only (factories + migration), no UI components.

---

## Self-Check: PASSED

- [x] `src/lib/supabase/client.ts` exists
- [x] `src/lib/supabase/server.ts` exists
- [x] `src/lib/supabase/admin.ts` exists
- [x] `supabase/migrations/20260620_phase2_auth.sql` exists
- [x] Commit `b455581` exists (Task 2)
- [x] Commit `d249abe` exists (Task 3)
- [x] `npx tsc --noEmit` exits 0
- [x] No `getSession`, `ANON_KEY`, or `auth-helpers` in `src/lib/supabase/`
- [x] Migration: 2 policies on profiles, 0 policies on login_attempts
