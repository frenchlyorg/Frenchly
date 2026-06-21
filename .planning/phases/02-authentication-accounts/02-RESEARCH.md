# Phase 2: Authentication & Accounts — Research

**Researched:** 2026-06-20
**Domain:** Supabase Auth + Next.js 16 App Router + RLS + TypeScript
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: No email verification required. Sign up → /dashboard immediately.
- D-02: Sign-up fields: email + password + username (all required).
- D-03: Password minimum 12 characters + at least one number.
- D-04: Password reset in scope. Uses `supabase.auth.resetPasswordForEmail()`. Supabase sends email; user clicks link and sets new password.
- D-05: Username rules: letters, numbers, underscores only. Min 3, max 20 chars. Profanity filter via `bad-words` npm package + custom bypass list. Uniqueness enforced via DB unique constraint.
- D-06: After sign-up → /dashboard.
- D-07: After login → /dashboard.
- D-08: After logout → / (home page).
- D-09: Unauthenticated access to protected routes → redirect /login. Post-login redirects to originally-requested page.
- D-10: Logged-in nav shows username + "Log out" link. No avatar in Phase 2.
- D-11: Auth errors inline under each field.
- D-12: Warm, encouraging error tone.
- D-13: Vague login error: "Email or password incorrect."
- D-14: Account deletion confirmation: type "delete" in input. Button disabled until match.
- D-15: Soft-delete: set `deleted_at` on user record + anonymize PII. Lesson progress rows orphaned. Hard purge job Phase 12 (GDPR Article 17 compliance).
- D-16: Admin uses same /login form. Server detects `role='admin'` and redirects to /admin.
- D-17: Phase 2 admin scope: `role` field in profiles + protected /admin stub.
- D-18: Admin assigned manually in DB by developer.
- D-19: 5 failed login attempts → 15-min lockout, enforced server-side.

### Claude's Discretion
- Rate limiting implementation approach (given no Redis).
- Admin role storage: DB profiles table field vs custom JWT claim.
- Username pre-check timing (before or inline with signup).

### Deferred Ideas (OUT OF SCOPE)
- OAuth / social login
- Avatar / profile photo (Phase 9)
- Admin content management UI (Phase 7+)
- Email verification
- Hard purge job for deleted accounts (Phase 12)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create an account with email, username, and password | profiles table + handle_new_user trigger + signUp() with username in user_metadata |
| AUTH-02 | User can log in and remain logged in across sessions (persistent session) | @supabase/ssr cookie-based session + proxy.ts session refresh |
| AUTH-03 | User can log out from any page | signOut() in Server Action or Route Handler; redirect to / |
| AUTH-04 | User can delete their account and all associated data from settings | soft-delete via admin.deleteUser(id, shouldSoftDelete=true) + PII anonymization server action |
| AUTH-05 | Admin/editor role exists with ability to manage lesson content via database | `role` column in profiles + /admin protected route stub |
| SEC-01 | No API keys, tokens, or secrets in front-end code — server-side env vars only | SUPABASE_SECRET_KEY only in Server Actions; NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY safe for client |
| SEC-02 | Supabase RLS ensures students read/write only their own data | RLS on profiles + all future user tables using auth.uid() |
| SEC-03 | Parameterized queries only — no raw SQL string building | Supabase SDK uses parameterized queries by default; no raw SQL in application code |
| SEC-04 | Rate limiting on authentication attempts | Server Action rate limiting using Supabase login_attempts table (no Redis required) |
</phase_requirements>

---

## Summary

Phase 2 implements the full Supabase Auth integration for a Next.js 16 App Router application. The primary technical challenge is correctly wiring `@supabase/ssr` with Next.js 16's `proxy.ts` (formerly `middleware.ts` — renamed in Next.js 16.0.0) for cookie-based session management. Every other auth operation — sign up, login, logout, password reset, deletion — is a straightforward Server Action calling the Supabase JS client.

The most important architectural decision is the **profiles table pattern**: a `public.profiles` table with a foreign key to `auth.users`, populated by a `handle_new_user` PostgreSQL trigger on every signup. This table holds username, role, and soft-delete state. It is the single source of truth for application-layer user data. RLS is enabled on it from day one and must be enabled on every user data table created in this or future phases.

