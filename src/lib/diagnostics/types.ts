/**
 * Phase 04 — Diagnostic domain types.
 *
 * Types only — no runtime imports, no side effects, no DB access.
 * Safe to import in tests and pure functions without a database.
 *
 * SECURITY (Pitfall 1): `DiagnosticQuestion.correct_answer` exists on the type
 * because the SERVER needs it to grade answers. It must NEVER appear in a
 * client-facing select projection — the client receives questions without the
 * answer, and grading happens server-side only (enforced in Plans 04-03/04-05).
 */

export type QuestionType = 'mc' | 'fill_in'

export type AttemptStatus = 'in_progress' | 'completed' | 'failed'

export type DiagnosticType = 'placement' | 'end_of_level'

export interface DiagnosticQuestion {
  id: string
  level_id: string
  type: QuestionType
  question_text: string
  /** MC options; null for fill_in questions. */
  options: string[] | null
  /** SERVER-ONLY — never select this into client-facing queries (Pitfall 1). */
  correct_answer: string
  /** Weak-area grouping tag (e.g. lesson slug); null when ungrouped. */
  lesson_tag: string | null
  position: number
}

export interface DiagnosticAttempt {
  id: string
  user_id: string
  level_id: string
  diagnostic_type: DiagnosticType
  status: AttemptStatus
  drawn_question_ids: string[]
  score: number | null
  correct_count: number | null
  total_count: number | null
  started_at: string
  completed_at: string | null
  cooldown_until: string | null
  elapsed_seconds: number | null
}

export interface GradeResult {
  correct: boolean
  /**
   * Soft note surfaced when a fill-in answer is graded correct but differed
   * from the canonical spelling (e.g. missing accent). Never affects scoring.
   */
  accentNote?: string
}
