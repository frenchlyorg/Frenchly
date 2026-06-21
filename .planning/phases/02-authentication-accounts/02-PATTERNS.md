# Phase 2: Authentication & Accounts - Pattern Map

**Mapped:** 2026-06-20
**Files analyzed:** 14 new/modified files
**Analogs found:** 9 / 14 (5 have no codebase analog — new patterns from RESEARCH.md)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/proxy.ts` | middleware | request-response | none (new pattern) | no-analog |
| `src/lib/supabase/client.ts` | utility | request-response | `src/components/theme-provider.tsx` | partial (client wrapper pattern) |
| `src/lib/supabase/server.ts` | utility | request-response | `src/components/theme-provider.tsx` | partial (provider wrapper pattern) |
| `src/lib/supabase/admin.ts` | utility | request-response | none (new pattern) | no-analog |
| `src/app/auth/actions.ts` | service | request-response | none (new pattern) | no-analog |
| `src/app/auth/callback/route.ts` | route | request-response | none (new pattern) | no-analog |
| `src/app/(auth)/login/page.tsx` | component | request-response | `src/app/mission/page.tsx` | role-match (page layout) |
| `src/app/(auth)/signup/page.tsx` | component | request-response | `src/app/mission/page.tsx` | role-match (page layout) |
| `src/app/(auth)/layout.tsx` | component | request-response | `src/app/layout.tsx` | role-match (layout wrapper) |
| `src/app/dashboard/page.tsx` | component | request-response | `src/app/mission/page.tsx` | role-match (page layout) |
| `src/app/admin/page.tsx` | component | request-response | `src/app/mission/page.tsx` | role-match (page layout) |
| `src/app/account/page.tsx` | component | request-response | `src/app/mission/page.tsx` | role-match (page layout) |
| `src/components/nav.tsx` (modify) | component | event-driven | `src/components/nav.tsx` | exact (modify in-place) |
| `src/app/layout.tsx` (modify) | component | request-response | `src/app/layout.tsx` | exact (modify in-place) |
| `components/auth/LoginForm.tsx` | component | request-response | `src/components/hero.tsx` | role-match (client component with state) |
| `components/auth/SignupForm.tsx` | component | request-response | `src/components/hero.tsx` | role-match (client component with state) |
| `supabase/migrations/20260620_phase2_auth.sql` | migration | CRUD | none (new pattern) | no-analog |

---

## Pattern Assignments

### `src/app/proxy.ts` (middleware, request-response)

**Analog:** None in codebase. Use RESEARCH.md Pattern 1 verbatim.

**Key constraints from research:**
- File is `src/app/proxy.ts`, NOT `src/middleware.ts` — Next.js 16 convention
- Export name is `proxy`, not `middleware`
- MUST use `getUser()` not `getSession()` — verifies against auth server
- MUST use `getAll`/`setAll` cookie methods only — not `get`/`set`/`remove`
- The `setAll` implementation requires TWO `forEach` calls (request.cookies.set AND supabaseResponse.cookies.set) — missing either half breaks session refresh silently

**Core pattern** (from RESEARCH.md lines 218-273):
```typescript
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const protectedPaths = ['/dashboard', '/admin', '/account']
  const isProtectedRoute = protectedPaths.some(p => pathname.startsWith(p))

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### `src/lib/supabase/client.ts` (utility, request-response)

**Analog:** `src/components/theme-provider.tsx` — same pattern of wrapping a third-party client with a thin module export for use in client components.

**Import/export pattern from analog** (`src/components/theme-provider.tsx` lines 1-10):
```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**Core pattern** (from RESEARCH.md lines 313-319):
```typescript
// src/lib/supabase/client.ts
// No "use client" directive needed — just exports a factory function
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Key constraint:** Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

### `src/lib/supabase/server.ts` (utility, request-response)

**Analog:** `src/components/theme-provider.tsx` — same thin-wrapper export pattern, but async (must `await cookies()`).

**Core pattern** (from RESEARCH.md lines 278-307):
```typescript
// src/lib/supabase/server.ts
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
        setAll(cookiesToSet) {
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

**Key constraint:** The `try/catch` on `setAll` is intentional — Server Components cannot write cookies directly; the proxy handles the actual write. Do not remove it.

---

### `src/lib/supabase/admin.ts` (utility, request-response)

**Analog:** None in codebase. Uses `SUPABASE_SECRET_KEY` (not `NEXT_PUBLIC_*`). Never import this from any client component.

**Core pattern** (from RESEARCH.md lines 697-707):
```typescript
// src/lib/supabase/admin.ts — NEVER import from client components
import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