Rate limiting without Redis is achievable using a `login_attempts` Postgres table — a server action records failed attempts and counts rows in the last 15 minutes before each login. This avoids introducing an external dependency. For a project at Frenchly's scale (educational app, not a high-volume API), this is sufficient.

**Primary recommendation:** Use `@supabase/ssr 0.12.0` + `@supabase/supabase-js 2.108.2`. Place all auth logic in Server Actions. Use `proxy.ts` (not `middleware.ts`) for session refresh and route protection. Store username/role in `public.profiles`, not in `raw_user_meta_data`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session token refresh | Proxy (proxy.ts, server edge) | — | Server Components can't write cookies; proxy must refresh before page renders |
| Route protection (redirect) | Proxy (proxy.ts) | Server Component (double-check) | Middleware-level catch before SSR rendering; SC check as defense-in-depth |
| Sign-up / login / logout forms | Browser (Client Component) | Server Action | Forms need interactivity; submission handled in Server Actions |
| Auth mutations (signUp, signIn, signOut) | API / Server Action | — | Never call auth mutations from Client Components directly |
| Password reset trigger | Server Action | — | Email dispatch is server-only |
| Account deletion | Server Action | — | Requires service-role key (secret); must be server-side only (SEC-01) |
| Username uniqueness check | Database (unique constraint) | Server Action (pre-check) | DB is authoritative; server action can pre-check for friendly error UX |
| Rate limiting (login lockout) | Server Action | Database (login_attempts table) | Serverless — no shared in-memory state; Postgres table is the shared store |
| Admin role detection | Database (profiles.role) | Proxy (post-login redirect) | Role stored in DB; proxy reads it to route to /admin vs /dashboard |
| RLS enforcement | Database | — | Postgres enforces per-user isolation automatically once policies are set |
| Nav auth state display | Browser (Client Component) | Server Component (initial render) | Nav is already "use client"; reads session from browser client |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | 0.12.0 | Cookie-based auth for SSR — createBrowserClient + createServerClient | Official Supabase package replacing all `@supabase/auth-helpers-*` packages |
| `@supabase/supabase-js` | 2.108.2 | Supabase JS client — database, auth, storage | Required peer; the SSR package wraps it |
| `bad-words` | 4.0.0 | Profanity filter for username validation (D-05) | Stable, no postinstall scripts, 10+ years on npm |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | latest | Runtime schema validation on Server Actions | Validate all form inputs before auth calls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Postgres `login_attempts` table for rate limiting | `@upstash/ratelimit` + Upstash Redis | Redis is more robust at scale, but introduces a paid external service dependency; Postgres table is sufficient at Frenchly's scale |
| DB `profiles.role` for admin | Custom JWT claim via custom access token hook | JWT claims avoid a DB lookup on every auth check but add setup complexity; DB lookup via `profiles` is simpler, correct, and suffices for v1 |

**Installation:**
```bash
npm install @supabase/ssr @supabase/supabase-js bad-words zod
```

**Version verification:** Confirmed against npm registry on 2026-06-20.
- `@supabase/ssr`: 0.12.0 (published 2026-06-09) [VERIFIED: npm registry]
- `@supabase/supabase-js`: 2.108.2 (current latest) [VERIFIED: npm registry]
- `bad-words`: 4.0.0 (created 2013, last modified 2024-08-18, repository: github.com/web-mech/badwords) [VERIFIED: npm registry]

---

## Package Legitimacy Audit

| Package | Registry | Age | slopcheck | Postinstall | Disposition |
|---------|----------|-----|-----------|-------------|-------------|
| `@supabase/ssr` | npm | 3 yrs (Sep 2023) | [OK] | None | Approved |
| `@supabase/supabase-js` | npm | 5+ yrs | [OK] | None | Approved |
| `bad-words` | npm | 12+ yrs (Nov 2013) | [OK] | None — `prepare` script only runs husky+tsc, no network access | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client)
    │
    │  Form submit (email, password, username)
    ▼
