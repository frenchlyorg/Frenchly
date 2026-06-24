/**
 * Zod schemas for practice problem JSON parsing.
 * parseProblemContent() is the single entry point — returns null for any invalid input.
 * Never uses `as ProblemData` type cast (Pitfall 2 guard).
 */

import { z } from 'zod'
import type { ProblemData } from './types'

const MCSchema = z.object({
  type: z.literal('mc'),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctAnswer: z.string(),
})

const FillInSchema = z.object({
  type: z.literal('fill-in'),
  prompt: z.string(),
  correctAnswer: z.string(),
})

const ConjTableSchema = z.object({
  type: z.literal('conjugation-table'),
  prompt: z.string(),
  verb: z.string(),
  answers: z.object({
    je: z.string(),
    tu: z.string(),
    il: z.string(),
    nous: z.string(),
    vous: z.string(),
    ils: z.string(),
  }),
})

const ConjSingleSchema = z.object({
  type: z.literal('conjugation-single'),
  prompt: z.string(),
  correctAnswer: z.string(),
})

const MatchingSchema = z.object({
  type: z.literal('matching'),
  prompt: z.string(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2).max(6),
})

export const ProblemDataSchema = z.discriminatedUnion('type', [
  MCSchema,
  FillInSchema,
  ConjTableSchema,
  ConjSingleSchema,
  MatchingSchema,
])

/**
 * Parse and validate a JSON string from sub_components.content.
 * Returns null for: null input, empty string, malformed JSON, schema mismatch.
 * Never throws. Never uses `as ProblemData`.
 */
export function parseProblemContent(raw: string | null): ProblemData | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return ProblemDataSchema.parse(parsed)
  } catch {
    return null
  }
}