---

### `src/app/auth/actions.ts` (service, request-response)

**Analog:** None in codebase. First Server Actions file. Follow `'use server'` directive convention.

**Sign-up action pattern** (from RESEARCH.md lines 327-386):
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Filter from 'bad-words'

const filter = new Filter()
filter.addWords('nigha', 'sh1tter', 'b1tch' /* extend as needed */)

export async function signUp(formData: FormData) {
  // Validate → profanity check → password strength → DB pre-check → signUp()
  // Return { error: 'field-name', message: 'warm copy' } on failure
  // redirect('/dashboard') on success
}

export async function signIn(formData: FormData) {
  // Rate limit check FIRST (before auth call) → signInWithPassword()
  // recordFailedAttempt() on error → role check → redirect('/admin' | '/dashboard')
}

export async function signOut() {
  // supabase.auth.signOut() → redirect('/')
}

export async function resetPassword(formData: FormData) {
  // resetPasswordForEmail() → always return success (prevents email enumeration)
}

export async function deleteAccount(userId: string) {
  // Uses admin client: anonymize profiles row → auth.admin.deleteUser(id, true) → signOut() → redirect('/')
}
```

**Error return shape** (consistent across all actions):
```typescript
return { error: 'email' | 'password' | 'username' | 'general', message: string }
```

**Rate limit helpers** (from RESEARCH.md lines 474-491):
```typescript
async function checkRateLimit(email: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient()
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

---

### `src/app/auth/callback/route.ts` (route, request-response)

**Analog:** None in codebase. This is a Next.js Route Handler for the password-reset redirect.

**Core pattern:**
```typescript
// src/app/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/update-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid-reset-link`)
}
```

---

### `src/app/(auth)/login/page.tsx` (component, request-response)

**Analog:** `src/app/mission/page.tsx` — Server Component page with `max-w-[720px]` content container, `font-heading`/`font-body`/`font-label` classes, design token colors only.

**Page structure pattern** (from `src/app/mission/page.tsx` lines 1-28):
```typescript
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-6">
        {/* heading, subheading, then <LoginForm /> client component */}
      </div>
    </main>
  )
}
```

**Heading typography to copy:**
```tsx
<h1 className="font-heading text-4xl font-bold text-on-surface mb-8">
  {/* sentence case, not Title Case */}
</h1>
```

**Design constraints from CLAUDE.md:**
- Input fields: lightly boxed (not underlined). Focus: `border-primary` thicker bottom border
- Primary button: `bg-primary text-on-primary` (matches `DisabledCTA` in `hero.tsx` line 116)
- Error text: `text-error` token (defined in globals.css line 25: `#ba1a1a`)
- No ad-hoc hex values — all colors via CSS custom property tokens

**Button pattern from analog** (`src/components/hero.tsx` line 116):
```tsx
<button className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm">
  Log in
</button>
```

---

### `src/app/(auth)/signup/page.tsx` (component, request-response)

**Analog:** `src/app/mission/page.tsx` — same page wrapper pattern as login.

Identical page structure to `login/page.tsx`. Renders `<SignupForm />` client component. Max-width `720px`, same font/color conventions.

---

### `src/app/(auth)/layout.tsx` (component, request-response)

**Analog:** `src/app/layout.tsx` — layout wrapper pattern. Auth layout is simpler: no font loading (inherited from root), no ThemeProvider (inherited). Purely wraps children with optional auth-specific chrome.

**Root layout pattern to follow** (`src/app/layout.tsx` lines 32-56):
```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html ...>
      <body className="font-body">
        <ThemeProvider ...>
          <Nav />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Auth layout is a simpler fragment — no `<html>`/`<body>` tags (root layout owns those):
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

---

### `src/app/dashboard/page.tsx` (component, request-response)

**Analog:** `src/app/mission/page.tsx` — Server Component, content-width container, design tokens.

This is a protected Server Component. Must call `createClient()` and `getUser()` server-side as defense-in-depth (proxy already guards, but page double-checks per RESEARCH.md architecture). Container max-width `1040px` (dashboard), not `720px` (content).

**Container pattern from `src/app/page.tsx`** (lines 21-22):
```tsx
<section className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
```

---

### `src/app/admin/page.tsx` (component, request-response)

**Analog:** `src/app/mission/page.tsx` — Server Component stub. Must verify `profiles.role === 'admin'` server-side and redirect non-admins. Uses `1040px` container.

---

### `src/app/account/page.tsx` (component, request-response)

**Analog:** `src/app/mission/page.tsx` — Server Component. Contains account deletion confirmation UI (`<DeleteAccountForm />` client component with the "type delete" pattern from D-14). Uses `720px` content container.

---

### `src/components/nav.tsx` (modify existing, event-driven)

**Analog:** `src/components/nav.tsx` itself — modify in-place.

**Current file** (`src/components/nav.tsx` lines 1-83): Already `"use client"`. Currently has no props.

**Modification pattern** — add `username` prop, conditionally render auth state:
```typescript
// Add props interface
interface NavProps {
  username: string | null
}