Server Action  ──► Supabase Auth API
    │                  │
    │          signUp() / signInWithPassword()
    │                  │
    │          auth.users (managed by Supabase)
    │                  │
    │          on_auth_user_created trigger
    │                  ▼
    │          public.profiles (id, username, role, deleted_at, ...)
    │
    │  [Login success]
    ▼
proxy.ts (runs every request)
    │
    │  createServerClient → supabase.auth.getUser()
    │  [refreshes cookie, detects role]
    │
    ├──► Unauthenticated → redirect /login?next=<original>
    ├──► role='admin'    → redirect /admin
    └──► role='student'  → pass through to /dashboard

Server Component (page render)
    │
    │  createClient() → supabase.auth.getUser()
    │  [reads profiles.username for display]
    ▼
Client Component (Nav)
    │
    │  createBrowserClient() — reads session from cookie
    │  Conditionally renders: "username + Log out" vs "Log in"
```

### Recommended Project Structure
```
src/
├── lib/
│   └── supabase/
│       ├── client.ts        # createBrowserClient (client components)
│       └── server.ts        # createServerClient (server components, route handlers)
├── app/
│   ├── proxy.ts             # Session refresh + route protection (NOT middleware.ts)
│   ├── login/
│   │   └── page.tsx         # Login form (client component)
│   ├── signup/
│   │   └── page.tsx         # Sign-up form (client component)
│   ├── auth/
│   │   ├── actions.ts       # Server Actions: signUp, signIn, signOut, resetPassword, deleteAccount
│   │   └── callback/
│   │       └── route.ts     # Auth callback handler (password reset redirect)
│   ├── dashboard/
│   │   └── page.tsx         # Protected stub — checks auth, shows username
│   ├── admin/
│   │   └── page.tsx         # Admin-only protected stub
│   └── account/
│       └── page.tsx         # Account settings: password change, delete account
├── components/
│   └── nav.tsx              # Updated: reads auth state, shows username/logout
└── supabase/
    └── migrations/
        └── 20260620_phase2_auth.sql  # profiles table + RLS + trigger + indexes
```

### Pattern 1: proxy.ts Setup (Next.js 16)

**What:** Session refresh on every request + route protection redirect.
**When to use:** Every Next.js 16 + Supabase project — required for cookie refresh.

**Critical:** This file is `src/app/proxy.ts`, NOT `src/middleware.ts`. Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The exported function is named `proxy`, not `middleware`. [VERIFIED: nextjs.org/blog/next-16]

```typescript
// src/app/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // MUST call getUser() — triggers token refresh and writes updated cookie
  // NEVER use getSession() here — it doesn't verify against auth server
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect routes
  const protectedPaths = ['/dashboard', '/admin', '/account']
  const isProtectedRoute = protectedPaths.some(p => pathname.startsWith(p))

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin route guard — read role from profiles (or check via getClaims)
  // Role check: done in /admin page.tsx server component for simplicity in Phase 2

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Server Client Setup

```typescript
// src/lib/supabase/server.ts
// Source: supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — proxy handles the actual write
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/client.ts
// Source: supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Pattern 3: Sign-Up Server Action with Username

```typescript
// src/app/auth/actions.ts (excerpt)
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Filter from 'bad-words'

const filter = new Filter()
// Add bypass patterns to custom list
filter.addWords('nigha', 'sh1tter', 'b1tch' /* ... */)

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // 1. Validate username format
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernamePattern.test(username)) {
    return { error: 'username', message: 'Username must be 3–20 characters: letters, numbers, underscores only.' }
  }

  // 2. Profanity check
  if (filter.isProfane(username)) {
    return { error: 'username', message: "That username isn't available. Try something else." }
  }

  // 3. Password strength check (client-side pre-check; Supabase also enforces)
  if (password.length < 12 || !/\d/.test(password)) {
    return { error: 'password', message: 'Make it at least 12 characters with a number — your account will thank you.' }
  }

  // 4. Pre-check username uniqueness for friendly error
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'username', message: 'That username is gone — try adding your initial or a number.' }
  }

  // 5. Create auth user — username stored in user_metadata, trigger writes to profiles
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'email', message: "Hmm, that email's taken — already a Frenchly member?" }
    }
    return { error: 'general', message: 'Something went wrong. Please try again.' }
  }

  redirect('/dashboard')
}
```

### Pattern 4: profiles Table Migration

```sql
-- supabase/migrations/20260620_phase2_auth.sql

