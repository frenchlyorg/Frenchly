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

// ─── DIAG-03: numeric watermark generalization ─────────────────────────────────

describe('deriveIsLevelLocked — watermark (DIAG-03)', () => {
  test('watermark=1, levelNumber=2 → true (French 2 locked when placed at French 1)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l2', levelNumber: 2, currentLevelId: null, unlockedThroughLevelNumber: 1 })
    ).toBe(true)
  })

  test('watermark=2, levelNumber=1 → false (French 1 stays accessible, D-P04)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l1', levelNumber: 1, currentLevelId: null, unlockedThroughLevelNumber: 2 })
    ).toBe(false)
  })

  test('watermark=2, levelNumber=2 → false (current level unlocked)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l2', levelNumber: 2, currentLevelId: null, unlockedThroughLevelNumber: 2 })
    ).toBe(false)
  })

  test('watermark=2, levelNumber=3 → true (no hard-coded ceiling — future level locked)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l3', levelNumber: 3, currentLevelId: null, unlockedThroughLevelNumber: 2 })
    ).toBe(true)
  })

  test('null watermark + matching currentLevelId → false (Phase 3 fallback preserved)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'same', levelNumber: 1, currentLevelId: 'same', unlockedThroughLevelNumber: null })
    ).toBe(false)
  })

  test('null watermark + mismatched currentLevelId → true (Phase 3 fallback preserved)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l2', levelNumber: 2, currentLevelId: 'l1', unlockedThroughLevelNumber: null })
    ).toBe(true)
  })

  test('null watermark + null currentLevelId → false (new-student fallback preserved)', () => {
    expect(
      deriveIsLevelLocked({ levelId: 'l1', levelNumber: 1, currentLevelId: null, unlockedThroughLevelNumber: null })
    ).toBe(false)
  })
})
