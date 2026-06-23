// Phase 04 — scoring pure-function tests (Wave 0 seams).
//
// Pure-function tests — no mocks, no Supabase client.
// These import from @/lib/diagnostics/scoring which does not exist until
// Task 2 (intended RED state).

import {
  normalizeFillin,
  gradeAnswer,
  computeScore,
  derivePlacement,
  derivePassFail,
  drawQuestions,
} from '@/lib/diagnostics/scoring'
import type { DiagnosticQuestion, GradeResult } from '@/lib/diagnostics/types'

const fillInQ: DiagnosticQuestion = {
  id: 'q-fill',
  level_id: 'lvl-1',
  type: 'fill_in',
  question_text: 'Translate "coffee"',
  options: null,
  correct_answer: 'café',
  lesson_tag: 'vocab',
  position: 1,
}

const mcQ: DiagnosticQuestion = {
  id: 'q-mc',
  level_id: 'lvl-1',
  type: 'mc',
  question_text: 'Definite article for "livre"',
  options: ['le', 'la', 'les'],
  correct_answer: 'le',
  lesson_tag: 'articles',
  position: 2,
}

describe('normalizeFillin', () => {
  test('strips accents (café → cafe)', () => {
    expect(normalizeFillin('café')).toBe('cafe')
  })
  test('lowercases and trims', () => {
    expect(normalizeFillin('  Cafe  ')).toBe('cafe')
  })
  test('returns empty string for blank input', () => {
    expect(normalizeFillin('   ')).toBe('')
    expect(normalizeFillin('')).toBe('')
  })
})

describe('gradeAnswer — fill_in', () => {
  test('café == cafe == Cafe all grade correct (D-D03)', () => {
    expect(gradeAnswer(fillInQ, 'café').correct).toBe(true)
    expect(gradeAnswer(fillInQ, 'cafe').correct).toBe(true)
    expect(gradeAnswer(fillInQ, 'Cafe').correct).toBe(true)
  })
  test('blank submission always grades incorrect (Pitfall 6)', () => {
    expect(gradeAnswer(fillInQ, '').correct).toBe(false)
    expect(gradeAnswer(fillInQ, '   ').correct).toBe(false)
  })
  test('sets accentNote when normalized match but raw differs', () => {
    const r = gradeAnswer(fillInQ, 'cafe')
    expect(r.correct).toBe(true)
    expect(r.accentNote).toBe('café')
  })
  test('exact match → no accentNote', () => {
    const r = gradeAnswer(fillInQ, 'café')
    expect(r.correct).toBe(true)
    expect(r.accentNote).toBeUndefined()
  })
})

describe('gradeAnswer — mc', () => {
  test('correct when submitted === correct_answer', () => {
    expect(gradeAnswer(mcQ, 'le').correct).toBe(true)
  })
  test('incorrect otherwise', () => {
    expect(gradeAnswer(mcQ, 'la').correct).toBe(false)
  })
})

describe('computeScore', () => {
  test('returns correct/total ratio', () => {
    const results: GradeResult[] = [
      { correct: true },
      { correct: true },
      { correct: false },
      { correct: true },
    ]
    expect(computeScore(results)).toBeCloseTo(0.75)
  })
  test('empty array → 0', () => {
    expect(computeScore([])).toBe(0)
  })
})

describe('derivePlacement (D-P03)', () => {
  test('0.8 → French 2', () => {
    expect(derivePlacement(0.8)).toBe(2)
  })
  test('0.79 → French 1', () => {
    expect(derivePlacement(0.79)).toBe(1)
  })
})

describe('derivePassFail (D-E02)', () => {
  test('0.8 → pass', () => {
    expect(derivePassFail(0.8)).toBe('pass')
  })
  test('0.79 → fail', () => {
    expect(derivePassFail(0.79)).toBe('fail')
  })
})

describe('drawQuestions', () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  test('returns exactly N items', () => {
    expect(drawQuestions(pool, 4)).toHaveLength(4)
  })
  test('no duplicates, all from pool', () => {
    const drawn = drawQuestions(pool, 6)
    expect(new Set(drawn).size).toBe(drawn.length)
    drawn.forEach((d) => expect(pool).toContain(d))
  })
  test('count > pool returns whole pool', () => {
    expect(drawQuestions(pool, 99)).toHaveLength(pool.length)
  })
})