-- 1. Profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text unique not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id),
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

-- 2. Grant privileges
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- 3. Enable RLS
alter table public.profiles enable row level security;

-- 4. RLS Policies
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Note: INSERT is handled by trigger only — not by authenticated users directly

-- 5. Index on username for uniqueness and lookup performance
create index idx_profiles_username on public.profiles(username);
create index idx_profiles_role on public.profiles(role);

-- 6. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Pattern 5: Rate Limiting via Postgres (No Redis)

```sql
-- login_attempts table
create table public.login_attempts (
  id bigserial primary key,
  email text not null,
  attempted_at timestamptz not null default now(),
  ip_address text
);

create index idx_login_attempts_email_time
  on public.login_attempts(email, attempted_at desc);

-- RLS: service_role only — never accessible from client
alter table public.login_attempts enable row level security;
-- No policies = no access except service_role
```

```typescript
// Server Action: check + record failed attempt
// Uses service-role client (secret key) — server-side only
async function checkRateLimit(email: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient() // uses SUPABASE_SECRET_KEY
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('attempted_at', fifteenMinutesAgo)

  return (count ?? 0) >= 5
}

async function recordFailedAttempt(email: string, ip: string) {
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.from('login_attempts').insert({ email, ip_address: ip })
}
```

### Pattern 6: Soft Delete + PII Anonymization

```typescript
// Server Action — requires service-role / admin client (SUPABASE_SECRET_KEY)
export async function deleteAccount(userId: string) {
  const supabaseAdmin = createAdminClient() // SUPABASE_SECRET_KEY — server only

  // 1. Anonymize PII in profiles
  await supabaseAdmin
    .from('profiles')
    .update({
      username: `deleted_${userId.slice(0, 8)}`,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // 2. Soft-delete in auth.users (sets deleted_at, does NOT hard-delete)
  await supabaseAdmin.auth.admin.deleteUser(userId, true) // shouldSoftDelete=true

  // 3. Sign out current session
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/')
}
```

### Pattern 7: Nav Auth State (Client Component)

The existing `nav.tsx` is already `"use client"`. It needs to read auth state reactively. The pattern is to use `createBrowserClient` with an `onAuthStateChange` listener, or to pass session state from a Server Component parent.

**Recommended approach:** Pass user data as a prop from the Server Component layout, avoiding an extra client-side fetch:

