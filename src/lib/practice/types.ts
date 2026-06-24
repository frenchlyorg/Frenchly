/**
 * Practice problem discriminated union types.
 * The `type` field is the discriminant — used by Zod schema and component router.
 */

export type MCProblem = {
  type: 'mc'
  prompt: string
  options: string[]       // 2–4 options
  correctAnswer: string   // must be one of options
}

export type FillInProblem = {
  type: 'fill-in'
  prompt: string
  correctAnswer: string
}

export type ConjugationTableProblem = {
  type: 'conjugation-table'
  prompt: string                     // e.g. "Conjugate parler in the present tense."
  verb: string
  answers: {                         // keyed by pronoun
    je: string
    tu: string
    il: string
    nous: string
    vous: string
    ils: string
  }
}

export type ConjugationSingleProblem = {
  type: 'conjugation-single'
  prompt: string                     // e.g. "Je ___ (parler)"
  correctAnswer: string              // just the one form
}

export type MatchingProblem = {
  type: 'matching'
  prompt: string
  pairs: Array<{ left: string; right: string }>   // 2–6 pairs
}

export type ProblemData =
  | MCProblem
  | FillInProblem
  | ConjugationTableProblem
  | ConjugationSingleProblem
  | MatchingProblem
