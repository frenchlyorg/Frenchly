/**
 * Pure functions — no DB access, no Next.js imports, no side effects.
 * Safe to import in tests without Supabase.
 *
 * All fill-in and conjugation grading reuses normalizeFillin from diagnostics/scoring.ts
 * (accent-insensitive, trim, lowercase, NFD diacritic strip).
 */

import { normalizeFillin } from '@/lib/diagnostics/scoring'

export type GradeResult = {
  correct: boolean
  accentNote?: string   // set when correct but raw form differed from canonical spelling
}

/**
 * Grade a fill-in answer with accent leniency.
 * Blank submissions always fail — blank guard fires before normalization (Pitfall 1 guard).
 *
 * @param submitted - the raw string the student typed
 * @param correctAnswer - the canonical correct answer
 * @returns GradeResult with accentNote when correct but accent differed
 */
export function gradeFillin(submitted: string, correctAnswer: string): GradeResult {
  // Blank guard: must fire before normalization so blank never grades as correct
  if (submitted.trim() === '') return { correct: false }

  const correct = normalizeFillin(submitted) === normalizeFillin(correctAnswer)
  if (!correct) return { correct: false }

  // Correct answer — check if raw form differed (accent/case difference)
  const rawDiffers = submitted.trim().toLowerCase() !== correctAnswer.toLowerCase()
  return rawDiffers ? { correct: true, accentNote: correctAnswer } : { correct: true }
}

/**
 * Grade a 6-form conjugation table.
 * Returns per-pronoun GradeResult. Absent keys are treated as blank (correct: false).
 * The conjugation table always auto-completes regardless of score (D-06).
 *
 * @param submitted - map of pronoun → student's submitted form
 * @param answers - map of pronoun → correct form
 */
export function gradeConjugationTable(
  submitted: Record<string, string>,
  answers: Record<string, string>
): Record<string, GradeResult> {
  const pronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const
  const results: Record<string, GradeResult> = {}
  for (const p of pronouns) {
    // Use ?? '' so absent keys are treated as blank submissions → { correct: false }
    results[p] = gradeFillin(submitted[p] ?? '', answers[p] ?? '')
  }
  return results
}

/**
 * Grade matching pairs. Returns per-left-item boolean correctness.
 * Auto-completes on any "Check" submission (D-05/D-06).
 *
 * @param submitted - map of left → right (student's pairing)
 * @param pairs - canonical answer pairs
 */
export function gradeMatching(
  submitted: Record<string, string>,
  pairs: Array<{ left: string; right: string }>
): Record<string, boolean> {
  const answer = Object.fromEntries(pairs.map(p => [p.left, p.right]))
  const results: Record<string, boolean> = {}
  for (const left of Object.keys(submitted)) {
    results[left] = submitted[left] === answer[left]
  }
  return results
}