```typescript
// src/app/layout.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'

export default async function RootLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch username if logged in
  let username: string | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    username = data?.username ?? null
  }

  return (
    <html>
      <body>
        <ThemeProvider ...>
          <Nav username={username} />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Anti-Patterns to Avoid

- **Using `getSession()` in proxy.ts or Server Components for auth decisions:** `getSession()` reads from the cookie without verifying against the Supabase server. A crafted cookie can spoof a user ID. Always use `getUser()` (makes a server round-trip) for authorization decisions. [VERIFIED: @supabase/ssr npm docs]
- **Using `middleware.ts` with `export function middleware()`:** This file convention is deprecated in Next.js 16. Use `proxy.ts` with `export function proxy()`. [VERIFIED: nextjs.org/blog/next-16]
- **Importing from `@supabase/auth-helpers-nextjs`:** This package is deprecated. All functionality is in `@supabase/ssr`. [VERIFIED: @supabase/ssr npm registry page]
- **Using `get`, `set`, `remove` on cookies in `@supabase/ssr`:** Only `getAll` and `setAll` are supported in 0.12.0. Using the individual methods will break session handling. [VERIFIED: supabase/supabase GitHub examples prompt]
- **Storing role in `user_metadata`:** `user_metadata` can be modified by the client via `updateUser()`. Role data belongs in `profiles` (server-controlled) or `app_metadata` (set only via service-role). [VERIFIED: supabase.com/docs JWT claims + community sources]
- **Using `NEXT_PUBLIC_SUPABASE_ANON_KEY`:** The current Supabase naming convention is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The anon key naming is legacy. [VERIFIED: supabase.com/docs/guides/auth/server-side/creating-a-client]
- **In-memory rate limiting (Map/Set) on Vercel:** Serverless instances don't share memory. A `Map`-based rate limiter is silently ineffective in production. Use the Postgres `login_attempts` table. [ASSUMED — serverless architecture constraint, widely documented]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based session management in Next.js SSR | Custom cookie read/write/refresh logic | `@supabase/ssr` `createServerClient` + `createBrowserClient` | Race conditions on concurrent tab requests, CDN cache-leaking sessions, refresh token rotation — all handled by the library |
| Auth token refresh across Server Components | Manual JWT refresh on each request | `proxy.ts` calling `supabase.auth.getUser()` | Server Components cannot write cookies; only the proxy can; any custom solution will have the same constraint and is harder to maintain |
| Password hashing | bcrypt/argon2 custom implementation | Supabase Auth (built on GoTrue) handles all password hashing | PBKDF2/bcrypt timing attacks, salt generation, upgrade paths — all handled server-side by Supabase |
| Username profanity detection | Custom word list + regex | `bad-words` package | Bypass patterns (1337-speak, similar chars) require ongoing maintenance; `bad-words` has a community-maintained list |
| Email validation | Custom regex | Supabase Auth's built-in email validation | RFC 5322 compliance is non-trivial; let Supabase validate at the auth layer |

**Key insight:** The Supabase + `@supabase/ssr` stack handles the hard parts of stateful auth in a stateless serverless environment. The application's job is only to wire inputs and outputs correctly — not to re-implement token rotation, PKCE flows, or secure cookie handling.

---

## Common Pitfalls

### Pitfall 1: Using `middleware.ts` in Next.js 16
**What goes wrong:** File is ignored or throws a deprecation warning; session refresh never happens; users are logged out unexpectedly.
**Why it happens:** Next.js 16 renamed the file and exported function. The old name still works but is deprecated and will be removed.
**How to avoid:** Use `src/app/proxy.ts` with `export function proxy()`. Run the codemod: `npx @next/codemod@canary middleware-to-proxy .`
**Warning signs:** Auth works in development but sessions expire unexpectedly in production; Next.js build logs deprecation warning.

### Pitfall 2: Calling `getUser()` from `proxy.ts` on Every Request Causes Rate Limit Hits
**What goes wrong:** Development hot-reloads trigger many parallel requests → Supabase auth rate limit → 429 errors → session cookie corruption → users must re-login.
**Why it happens:** Every file save in dev triggers HMR, which fires multiple parallel requests through proxy.ts. Each calls `getUser()` which hits the Supabase Auth server.
**How to avoid:** This is expected behavior in dev; `getUser()` in proxy is correct for production (one call per navigation). The rate limit issue is only in rapid dev reloads. Handle `null` sessions gracefully rather than crashing.
**Warning signs:** In dev, seeing `AuthApiError: Request rate limit reached` in the console. Does not occur in production with normal usage.

### Pitfall 3: `setAll` Not Returning the Modified Response
**What goes wrong:** Session tokens refresh silently (no error), but the new cookie is never sent to the browser. The next request still has the old expired token. User appears logged out.
**Why it happens:** The `setAll` implementation in proxy.ts must both update `request.cookies` AND set `supabaseResponse.cookies`. Missing either half breaks the chain.
**How to avoid:** Follow the exact `setAll` pattern in Pattern 1 above — two `forEach` calls, one on `request.cookies.set` and one on `supabaseResponse.cookies.set`.
**Warning signs:** Auth works on initial login but fails 1 hour later when the access token expires.

### Pitfall 4: Race Condition on Username Uniqueness
**What goes wrong:** Two users submit the same username simultaneously. The server-side pre-check both pass; the DB trigger fires for one but fails for the other with a unique constraint violation. The user sees a 500 or unhelpful error.
**Why it happens:** Pre-check + insert is not atomic without a transaction.
**How to avoid:** The DB unique constraint on `profiles.username` is the authoritative guard. The pre-check is for UX only. Always handle the unique constraint violation error code (`23505`) from the trigger insertion and return the friendly username-taken message.
**Warning signs:** Occasional signup failures with database error codes in logs.

### Pitfall 5: `handle_new_user` Trigger Blocking Signup
**What goes wrong:** If the trigger function errors (e.g., username is null, constraint violation), the entire `auth.signUp()` call fails. The user gets a confusing error unrelated to their actual input.
**Why it happens:** PostgreSQL triggers are transactional — an error in the trigger rolls back the parent insert in `auth.users`.
**How to avoid:** Validate username fully server-side BEFORE calling `supabase.auth.signUp()`. Never let a malformed username reach the trigger. Add a null guard in the trigger function itself as a fallback.
**Warning signs:** Signup returns Supabase auth errors with DB-level messages.

### Pitfall 6: `deleted_at` Soft-Delete Not Preventing Login
**What goes wrong:** A soft-deleted user can still log in using their (now anonymized) credentials — or if you set `deleted_at` without changing the email/password.
**Why it happens:** Supabase Auth doesn't know about your application's `deleted_at` column.
**How to avoid:** The PII anonymization step (nulling username, replacing with `deleted_XXXX`) is the actual blocker. Additionally, call `supabase.auth.admin.deleteUser(id, true)` (shouldSoftDelete=true) which marks `deleted_at` on the `auth.users` row itself — Supabase Auth will then reject login for that user.
**Warning signs:** Deleted accounts can still log in if only the `profiles` table is updated but not `auth.users`.

### Pitfall 7: Rate Limiter Using Email Alone (Enumeration Risk)
**What goes wrong:** A lockout message that only appears for valid email addresses reveals which emails are registered (user enumeration attack).
**Why it happens:** D-13 requires vague login errors ("Email or password incorrect"), but if the lockout message fires on a different code path only for known emails, it leaks information.
**How to avoid:** Apply the lockout counter regardless of whether the email exists. The lockout check runs BEFORE the Supabase auth call — it counts attempts by email address from the `login_attempts` table without first checking if the email is registered.
**Warning signs:** Lockout message appears differently for known vs. unknown email addresses.

---

## Code Examples

### Sign-In with Rate Limiting (Complete Server Action)
```typescript
// Source: pattern derived from supabase.com/docs auth guides + SecureStartKit pattern
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // 1. Rate limit check BEFORE auth call
  const isLocked = await checkRateLimit(email)
  if (isLocked) {
    return { error: 'general', message: 'Too many attempts. Please wait 15 minutes.' }
  }

  // 2. Attempt login
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await recordFailedAttempt(email, ip)
    return { error: 'general', message: 'Email or password incorrect.' }  // D-13: vague
  }

  // 3. Determine redirect based on role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin')
  }
  redirect('/dashboard')
}
```

### Password Reset Flow
```typescript
// Source: supabase.com/docs/reference/javascript/auth-resetpasswordforemail
export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account/update-password`,
  })

  // Always return success — don't confirm whether email exists (prevents enumeration)
  return { success: true, message: "If that email is registered, you'll receive a reset link." }
}
```

