# Phase 3: Lesson Framework - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `supabase/migrations/20260622_phase3_lessons.sql` | migration | CRUD | `supabase/migrations/20260620_phase2_auth.sql` | exact |
| `src/app/lessons/actions.ts` | service | request-response | `src/app/auth/actions.ts` | exact |
| `src/app/levels/[levelSlug]/page.tsx` | component (Server) | request-response | `src/app/dashboard/page.tsx` | exact |
| `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` | component (Server) | request-response | `src/app/dashboard/page.tsx` | exact |
| `src/components/lessons/SubComponentList.tsx` | component (Client) | event-driven | `src/components/auth/LoginForm.tsx` | role-match |
| `src/components/lessons/SubComponentItem.tsx` | component (Client) | event-driven | `src/components/auth/LoginForm.tsx` | role-match |
| `src/components/lessons/LevelCard.tsx` | component | request-response | `src/components/auth/LoginForm.tsx` | role-match |
| `src/components/ui/LockBadge.tsx` | component | — | `src/components/auth/LoginForm.tsx` | role-match |
| `__tests__/rls-phase3.test.ts` | test | — | `__tests__/rls.test.ts` | exact |
| `__tests__/lessons/actions.test.ts` | test | — | `__tests__/auth/delete.test.ts` | exact |

---

## Pattern Assignments

### `supabase/migrations/20260622_phase3_lessons.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260620_phase2_auth.sql`

**Table + grants + RLS block structure** (lines 1–31 of analog):
```sql
create table public.profiles (
  id          uuid        not null primary key references auth.users on delete cascade,
  -- ... columns ...
);

-- Grants (column-scoped UPDATE for privilege-escalation guard)
grant select on public.profiles to anon;
grant select, insert on public.profiles to authenticated;
grant update (username, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Indexes
create index idx_profiles_username on public.profiles (username);

-- RLS enable + policies follow immediately after table definition
alter table public.profiles enable row level security;
```

**Per-user RLS policy pattern** (lines 40–55 of analog) — mirror for `sub_component_progress`:
```sql
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
```

**Public-content RLS pattern** — `USING (true)` for `levels`, `lessons`, `sub_components`:
```sql
-- Use `to authenticated` (NOT `to authenticated, anon`) so anonymous visitors see nothing
alter table public.levels enable row level security;

create policy "Authenticated users can read all levels"
  on public.levels
  for select
  to authenticated
  using (true);
```

**Trigger pattern** (lines 61–75 of analog) — for updating `handle_new_user` to set `current_level_id`:
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
-- Phase 3 must CREATE OR REPLACE this function (not redefine the trigger)
-- to also set current_level_id = (SELECT id FROM public.levels WHERE level_number = 1)
```

**Critical column-grant constraint** (line 29 of analog): `grant update (username, updated_at)` — Phase 3 must NOT add `current_level_id` to this grant. Only `service_role` may set it.

---

### `src/app/lessons/actions.ts` (service, request-response)

**Analog:** `src/app/auth/actions.ts`

**File header + imports** (lines 1–7 of analog):
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
```
For the lesson action, also add:
```typescript
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
```

**getUser() auth pattern** (lines 225–233 of analog — `deleteAccount`):
```typescript
const supabase = await createClient()

// Resolve the authenticated user id server-side (T-02-15 — never trust client input)
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  redirect('/login')
}
```

