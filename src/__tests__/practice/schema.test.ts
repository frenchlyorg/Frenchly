/**
 * Wave 0 tests for parseProblemContent() Zod validation.
 * Covers PROB-05.
 */

import { parseProblemContent } from '@/lib/practice/schema'

describe('parseProblemContent', () => {
  // ---------------------------------------------------------------------------
  // Null / empty / malformed input
  // ---------------------------------------------------------------------------

  it('null input → null (no throw)', () => {
    expect(parseProblemContent(null)).toBeNull()
  })

  it('empty string → null (no throw)', () => {
    expect(parseProblemContent('')).toBeNull()
  })

  it('malformed JSON string → null (no throw)', () => {
    expect(parseProblemContent('{not valid json')).toBeNull()
  })

  it('valid JSON but wrong shape → null (Zod rejection)', () => {
    expect(parseProblemContent('{"foo":"bar"}')).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Valid types
  // ---------------------------------------------------------------------------

  it('valid MC JSON → returns typed MCProblem with type === "mc"', () => {
    const raw = JSON.stringify({
      type: 'mc',
      prompt: 'Which greeting is formal?',
      options: ['Salut', 'Bonjour', 'Coucou'],
      correctAnswer: 'Bonjour',
    })
    const result = parseProblemContent(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('mc')
    if (result?.type === 'mc') {
      expect(result.options).toHaveLength(3)
      expect(result.correctAnswer).toBe('Bonjour')
    }
  })

  it('valid fill-in JSON → returns typed FillInProblem with type === "fill-in"', () => {
    const raw = JSON.stringify({
      type: 'fill-in',
      prompt: 'How do you say "good evening"?',
      correctAnswer: 'Bonsoir',
    })
    const result = parseProblemContent(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('fill-in')
    if (result?.type === 'fill-in') {
      expect(result.correctAnswer).toBe('Bonsoir')
    }
  })

  it('valid conjugation-table JSON → returns typed ConjugationTableProblem', () => {
    const raw = JSON.stringify({
      type: 'conjugation-table',
      prompt: 'Conjugate parler in the present tense.',
      verb: 'parler',
      answers: {
        je: 'parle',
        tu: 'parles',
        il: 'parle',
        nous: 'parlons',
        vous: 'parlez',
        ils: 'parlent',
      },
    })
    const result = parseProblemContent(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('conjugation-table')
    if (result?.type === 'conjugation-table') {
      expect(result.verb).toBe('parler')
      expect(result.answers.je).toBe('parle')
    }
  })

  it('valid conjugation-single JSON → returns typed ConjugationSingleProblem', () => {
    const raw = JSON.stringify({
      type: 'conjugation-single',
      prompt: 'Je ___ (parler). Fill in the correct form.',
      correctAnswer: 'parle',
    })
    const result = parseProblemContent(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('conjugation-single')
    if (result?.type === 'conjugation-single') {
      expect(result.correctAnswer).toBe('parle')
    }
  })

  it('valid matching JSON → returns typed MatchingProblem', () => {
    const raw = JSON.stringify({
      type: 'matching',
      prompt: 'Match each noun to its correct article.',
      pairs: [
        { left: 'le livre', right: 'masculine singular' },
        { left: 'la table', right: 'feminine singular' },
      ],
    })
    const result = parseProblemContent(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('matching')
    if (result?.type === 'matching') {
      expect(result.pairs).toHaveLength(2)
    }
  })

  // ---------------------------------------------------------------------------
  // Zod constraint rejections
  // ---------------------------------------------------------------------------

  it('MC JSON missing correctAnswer field → null (Zod rejection)', () => {
    const raw = JSON.stringify({
      type: 'mc',
      prompt: 'Which greeting is formal?',
      options: ['Salut', 'Bonjour'],
      // correctAnswer intentionally omitted
    })
    expect(parseProblemContent(raw)).toBeNull()
  })

  it('MC JSON with options array of length 1 → null (min(2) constraint)', () => {
    const raw = JSON.stringify({
      type: 'mc',
      prompt: 'Which greeting is formal?',
      options: ['Bonjour'],
      correctAnswer: 'Bonjour',
    })
    expect(parseProblemContent(raw)).toBeNull()
  })
})