### Admin Client (Service Role — Server Only)
```typescript
// src/lib/supabase/admin.ts — NEVER import from client components
import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  // Uses SUPABASE_SECRET_KEY — not NEXT_PUBLIC_* — never exposed to client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 (consolidated) | All auth-helpers packages deprecated; `@supabase/ssr` is the single package |
| `get`, `set`, `remove` cookie methods | `getAll`, `setAll` only | 2024 (breaking change in `@supabase/ssr`) | Old patterns silently break session refresh |
| `middleware.ts` + `export function middleware()` | `proxy.ts` + `export function proxy()` | Next.js 16.0.0 (Oct 2025) | Old file is deprecated but still works; new projects must use proxy.ts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 2026 (Supabase key consolidation) | Legacy anon key still works; new projects should use publishable key naming |
| `getSession()` for auth decisions | `getUser()` (or `getClaims()`) | 2024 (security guidance update) | `getSession()` is unauthenticated cookie read — not safe for authorization |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated. Use `@supabase/ssr`.
- `middleware.ts`: Deprecated in Next.js 16. Use `proxy.ts`.
- `getSession()` in Server Components: Unsafe for authorization — use `getUser()`.
- `SUPABASE_ANON_KEY` env var name: Legacy. New naming is `SUPABASE_PUBLISHABLE_KEY` (client-safe) and `SUPABASE_SECRET_KEY` (server-only).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Postgres `login_attempts` table is sufficient for rate limiting at Frenchly's scale without Redis | Rate Limiting pattern | If traffic exceeds serverless DB connection limits, the count query adds latency to every login; mitigation: add Upstash Redis in Phase 10 if needed |
| A2 | `bad-words` custom bypass list patterns (`nigha`, `sh!tter`, `b1tch`, etc.) from CONTEXT.md D-05 are sufficient for v1 — ongoing maintenance required | Standard Stack | List will always be incomplete; user-reported violations are the expected feedback loop |
| A3 | Passing `username` prop from Server Component layout to Client Component Nav avoids extra client-side auth fetch | Architecture Patterns | If layout.tsx auth call becomes a performance bottleneck (adds latency to every page), the alternative is reading from the browser client's cached session instead |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions (RESOLVED)

1. **`proxy.ts` vs page-level auth check for admin redirect**
   - What we know: The proxy can call `getUser()` but would need an extra DB query to check `profiles.role` on every request (slow).
   - What's unclear: Is it better to redirect admin users in proxy.ts (add a DB lookup per request) or in the login Server Action (one lookup at login time, then route)?
   - Recommendation: Redirect in the login Server Action (Pattern — `signIn` above). The proxy only handles "is authenticated" checks. Admin role check happens once at login, not on every request.
   - RESOLVED: Use signIn Server Action for admin redirect per Plan 02-02 Task 1.

2. **Supabase email service for password reset (INFRA-03)**
   - What we know: Supabase requires a configured email provider for password reset emails. The free plan uses a shared Supabase SMTP with low limits.
   - What's unclear: Whether the developer has configured a custom SMTP (Resend, Postmark, etc.) or is using Supabase's built-in email.
   - Recommendation: For Phase 2, Supabase's built-in email is sufficient to test the reset flow. Production email configuration is Phase 12 (INFRA-03).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm installs | ✓ | v24.17.0 | — |
| npm | package install | ✓ | bundled | — |
| Supabase project | Auth + DB | Must be configured | — | Create at supabase.com before Phase 2 execution |
| Supabase env vars | `@supabase/ssr` | Not in repo yet | — | Add to `.env.local` as first Wave 0 task |

**Missing dependencies with no fallback:**
- Supabase project must exist and env vars must be set before any auth code can run. Wave 0 must include a checkpoint to verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured yet — Wave 0 must add |
| Config file | None detected |
| Quick run command | `npm test` (after Wave 0 setup) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | signUp() creates auth user + profiles row | integration | `npm test -- signup` | ❌ Wave 0 |
| AUTH-02 | Authenticated session persists across requests (cookie set) | integration | `npm test -- session` | ❌ Wave 0 |
| AUTH-03 | signOut() clears session, redirects to / | integration | `npm test -- logout` | ❌ Wave 0 |
| SEC-04 | 6th login attempt within 15 min returns lockout error | unit | `npm test -- rate-limit` | ❌ Wave 0 |
| SEC-02 | RLS: authenticated user cannot read another user's profile | integration | `npm test -- rls` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `tests/auth.test.ts` — covers AUTH-01, AUTH-02, AUTH-03, SEC-04
- [ ] `tests/rls.test.ts` — covers SEC-02
- [ ] Test framework install: `npm install --save-dev vitest @vitest/ui` (or Jest — either works)
- [ ] `.env.test` — test Supabase project credentials (separate project or same with isolated test data)

Note: Full auth integration tests require a live Supabase project. SEC-05 (test suite in REQUIREMENTS.md) is explicitly scoped to Phase 10. Phase 2 test coverage is smoke-level only.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth (signInWithPassword, signUp) |
| V2.4 Credential Storage | Yes | Supabase handles server-side — never store passwords in application code |
| V3 Session Management | Yes | `@supabase/ssr` cookie-based sessions via proxy.ts |
| V4 Access Control | Yes | RLS policies on all user tables; proxy.ts protected route redirects |
| V5 Input Validation | Yes | Zod validation in Server Actions before auth calls |
| V6 Cryptography | No (delegated) | Supabase Auth handles password hashing — never hand-roll |
| V7 Error Handling | Yes | Vague login errors (D-13); no stack traces to client |

### Known Threat Patterns for Supabase + Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User enumeration via login errors | Information Disclosure | Vague "Email or password incorrect" for all failures (D-13) |
| User enumeration via password reset | Information Disclosure | Always return success message regardless of whether email exists |
| Brute force credential attack | Elevation of Privilege | `login_attempts` table + 5-attempt / 15-min lockout (D-19) |
| CSRF on Server Actions | Tampering | Next.js App Router Server Actions are CSRF-protected by the framework |
| Session fixation | Elevation of Privilege | Supabase issues a new session token on every signIn — not fixable by attacker |
| Client-side role tampering | Elevation of Privilege | Role stored in `profiles` (server), never in `user_metadata` (client-writable) |
| Service role key exposure | Information Disclosure | `SUPABASE_SECRET_KEY` used only in server-side admin client; never in NEXT_PUBLIC_ vars |
| RLS bypass via service role | Elevation of Privilege | Service role used ONLY for admin operations (account deletion); never handed to browser |

---

## Sources

### Primary (HIGH confidence)
- `supabase.com/docs/guides/auth/server-side/creating-a-client` — createServerClient, createBrowserClient, env var names, setAll/getAll pattern [VERIFIED]
- `supabase.com/docs/guides/auth/server-side/nextjs` — Next.js App Router integration pattern [VERIFIED]
- `github.com/supabase/supabase/blob/master/examples/prompts/nextjs-supabase-auth.md` — Canonical "do and don't" implementation guide from Supabase repo [VERIFIED]
- `supabase.com/docs/guides/database/postgres/row-level-security` — RLS policy syntax, auth.uid() usage, TO authenticated best practice [VERIFIED]
- `supabase.com/docs/guides/auth/managing-user-data` — profiles table, handle_new_user trigger, on delete cascade [VERIFIED]
- `supabase.com/docs/guides/auth/password-security` — password length and character requirements configuration [VERIFIED]
- `supabase.com/docs/guides/auth/rate-limits` — Supabase built-in rate limits, IP forwarding [VERIFIED]
- `nextjs.org/blog/next-16` — proxy.ts replacing middleware.ts in Next.js 16.0.0 [VERIFIED]
- `nextjs.org/docs/app/api-reference/file-conventions/proxy` — proxy.ts file convention, migration guide [VERIFIED]
- `supabase.com/docs/guides/getting-started/api-keys` — publishable key vs anon key (legacy) naming [VERIFIED]
- `supabase.com/docs/reference/javascript/auth-admin-deleteuser` — shouldSoftDelete parameter [VERIFIED]

### Secondary (MEDIUM confidence)
- `securestartkit.com/blog/nextjs-proxy-ts-authentication-how-to-protect-routes-with-supabase-2026` — complete proxy.ts Supabase pattern, verified against official Next.js docs
- `securestartkit.com/blog/how-to-rate-limit-nextjs-server-actions-before-they-get-abused` — rate limiting serverless constraints
- npm registry — package versions, publish dates, scripts for @supabase/ssr, @supabase/supabase-js, bad-words [VERIFIED]
- slopcheck 0.6.1 — all three packages rated [OK] [VERIFIED]

### Tertiary (LOW confidence)
- None used as the basis for any recommendation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry and slopcheck; docs confirmed via official Supabase sources
- Architecture patterns: HIGH — derived from official Supabase docs and Next.js 16 changelog
- Pitfalls: HIGH — derived from official docs (rate limit behavior, getSession warning, middleware rename) and confirmed community sources
- Rate limiting without Redis: MEDIUM — Postgres table approach is architecturally sound but carries the assumption note A1

**Research date:** 2026-06-20
**Valid until:** 2026-09-20 (90 days — Next.js and Supabase move fast; verify proxy.ts and env var names if returning after this date)
