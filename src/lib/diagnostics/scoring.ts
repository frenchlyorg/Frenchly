/**
 * Phase 04 — Diagnostic scoring pure functions.
 *
 * Pure functions — no imports beyond local types, no side effects, no DB access.
 * Safe to import in tests without a database. These are recomputed SERVER-SIDE
 * in Plans 04-03/04-05; the client-reported score is never trusted.
 */

import type { DiagnosticQuestion, GradeResult } from './types'

/**
 * Normalize a fill-in answer for lenient comparison (D-D03):
 * trim, lowercase, strip combining diacritical marks (U+0300–U+036F).
 * Blank input returns '' so the caller's blank guard can reject it.
 */
export function normalizeFillin(raw: string): string {
  if (raw.trim() === '') return ''
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Grade a single answer.
 * - Blank submissions always grade incorrect — leniency does NOT apply (Pitfall 6).
 * - MC: exact match against correct_answer.
 * - fill_in: lenient (accent/case/whitespace-insensitive). When correct but the
 *   raw answer differs from the canonical spelling, surface accentNote.
 */
export function gradeAnswer(
  question: DiagnosticQuestion,
  submitted: string
): GradeResult {
  if (submitted.trim() === '') return { correct: false }

  if (question.type === 'mc') {
    return { correct: submitted === question.correct_answer }
  }

  const correct = normalizeFillin(submitted) === normalizeFillin(question.correct_answer)
  if (!correct) return { correct: false }

  const rawDiffers =
    submitted.trim().toLowerCase() !== question.correct_answer.toLowerCase()
  return rawDiffers ? { correct: true, accentNote: question.correct_answer } : { correct: true }
}

/** Fraction correct over total. Empty results → 0. */
export function computeScore(results: GradeResult[]): number {
  if (results.length === 0) return 0
  const correct = results.filter((r) => r.correct).length
  return correct / results.length
}

/** Placement threshold (D-P03): ≥0.8 → French 2, else French 1. */
export function derivePlacement(score: number): 1 | 2 {
  return score >= 0.8 ? 2 : 1
}

/** End-of-level threshold (D-E02): ≥0.8 passes. */
export function derivePassFail(score: number): 'pass' | 'fail' {
  return score >= 0.8 ? 'pass' : 'fail'
}

/**
 * Draw `count` items from `pool` with no duplicates (D-D04, D-E04).
 * Fisher-Yates shuffle of a copy, then slice. count > pool returns whole pool.
 */
export function drawQuestions<T>(pool: T[], count: number): T[] {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(count, copy.length))
}