export function Nav({ username }: NavProps) {
  // Replace the "Log in" <Link> with conditional:
  // if (username) → show username + "Log out" button
  // else → show "Log in" <Link href="/login">

  // "Log out" calls signOut() Server Action
  // Preserve all existing: Logo, Home, Mission links, ThemeToggle, mobile hamburger
}
```

**Existing link style to preserve** (lines 21-38):
```tsx
<Link
  href="/"
  className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
>
  Home
</Link>
```

**Log out button should match link style** — same `text-on-surface-variant hover:text-on-surface text-sm transition-colors`, not a filled button.

---

### `src/app/layout.tsx` (modify existing, request-response)

**Analog:** `src/app/layout.tsx` itself — modify in-place.

**Current file** (`src/app/layout.tsx` lines 32-56): Renders `<Nav />` with no props.

**Modification:** Add server-side auth fetch, pass `username` to Nav:
```typescript
// Add at top of RootLayout function (server-side):
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
let username: string | null = null
if (user) {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()
  username = data?.username ?? null
}

// Change: <Nav /> → <Nav username={username} />
```

**Import to add:**
```typescript
import { createClient } from '@/lib/supabase/server'
```

---

### `components/auth/LoginForm.tsx` (component, request-response)

**Analog:** `src/components/hero.tsx` — client component with `"use client"`, `useState`, event handlers. Best structural analog for interactive form components.

**Client component pattern from analog** (`src/components/hero.tsx` lines 1-15):
```typescript
"use client";

import { useEffect, useState } from "react";
```

**Form component pattern:**
```typescript
"use client";

import { useState } from "react";
import { signIn } from "@/app/auth/actions";

interface FieldError {
  field: 'email' | 'password' | 'general' | null
  message: string
}

export function LoginForm() {
  const [error, setError] = useState<FieldError | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError({ field: result.error as FieldError['field'], message: result.message })
    }
    setPending(false)
  }

  return (
    <form action={handleSubmit}>
      {/* email input */}
      {/* password input */}
      {/* inline field errors below each input */}
      {/* submit button */}
    </form>
  )
}
```

**Input style** (from CLAUDE.md and design tokens — lightly boxed, not underlined, coral focus border):
```tsx
<input
  type="email"
  name="email"
  className="w-full border border-outline rounded px-3 py-2 bg-surface text-on-surface font-body text-sm focus:outline-none focus:border-b-2 focus:border-primary"
/>
{error?.field === 'email' && (
  <p className="text-error font-label text-xs mt-1">{error.message}</p>
)}
```

---

### `components/auth/SignupForm.tsx` (component, request-response)

**Analog:** `src/components/hero.tsx` — same client component pattern as LoginForm.

Same structure as `LoginForm.tsx`. Adds `username` field. Error fields: `'email' | 'password' | 'username' | 'general'`.

---

### `supabase/migrations/20260620_phase2_auth.sql` (migration, CRUD)

**Analog:** None in codebase. First migration file.

**Full schema pattern** (from RESEARCH.md lines 392-451) — two tables:

1. `public.profiles` — id (FK to auth.users, cascade), username (unique, 3-20 chars, `^[a-zA-Z0-9_]+$`), role (check: 'student'|'admin', default 'student'), deleted_at, created_at, updated_at
2. `public.login_attempts` — id (bigserial), email, attempted_at, ip_address

**RLS pattern:**
```sql
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- No INSERT policy — trigger only
```

**Trigger pattern:**
```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**login_attempts: no RLS policies = service_role only access** (no authenticated user can read it).

---

## Shared Patterns

