// Phase 04 — gating pure-function tests (Wave 0 seams).
//
// Pure-function tests — no mocks, no Supabase client.
// These import from @/lib/diagnostics/gating which does not exist until
// Task 2 (intended RED state).

import {
  computeCooldownUntil,
  isCooldownActive,
  formatCooldownRemaining,
  deriveAllLessonsComplete,
} from '@/lib/diagnostics/gating'

describe('computeCooldownUntil', () => {
  test('adds 3 hours to completedAt', () => {
    const completedAt = new Date('2026-06-22T10:00:00.000Z')
    const until = computeCooldownUntil(completedAt, 3)
    expect(until.getTime()).toBe(completedAt.getTime() + 3 * 60 * 60 * 1000)
  })
})

describe('isCooldownActive (D-U03)', () => {
  const now = new Date('2026-06-22T12:00:00.000Z')
  test('true when now < cooldownUntil', () => {
    expect(isCooldownActive(new Date('2026-06-22T13:00:00.000Z'), now)).toBe(true)
  })
  test('false when cooldownUntil is in the past', () => {
    expect(isCooldownActive(new Date('2026-06-22T11:00:00.000Z'), now)).toBe(false)
  })
  test('false when null', () => {
    expect(isCooldownActive(null, now)).toBe(false)
  })
})

describe('formatCooldownRemaining', () => {
  const now = new Date('2026-06-22T12:00:00.000Z')
  test('formats hours and minutes as "2h 14m"', () => {
    const until = new Date(now.getTime() + (2 * 60 + 14) * 60 * 1000)
    expect(formatCooldownRemaining(until, now)).toBe('2h 14m')
  })
  test('formats minutes-only as "45m" (no leading 0h)', () => {
    const until = new Date(now.getTime() + 45 * 60 * 1000)
    expect(formatCooldownRemaining(until, now)).toBe('45m')
  })
  test('returns empty string when expired', () => {
    const until = new Date(now.getTime() - 60 * 1000)
    expect(formatCooldownRemaining(until, now)).toBe('')
  })
})

describe('deriveAllLessonsComplete (D-E01)', () => {
  test('true only when every id present', () => {
    const ids = ['a', 'b', 'c']
    expect(deriveAllLessonsComplete(ids, new Set(['a', 'b', 'c']))).toBe(true)
  })
  test('false when one missing', () => {
    const ids = ['a', 'b', 'c']
    expect(deriveAllLessonsComplete(ids, new Set(['a', 'b']))).toBe(false)
  })
  test('false for empty list', () => {
    expect(deriveAllLessonsComplete([], new Set<string>())).toBe(false)
  })
})
