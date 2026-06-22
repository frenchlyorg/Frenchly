// Phase 3 RLS static analysis — LESSON-01, LESSON-02
//
// Validates migration 20260622_phase3_lessons.sql expresses correct schema
// and security policies WITHOUT requiring a live database.
//
// Two tables of concern:
//   Content tables (levels, lessons, sub_components) — open read for authenticated, never anon
//   Progress table (sub_component_progress)          — per-student RLS using auth.uid()
//
// Mirrors __tests__/rls.test.ts pattern (Phase 2).

import * as fs from 'fs'
import * as path from 'path'

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../supabase/migrations/20260622_phase3_lessons.sql'
)

function loadMigrationSQL(): string {
  if (!fs.existsSync(MIGRATION_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_PATH}`)
  }
  return fs.readFileSync(MIGRATION_PATH, 'utf-8')
}

describe('Phase 3 RLS static analysis (LESSON-01, LESSON-02)', () => {
  let sql: string

  beforeAll(() => {
    sql = loadMigrationSQL()
  })

  // ─── Content tables: RLS enabled ─────────────────────────────────────────

  test('levels table has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.levels enable row level security/)
  })

  test('lessons table has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.lessons enable row level security/)
  })

  test('sub_components table has RLS enabled', () => {
    expect(sql).toMatch(/alter table public\.sub_components enable row level security/)
  })

  // ─── Content tables: authenticated-only SELECT policies ──────────────────

  test('content table policies use USING (true) for authenticated SELECT', () => {
    // At least one content table must have the authenticated/using(true) pattern
    expect(sql).toMatch(/for select\s+to authenticated\s+using\s*\(true\)/i)
  })

  test('no content SELECT policy targets anon role (T-03-03 Information Disclosure)', () => {
    // Content must not be visible to unauthenticated visitors
    // Verify: no policy block for content tables grants select to anon
    expect(sql).not.toMatch(
      /on public\.(levels|lessons|sub_components)[\s\S]*?to anon/i
    )
  })

  // ─── sub_component_progress: RLS enabled ─────────────────────────────────

  test('sub_component_progress table has RLS enabled (LESSON-02)', () => {
    expect(sql).toMatch(
      /alter table public\.sub_component_progress enable row level security/
    )
  })

  // ─── sub_component_progress: per-student policies use (select auth.uid()) ─

  test('progress SELECT policy scopes to (select auth.uid()) = user_id (T-03-05)', () => {
    // Subquery form — stable evaluation, not per-row auth.uid() call
    expect(sql).toMatch(
      /for select[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = user_id\)/i
    )
  })

  test('progress INSERT policy uses with check (select auth.uid()) = user_id (T-03-02)', () => {
    expect(sql).toMatch(
      /for insert[\s\S]*?with check\s*\(\(select auth\.uid\(\)\) = user_id\)/i
    )
  })

  test('progress UPDATE policy scopes to (select auth.uid()) = user_id (T-03-02)', () => {
    expect(sql).toMatch(
      /for update[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = user_id\)/i
    )
    expect(sql).toMatch(
      /for update[\s\S]*?with check\s*\(\(select auth\.uid\(\)\) = user_id\)/i
    )
  })

  // ─── profiles.current_level_id: column grant guard (T-03-01) ─────────────

  test('migration adds current_level_id column to profiles (D-L05)', () => {
    expect(sql).toMatch(/add column current_level_id/)
  })

  test('current_level_id is NOT in any authenticated update grant (T-03-01 Elevation of Privilege)', () => {
    // Authenticated role must not be able to self-set current_level_id
    expect(sql).not.toMatch(/grant update \([^)]*current_level_id/i)
  })

  // ─── handle_new_user trigger: sets current_level_id for new users ─────────

  test('handle_new_user function is CREATE OR REPLACE (not a new trigger — Phase 2 trigger reused)', () => {
    expect(sql).toMatch(/create or replace function public\.handle_new_user/i)
  })

  test('handle_new_user function references level_number = 1 to default new users to French 1', () => {
    expect(sql).toMatch(/level_number\s*=\s*1/)
  })

  test('handle_new_user function inserts current_level_id into profiles (Pitfall 3 guard)', () => {
    expect(sql).toMatch(/current_level_id/)
  })

  // ─── Seed data: French 1 and French 2 present ────────────────────────────

  test('migration seeds French 1 level slug', () => {
    expect(sql).toMatch(/french-1/)
  })

  test('migration seeds French 2 locked stub', () => {
    expect(sql).toMatch(/french-2/)
  })

  // ─── FK cascade guards (T-03-04 orphaned progress rows) ──────────────────

  test('sub_component_progress references auth.users on delete cascade', () => {
    expect(sql).toMatch(/references auth\.users on delete cascade/)
  })

  test('sub_component_progress references sub_components on delete cascade', () => {
    expect(sql).toMatch(/references public\.sub_components on delete cascade/)
  })
})
