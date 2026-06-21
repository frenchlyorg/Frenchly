// SEC-02: RLS blocks cross-student row reads (T-02-12)
//
// Two validation tiers:
//   LIVE  — when SUPABASE_TEST_URL + SUPABASE_TEST_PUBLISHABLE_KEY are set, connects
//            two real authenticated users and asserts cross-user isolation end-to-end.
//   STATIC — always runs; asserts the migration SQL expresses the correct auth.uid()-
//            scoped policies and the absence of an INSERT policy (so only the trigger
//            can create profiles rows). This is the offline authoritative check referenced
//            in 02-VALIDATION.md.

import * as fs from 'fs'
import * as path from 'path'

// ─── Shared migration policy assertions (STATIC — always run) ────────────────

const MIGRATION_PATH = path.resolve(__dirname, '../supabase/migrations/20260620_phase2_auth.sql')

function loadMigrationSQL(): string {
  if (!fs.existsSync(MIGRATION_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_PATH}`)
  }
  return fs.readFileSync(MIGRATION_PATH, 'utf-8')
}

describe('RLS policy static analysis (SEC-02, migration source-of-truth)', () => {
  let sql: string

  beforeAll(() => {
    sql = loadMigrationSQL()
  })

  test('profiles table has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.profiles enable row level security/)
  })

  test('SELECT policy scopes to auth.uid() = id (no cross-user reads)', () => {
    // Policy must use (select auth.uid()) = id — the stable-value form that avoids
    // per-row function calls (performance + security — T-02-12).
    expect(sql).toMatch(/for select[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = id\)/i)
  })

  test('UPDATE policy scopes to auth.uid() = id with check (no cross-user writes)', () => {
    expect(sql).toMatch(/for update[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = id\)/i)
    expect(sql).toMatch(/with check\s*\(\(select auth\.uid\(\)\) = id\)/i)
  })

  test('no INSERT policy exists on profiles — trigger-only creation (privilege guard)', () => {
    // Absence of an INSERT policy means no authenticated user can directly insert rows;
    // the handle_new_user trigger (security definer) is the only creation path (D-17).
    expect(sql).not.toMatch(/on public\.profiles[\s\S]*?for insert/i)
  })

  test('login_attempts has RLS enabled with zero policies (service_role only)', () => {
    // Zero policies on login_attempts means no authenticated role can read or write it —
    // only the service_role admin client used by checkRateLimit/recordFailedAttempt.
    expect(sql).toMatch(/alter table public\.login_attempts enable row level security/)
    // Confirm no policy block targets login_attempts
    expect(sql).not.toMatch(/on public\.login_attempts[\s\S]*?for (select|insert|update|delete)/i)
  })
})

// ─── Live RLS isolation tests (LIVE — guarded by env) ────────────────────────
//
// To run: set SUPABASE_TEST_URL, SUPABASE_TEST_PUBLISHABLE_KEY,
//         SUPABASE_TEST_USER_A_EMAIL, SUPABASE_TEST_USER_A_PASSWORD,
//         SUPABASE_TEST_USER_B_EMAIL, SUPABASE_TEST_USER_B_PASSWORD
//
// These require two pre-seeded test accounts in the Supabase project.
// Full live RLS validation procedure is documented in 02-VALIDATION.md.

const LIVE_SUPABASE_URL = process.env.SUPABASE_TEST_URL
const LIVE_PUBLISHABLE_KEY = process.env.SUPABASE_TEST_PUBLISHABLE_KEY
const LIVE_AVAILABLE = !!(LIVE_SUPABASE_URL && LIVE_PUBLISHABLE_KEY)

const describeIfLive = LIVE_AVAILABLE ? describe : describe.skip

describeIfLive('RLS live cross-user isolation (SEC-02, requires test Supabase project)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientA: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientB: any
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    // Dynamic import — @supabase/supabase-js is the JS client (publishable key only)
    const { createClient } = await import('@supabase/supabase-js')

    const emailA = process.env.SUPABASE_TEST_USER_A_EMAIL!
    const passwordA = process.env.SUPABASE_TEST_USER_A_PASSWORD!
    const emailB = process.env.SUPABASE_TEST_USER_B_EMAIL!
    const passwordB = process.env.SUPABASE_TEST_USER_B_PASSWORD!

    clientA = createClient(LIVE_SUPABASE_URL!, LIVE_PUBLISHABLE_KEY!)
    clientB = createClient(LIVE_SUPABASE_URL!, LIVE_PUBLISHABLE_KEY!)

    const { data: sessionA, error: errA } = await clientA.auth.signInWithPassword({
      email: emailA,
      password: passwordA,
    })
    if (errA) throw new Error(`User A sign-in failed: ${errA.message}`)
    userAId = sessionA.user.id

    const { data: sessionB, error: errB } = await clientB.auth.signInWithPassword({
      email: emailB,
      password: passwordB,
    })
    if (errB) throw new Error(`User B sign-in failed: ${errB.message}`)
    userBId = sessionB.user.id
  })

  afterAll(async () => {
    if (clientA) await clientA.auth.signOut()
    if (clientB) await clientB.auth.signOut()
  })

  test('authenticated student can read their own profiles row (SEC-02)', async () => {
    const { data, error } = await clientA
      .from('profiles')
      .select('id, username')
      .eq('id', userAId)
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data.id).toBe(userAId)
  })

  test('authenticated student cannot read another student profiles row (SEC-02)', async () => {
    // User A attempts to read User B's row — RLS should return no rows
    const { data, error } = await clientA
      .from('profiles')
      .select('id, username')
      .eq('id', userBId)
      .maybeSingle()

    // RLS returns an empty result (no row), not an error — this is expected Supabase behavior
    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  test('unauthenticated client cannot read any profiles row (SEC-02)', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const anonClient = createClient(LIVE_SUPABASE_URL!, LIVE_PUBLISHABLE_KEY!)
    // No sign-in — anon role

    const { data, error } = await anonClient
      .from('profiles')
      .select('id')
      .eq('id', userAId)
      .maybeSingle()

    // anon role has SELECT grant but RLS using auth.uid()=id always fails for anon
    // (auth.uid() returns null) — so the query returns no rows
    expect(error).toBeNull()
    expect(data).toBeNull()
  })
})
