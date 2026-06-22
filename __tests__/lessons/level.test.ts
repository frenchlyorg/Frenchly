// LESSON-04: isLevelLocked — Wave 0 scaffold
//
// Tests the locked/unlocked derivation logic for level pages (D-L05, D-L06).
// This is a pure-function test — no mocks, no Supabase client.
//
// Plan 02 will create the deriveIsLevelLocked helper (likely at
// '@/lib/lessons/locking' or similar) and flip these todos to real tests.
//
// NOTE: The helper is NOT imported at top level here — import-safe scaffold.
// Plan 02 will add the import once the module exists.

// ─── LESSON-04 test stubs (Plan 02 will flip these to real tests) ─────────────

describe('isLevelLocked (LESSON-04)', () => {
  test.todo('isLevelLocked returns true when current_level_id does not match level id')

  test.todo('isLevelLocked returns false for French 1 (matching current_level_id)')

  test.todo('isLevelLocked treats null current_level_id as French 1 (unlocked)')
})
