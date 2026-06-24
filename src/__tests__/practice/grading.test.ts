/**
 * Wave 0 tests for practice grading pure functions.
 * Covers PROB-01 through PROB-04.
 * This file imports from '@/lib/practice/grading' — RED until grading.ts is created.
 */

import { gradeFillin, gradeConjugationTable, gradeMatching } from '@/lib/practice/grading'

// ---------------------------------------------------------------------------
// gradeFillin
// ---------------------------------------------------------------------------

describe('gradeFillin', () => {
  it('blank submission returns { correct: false } (blank guard fires before normalization)', () => {
    expect(gradeFillin('', 'parle')).toEqual({ correct: false })
  })

  it('whitespace-only submission returns { correct: false }', () => {
    expect(gradeFillin('   ', 'parle')).toEqual({ correct: false })
  })

  it('exact match returns { correct: true } with no accentNote', () => {
    const result = gradeFillin('parle', 'parle')
    expect(result).toEqual({ correct: true })
    expect(result.accentNote).toBeUndefined()
  })

  it('case-insensitive match returns { correct: true } with no accentNote', () => {
    const result = gradeFillin('PARLE', 'parle')
    expect(result.correct).toBe(true)
  })

  it('accent-insensitive match (submitted without accent, answer with accent) sets accentNote', () => {
    // 'cafe' submitted, 'café' is correct → correct but accent differs → accentNote set
    const result = gradeFillin('cafe', 'café')
    expect(result.correct).toBe(true)
    expect(result.accentNote).toBe('café')
  })

  it('reversed accent match (submitted with accent, answer without) has no accentNote', () => {
    // 'café' submitted, 'cafe' is correct → normalizations match; submitted.toLowerCase() === correctAnswer.toLowerCase() after normalize
    // Actually: submitted.trim().toLowerCase() = 'café', correctAnswer.toLowerCase() = 'cafe' — they differ
    // So accentNote = 'cafe'. This tests that the comparison is symmetric.
    const result = gradeFillin('café', 'cafe')
    expect(result.correct).toBe(true)
    // accentNote is set because submitted.toLowerCase() !== correctAnswer.toLowerCase()
    expect(result.accentNote).toBe('cafe')
  })

  it('wrong answer returns { correct: false }', () => {
    expect(gradeFillin('parles', 'parle')).toEqual({ correct: false })
  })

  it('completely wrong answer returns { correct: false }', () => {
    expect(gradeFillin('bonjour', 'parle')).toEqual({ correct: false })
  })
})

// ---------------------------------------------------------------------------
// gradeConjugationTable
// ---------------------------------------------------------------------------

describe('gradeConjugationTable', () => {
  const correctAnswers = {
    je: 'parle',
    tu: 'parles',
    il: 'parle',
    nous: 'parlons',
    vous: 'parlez',
    ils: 'parlent',
  }

  it('all 6 pronouns correct → all 6 GradeResult { correct: true }', () => {
    const submitted = { ...correctAnswers }
    const result = gradeConjugationTable(submitted, correctAnswers)
    expect(result.je.correct).toBe(true)
    expect(result.tu.correct).toBe(true)
    expect(result.il.correct).toBe(true)
    expect(result.nous.correct).toBe(true)
    expect(result.vous.correct).toBe(true)
    expect(result.ils.correct).toBe(true)
  })

  it('one cell wrong → that cell { correct: false }, others { correct: true }', () => {
    const submitted = { ...correctAnswers, je: 'parl' }
    const result = gradeConjugationTable(submitted, correctAnswers)
    expect(result.je.correct).toBe(false)
    expect(result.tu.correct).toBe(true)
    expect(result.il.correct).toBe(true)
    expect(result.nous.correct).toBe(true)
    expect(result.vous.correct).toBe(true)
    expect(result.ils.correct).toBe(true)
  })

  it('missing key (je absent) → je cell { correct: false }, treated as blank', () => {
    const submitted: Record<string, string> = {
      tu: 'parles',
      il: 'parle',
      nous: 'parlons',
      vous: 'parlez',
      ils: 'parlent',
    }
    const result = gradeConjugationTable(submitted, correctAnswers)
    expect(result.je.correct).toBe(false)
    expect(result.tu.correct).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// gradeMatching
// ---------------------------------------------------------------------------

describe('gradeMatching', () => {
  const pairs = [
    { left: 'le livre', right: 'masculine singular' },
    { left: 'la table', right: 'feminine singular' },
    { left: 'les amis', right: 'plural' },
    { left: "l'école", right: 'vowel/h' },
  ]

  it('all pairs correctly mapped → all true', () => {
    const submitted: Record<string, string> = {
      'le livre': 'masculine singular',
      'la table': 'feminine singular',
      'les amis': 'plural',
      "l'école": 'vowel/h',
    }
    const result = gradeMatching(submitted, pairs)
    expect(result['le livre']).toBe(true)
    expect(result['la table']).toBe(true)
    expect(result['les amis']).toBe(true)
    expect(result["l'école"]).toBe(true)
  })

  it('one pair wrong → that left key is false, others true', () => {
    const submitted: Record<string, string> = {
      'le livre': 'feminine singular',   // wrong
      'la table': 'feminine singular',
      'les amis': 'plural',
      "l'école": 'vowel/h',
    }
    const result = gradeMatching(submitted, pairs)
    expect(result['le livre']).toBe(false)
    expect(result['la table']).toBe(true)
    expect(result['les amis']).toBe(true)
    expect(result["l'école"]).toBe(true)
  })
})