**Upsert + error check pattern** (derived from analog's `.from().update().eq()` style):
```typescript
const { error } = await supabase
  .from('sub_component_progress')
  .upsert(
    { user_id: user.id, sub_component_id: parsed.data, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,sub_component_id' }
  )
if (error) throw new Error('Failed to save progress')
```

**Input validation pattern** — zod, used consistently across the project:
```typescript
const SubComponentIdSchema = z.string().uuid()

const parsed = SubComponentIdSchema.safeParse(subComponentId)
if (!parsed.success) throw new Error('Invalid sub-component ID')
```

**revalidatePath** — call at end of action after successful upsert (no analog in Phase 2 — see RESEARCH.md Pattern 3 for the exact call).

---

### `src/app/levels/[levelSlug]/page.tsx` (Server Component, request-response)

**Analog:** `src/app/dashboard/page.tsx`

**Imports + createClient pattern** (lines 1–2 of analog):
```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
```

**Auth guard + getUser() pattern** (lines 8–17 of analog):
```typescript
export default async function DashboardPage() {
  // Defense-in-depth: proxy already guards this route, but double-check here (T-02-10)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }
```
For level page, redirect target becomes `/login?next=/levels/${params.levelSlug}`.

**Profile fetch pattern** (lines 19–23 of analog):
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("username")
  .eq("id", user.id)
  .single();
```
For level page, select `current_level_id` instead of `username`.

**Layout tokens** (lines 28–30 of analog):
```tsx
<main className="min-h-screen bg-background">
  <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
```
Level page uses `max-w-[1040px]` (dashboard container width per DESIGN.md + CLAUDE.md).

**Metadata export pattern** (lines 3–5 of analog):
```typescript
export const metadata = {
  title: "Dashboard — Frenchly",
};
```

---

### `src/app/levels/[levelSlug]/lessons/[lessonId]/page.tsx` (Server Component, request-response)

**Analog:** `src/app/dashboard/page.tsx`

Same auth guard, createClient, getUser patterns as level page above.

**Layout token** — lesson content uses `max-w-[720px]` (per DESIGN.md + CLAUDE.md), NOT `max-w-[1040px]`:
```tsx
<main className="min-h-screen bg-background">
  <div className="max-w-[720px] mx-auto px-5 md:px-6 py-12">
```

Two separate Supabase queries — one for sub-components (content), one for progress (user data) — keeps RLS boundary explicit. Both use the same `.from().select().eq().single()` chain as the analog's profile fetch.

---

### `src/components/lessons/SubComponentList.tsx` (Client Component, event-driven)

**Analog:** `src/components/auth/LoginForm.tsx`

**'use client' directive + imports** (lines 1–6 of analog):
```typescript
"use client";

import { useState } from "react";
```
For SubComponentList, replace `useState` with `useOptimistic` and `useTransition`:
```typescript
'use client'

import { useOptimistic, useTransition } from 'react'
import { markSubComponentComplete } from '@/app/lessons/actions'
```

**Async handler calling a Server Action** (lines 24–32 of analog):
```typescript
async function handleSubmit(formData: FormData) {
  setPending(true);
  setError(null);
  const result = await signIn(formData);
  if (result?.error) {
    setError({ field: result.error, message: result.message });
  }
  setPending(false);
}
```
For SubComponentList, the equivalent is `startTransition` + `useOptimistic`:
```typescript
const [, startTransition] = useTransition()
const [completedIds, setOptimisticCompleted] = useOptimistic(
  initialCompletedIds,
  (current: Set<string>, id: string) => new Set([...current, id])
)

function handleComplete(id: string) {
  if (completedIds.has(id)) return
  startTransition(async () => {
    setOptimisticCompleted(id)           // instant UI flip
    await markSubComponentComplete(id)   // Server Action persists to DB
  })
}
```
**Critical:** `setOptimisticCompleted` MUST be called inside `startTransition` — calling it outside is a silent no-op in production.

**Disabled state + aria pattern** (lines 143–149 of analog):
```tsx
<button
  type="submit"
  disabled={pending}
  className="... disabled:opacity-40 disabled:cursor-not-allowed"
>
```
For sub-component buttons: `disabled={completedIds.has(sc.id)}` + `aria-pressed={completedIds.has(sc.id)}`.

**Design system class tokens** (from analog throughout):
```
font-body, font-label, font-heading
text-on-surface, text-on-surface-variant, text-error
bg-surface-container-low, bg-background
border-outline, border-outline-variant
text-primary, bg-primary, text-on-primary
rounded, px-3 py-2, min-h-[44px]
focus:border-b-[3px] focus:border-primary
```
Do NOT use green (`text-tertiary`, `bg-tertiary-container`) for completion state — green is reserved for correct-answer feedback (Phase 5). Use `text-on-surface-variant` with opacity or a checkmark icon instead.

---

### `src/components/lessons/SubComponentItem.tsx` (Client Component, event-driven)

**Analog:** `src/components/auth/LoginForm.tsx`

Same `'use client'` header, same design token classes. This is a presentational sub-component of `SubComponentList`. Receives `isCompleted: boolean` and `onComplete: () => void` as props. Apply the same `disabled` + `aria-pressed` button pattern. Use `font-label` for the item title label, `font-body` for any description text.

---

### `src/components/lessons/LevelCard.tsx` (component, request-response)

**Analog:** `src/components/auth/LoginForm.tsx` (design tokens only — no state management needed)

This is a pure presentational Server-renderable component. No `'use client'` needed unless interaction is added.

**Design token pattern for card container** (from analog + dashboard page):
```tsx
<div className="border border-outline-variant rounded-[16px] p-6 bg-surface-container-low">
```
For locked lessons, use `opacity-60` or `text-on-surface-variant` to visually indicate locked state — NOT a different color temperature.

**Guillemet active-lesson marker** (CLAUDE.md + DESIGN.md): active/in-progress lesson gets `«` prefix:
```tsx
{isActive && <span className="font-heading text-primary mr-1">«</span>}
```

**Time estimate display**: use `font-label text-[13px] text-on-surface-variant` — same label style as form labels in the analog.

---

### `src/components/ui/LockBadge.tsx` (component, —)

**Analog:** `src/components/auth/LoginForm.tsx` (design tokens only)

Small indicator badge. No state. Purely presentational.

**No analog for badge pattern exists** — use DESIGN.md tokens directly:
```tsx
// Warm palette, no green, tonal layers over shadows
<span className="inline-flex items-center gap-1 font-label text-[11px] text-on-surface-variant bg-surface-container rounded-full px-2 py-0.5">
  {/* lock icon */} Locked
</span>
```
Sentence case: "Locked" not "LOCKED".

---

### `__tests__/rls-phase3.test.ts` (test, —)

**Analog:** `__tests__/rls.test.ts`

**File header + migration path pattern** (lines 1–23 of analog):
```typescript
// SEC-02: RLS blocks cross-student row reads (T-02-12)
//
// Two validation tiers:
//   LIVE  — when SUPABASE_TEST_URL + SUPABASE_TEST_PUBLISHABLE_KEY are set ...
//   STATIC — always runs; asserts the migration SQL expresses the correct auth.uid()-
//            scoped policies ...

import * as fs from 'fs'
import * as path from 'path'

const MIGRATION_PATH = path.resolve(__dirname, '../supabase/migrations/20260620_phase2_auth.sql')

function loadMigrationSQL(): string {
  if (!fs.existsSync(MIGRATION_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_PATH}`)
  }
  return fs.readFileSync(MIGRATION_PATH, 'utf-8')
}
```
For Phase 3, change migration path to `20260622_phase3_lessons.sql`.

**Static assertion pattern** (lines 25–60 of analog):
```typescript
describe('RLS policy static analysis (SEC-02, migration source-of-truth)', () => {
  let sql: string

  beforeAll(() => {
    sql = loadMigrationSQL()
  })

  test('profiles table has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.profiles enable row level security/)
  })

  test('SELECT policy scopes to auth.uid() = id (no cross-user reads)', () => {
    expect(sql).toMatch(/for select[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = id\)/i)
  })
})
```
For Phase 3, assert `sub_component_progress` SELECT/INSERT/UPDATE all scope to `(select auth.uid()) = user_id`, and all three content tables (`levels`, `lessons`, `sub_components`) have `enable row level security`.

---

### `__tests__/lessons/actions.test.ts` (test, —)

**Analog:** `__tests__/auth/delete.test.ts`

**Mock scaffolding pattern** (lines 1–68 of analog) — copy this entire structure:
```typescript
// ─── Mock next/navigation ────────────────────────────────────────────────────
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

// ─── Mock next/cache ─────────────────────────────────────────────────────────
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}))

// ─── Shared mock state ───────────────────────────────────────────────────────
let mockGetUserResult: { data: { user: { id: string } | null }; error: null }

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async () => mockGetUserResult),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'sc-uuid', lesson_id: 'lesson-uuid' }, error: null }),
        }),
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }),
  })),
}))
```

**Test cases to cover** (per RESEARCH.md Validation Architecture):
- `markSubComponentComplete` upserts a progress row for authenticated user (LESSON-03)
- `markSubComponentComplete` redirects to `/login` when unauthenticated (LESSON-03)
- `markSubComponentComplete` throws on invalid UUID input — zod rejection (LESSON-03)
- `markSubComponentComplete` calls `revalidatePath` after successful upsert
- Never accepts `user_id` from the caller — always resolves via `getUser()` server-side

**`beforeEach` reset pattern** (lines 72–86 of analog):
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserResult = {
    data: { user: { id: 'test-user-uuid' } },
    error: null,
  }
})
```

---

## Shared Patterns

### Auth Guard (getUser)
**Source:** `src/app/dashboard/page.tsx` lines 10–17, `src/app/auth/actions.ts` lines 225–233
**Apply to:** All Server Components (`levels/page.tsx`, `lessons/[lessonId]/page.tsx`) and the Server Action (`lessons/actions.ts`)
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login?next=<current-path>')
```
Use `getUser()` never `getSession()` — `getUser()` verifies server-side; `getSession()` trusts unverified JWT claims.

### Design Tokens
**Source:** `src/components/auth/LoginForm.tsx` throughout, `src/app/dashboard/page.tsx` lines 28–46
**Apply to:** All component files
- Container widths: `max-w-[1040px]` (level page), `max-w-[720px]` (lesson page)
- Padding: `px-5 md:px-6 py-20` (dashboard) or `py-12` (lesson)
- Card: `border border-outline-variant rounded-[16px] p-6 bg-surface-container-low`
- Buttons: `bg-primary text-on-primary font-label text-sm rounded px-6 py-3 min-h-[44px]`
- Input/label: `font-label text-[13px] text-on-surface-variant`
- Body text: `font-body text-on-surface`
- Heading: `font-heading text-[28px] font-semibold text-on-surface`
- Green (`text-tertiary`, `bg-tertiary-container`) is BANNED outside Phase 5 correct-answer feedback

### Supabase Client Import
**Source:** `src/app/auth/actions.ts` line 3, `src/app/dashboard/page.tsx` line 2
**Apply to:** All files that touch the database
```typescript
// Server Components and Server Actions:
import { createClient } from '@/lib/supabase/server'
// Admin-only operations (service_role):
import { createAdminClient } from '@/lib/supabase/admin'
```

### RLS Policy Style
**Source:** `supabase/migrations/20260620_phase2_auth.sql` lines 40–55
**Apply to:** `20260622_phase3_lessons.sql`
- Always use `(select auth.uid())` (subquery form), never bare `auth.uid()`
- Enable RLS before defining policies
- Use `to authenticated` not `to anon` on content tables
- Column-scoped `grant update (col1, col2)` — do NOT grant update on `current_level_id` to `authenticated`

### Server Action Test Scaffolding
**Source:** `__tests__/auth/delete.test.ts` lines 1–86
**Apply to:** `__tests__/lessons/actions.test.ts`
- Mock `next/navigation` redirect to throw `NEXT_REDIRECT:<url>`
- Mock `next/cache` revalidatePath separately
- Mock `@/lib/supabase/server` and `@/lib/supabase/admin` at module level
- Reset all mocks in `beforeEach`; use `jest.clearAllMocks()`
- Import the action under test AFTER all `jest.mock()` calls

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `__tests__/lessons/level.test.ts` | test | — | Tests the locked/unlocked derivation logic — a pure function extracted from the Server Component. No analog for pure-function extraction tests exists; use standard Jest `test()` with no mocks. |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/lib/`, `supabase/migrations/`, `__tests__/`
**Files scanned:** 24
**Pattern extraction date:** 2026-06-21