### Design Token Usage
**Source:** `src/app/globals.css` and `src/app/page.tsx`, `src/components/nav.tsx`
**Apply to:** All new components (forms, pages, layouts)

```
Colors (use CSS token names, never hex):
  bg-background        — page background (#fff8f5 light / #1a1715 dark)
  bg-surface           — card/input background
  bg-surface-container — card sections, feature boxes
  text-on-surface      — primary text
  text-on-surface-variant — secondary/muted text
  text-primary         — coral accent (#a03e40 light)
  text-error           — error messages (#ba1a1a light)
  border-outline       — input borders
  border-outline-variant — section dividers
  bg-primary text-on-primary — primary button fill (WCAG AA)

Typography (use font-* utility classes):
  font-heading  → Literata (headings, logo)
  font-body     → Be Vietnam Pro (body text)
  font-label    → Work Sans (buttons, labels, captions)

Container widths:
  max-w-[1040px]  — dashboard/admin pages
  max-w-[720px]   — content/form pages (login, signup, account, mission)

Padding: px-5 md:px-6 (matches all existing pages)
```

### Client Component Pattern
**Source:** `src/components/hero.tsx` (lines 1-2) and `src/components/nav.tsx` (line 1)
**Apply to:** `LoginForm.tsx`, `SignupForm.tsx`, `nav.tsx` (already applied)

```typescript
"use client";

import { useState } from "react";
// Only use hooks, event handlers, browser APIs inside "use client" components
// Keep "use client" at the very top, before any imports
```

### Server Component Import Path Convention
**Source:** `src/app/layout.tsx` (lines 1-5)
**Apply to:** All new pages and layouts

```typescript
import { ComponentName } from "@/components/component-name";
// Path alias @/ maps to src/
// Named exports (not default exports) for components
```

### Form Action Pattern (Server Actions with Next.js App Router)
**Source:** RESEARCH.md — no codebase analog yet
**Apply to:** `LoginForm.tsx`, `SignupForm.tsx`, `account/page.tsx`

Server Actions are called via `action={handleSubmit}` on `<form>` or via `await serverAction(formData)` inside a client event handler. Return `{ error, message }` on failure; call `redirect()` on success (redirect throws internally — do not catch it).

### Supabase Query Pattern
**Source:** RESEARCH.md — no codebase analog yet
**Apply to:** `src/app/auth/actions.ts`, `src/app/layout.tsx`, all protected pages

```typescript
// Always use SDK methods — never raw SQL strings (SEC-03)
const { data, error } = await supabase
  .from('profiles')
  .select('username')
  .eq('id', user.id)
  .single()

// Never use .eq('id', untrusted_input) without validation
// RLS enforces row isolation automatically on authenticated queries
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/proxy.ts` | middleware | request-response | No middleware exists in Phase 1; first use of Next.js proxy convention |
| `src/lib/supabase/admin.ts` | utility | request-response | No server-only secret-key client exists yet |
| `src/app/auth/actions.ts` | service | request-response | No Server Actions exist yet in codebase |
| `src/app/auth/callback/route.ts` | route | request-response | No Route Handlers exist yet in codebase |
| `supabase/migrations/20260620_phase2_auth.sql` | migration | CRUD | No Supabase migrations directory exists yet |

---

## Critical Anti-Patterns (must not appear in any Phase 2 file)

| Anti-Pattern | Where It Would Bite | Correct Alternative |
|---|---|---|
| `import from 'middleware.ts'` or `export function middleware()` | `proxy.ts` | File must be `proxy.ts`, export `proxy` |
| `supabase.auth.getSession()` for auth decisions | `proxy.ts`, protected pages | Always `supabase.auth.getUser()` |
| `get`/`set`/`remove` cookie methods in `@supabase/ssr` | `proxy.ts`, `server.ts` | Only `getAll`/`setAll` |
| `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` | any file | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `import { createAdminClient }` in any `"use client"` file | `LoginForm.tsx`, `SignupForm.tsx` | Admin client is server-only; call via Server Action |
| Role stored in `user_metadata` | `auth/actions.ts` | Role lives in `profiles.role` only |
| In-memory rate limiting (`Map`, module-level counter) | `auth/actions.ts` | Postgres `login_attempts` table via admin client |
| `import from '@supabase/auth-helpers-nextjs'` | any file | Deprecated; use `@supabase/ssr` |

---

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**`, `next.config.ts`
**Files scanned:** 8 source files (entire Phase 1 output — small codebase)
**Pattern extraction date:** 2026-06-20
