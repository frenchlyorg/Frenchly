// LESSON-04: isLevelLocked — level lock derivation tests
//
// Tests the locked/unlocked derivation logic for level pages (D-L05, D-L06).
// Pure-function test — no mocks, no Supabase client.

import { deriveIsLevelLocked } from '@/lib/lessons/locking'

// ─── LESSON-04 tests ──────────────────────────────────────────────────────────

describe('isLevelLocked (LESSON-04)', () => {
  test('isLevelLocked returns true when current_level_id does not match level id', () => {
    const result = deriveIsLevelLocked({
      levelId: 'level-french-2-uuid',
      levelNumber: 2,
      currentLevelId: 'level-french-1-uuid',
    })
    expect(result).toBe(true)
  })

  test('isLevelLocked returns false for French 1 (matching current_level_id)', () => {
    const result = deriveIsLevelLocked({
      levelId: 'level-french-1-uuid',
      levelNumber: 1,
      currentLevelId: 'level-french-1-uuid',
    })
    expect(result).toBe(false)
  })

  test('isLevelLocked treats null current_level_id as French 1 (unlocked)', () => {
    const result = deriveIsLevelLocked({
      levelId: 'level-french-1-uuid',
      levelNumber: 1,
      currentLevelId: null,
    })
    expect(result).toBe(false)
  })
})
