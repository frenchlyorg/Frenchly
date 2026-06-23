'use server'

/**
 * Diagnostic Server Actions — DIAG-01 (placement).
 *
 * Security contract (T-04-Tamp-03, T-04-EoP-02, T-04-ID-02, T-04-EoP-03, T-04-Tamp-04):
 *   - user_id ALWAYS derived server-side via getUser(); NEVER accepted from the client.
 *   - attemptId / questionId validated as UUID via zod before any DB call.
 *   - The answer key (correct_answer) is fetched with the ADMIN client only — the
 *     authenticated role has no column grant for it (Plan 02). Grading is server-side.
 *   - The score is recomputed from DB-stored answers via computeScore — a client-reported
 *     score is never read (the input schema has no score field).
 *   - The watermark/placement write to profiles goes through createAdminClient() ONLY —
 *     authenticated cannot UPDATE those columns (Plan 02 grant guard).
 *   - Placement is one-time: a completed placement attempt blocks a retake (D-P02).
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { gradeAnswer, computeScore, derivePlacement } from '@/lib/diagnostics/scoring'
import { drawQuestions } from '@/lib/diagnostics/scoring'
import type { DiagnosticQuestion, GradeResult } from '@/lib/diagnostics/types'

const PLACEMENT_DRAW_COUNT = 10

const SubmitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().max(500).trim(),
})

/**
 * Start (or resume) the one-time placement diagnostic for the current user.
 * - Redirects unauthenticated callers to /login.
 * - Redirects to /dashboard if a completed placement already exists (D-P02).
 * - Reuses an existing in_progress placement (D-U02 resumability).
 * - Otherwise draws 10 questions from the French 1 pool (the floor, D-P03) and
 *   inserts a new in_progress attempt.
 */
export async function startPlacementDiagnostic(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Existing placement attempts for this user (RLS scopes to own rows).
  const { data: existing } = await supabase
    .from('diagnostic_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')

  if (existing?.some((a) => a.status === 'completed')) redirect('/dashboard') // D-P02
  if (existing?.some((a) => a.status === 'in_progress')) {
    revalidatePath('/diagnostic/placement')
    return
  }

  // French 1 is the placement floor — draw from its pool.
  const { data: french1 } = await supabase
    .from('levels')
    .select('id')
    .eq('slug', 'french-1')
    .single()
  if (!french1) throw new Error('Placement level not found')

  const { data: pool } = await supabase
    .from('diagnostic_questions')
    .select('id')
    .eq('level_id', french1.id)
  const poolIds = (pool ?? []).map((q) => q.id)
  const drawnIds = drawQuestions(poolIds, PLACEMENT_DRAW_COUNT)

  // The partial unique index (Plan 02) makes concurrent starts safe.
  const { error } = await supabase.from('diagnostic_attempts').insert({
    user_id: user.id,
    level_id: french1.id,
    diagnostic_type: 'placement',
    status: 'in_progress',
    drawn_question_ids: drawnIds,
    total_count: drawnIds.length,
  })
  if (error) throw new Error('Could not start placement')

  revalidatePath('/diagnostic/placement')
}

/**
 * Grade and record a single placement answer. When the answer completes the
 * drawn set, compute the score server-side, place the student, and advance the
 * watermark via the admin client.
 */
export async function submitDiagnosticAnswer(raw: {
  attemptId: string
  questionId: string
  answer: string
}): Promise<void> {
  // 1. Validate input BEFORE any DB call.
  const parsed = SubmitAnswerSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Invalid input')
  const { attemptId, questionId, answer } = parsed.data

  // 2. Resolve user server-side — never trust the caller.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 3. Load the attempt (RLS scopes to the owner). Verify state + membership.
  const { data: attempt } = await supabase
    .from('diagnostic_attempts')
    .select('id, user_id, level_id, status, drawn_question_ids, diagnostic_type, started_at')
    .eq('id', attemptId)
    .single()
  if (!attempt || attempt.status !== 'in_progress') throw new Error('Attempt not active')
  if (!attempt.drawn_question_ids.includes(questionId)) throw new Error('Question not in attempt')

  // 4. Fetch the answer key via the ADMIN client — authenticated cannot read correct_answer.
  const admin = createAdminClient()
  const { data: question } = await admin
    .from('diagnostic_questions')
    .select('id, level_id, type, question_text, options, correct_answer, lesson_tag, position')
    .eq('id', questionId)
    .single()
  if (!question) throw new Error('Question not found')

  // 5. Grade server-side.
  const result = gradeAnswer(question as DiagnosticQuestion, answer)

  // 6. Record the answer (insert-only; ON CONFLICT DO NOTHING — double-tap safe, no UPDATE grant needed).
  await supabase.from('diagnostic_answers').upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      submitted_answer: answer,
      is_correct: result.correct,
    },
    { onConflict: 'attempt_id,question_id', ignoreDuplicates: true }
  )

  // 7. Are all drawn questions now answered?
  const { data: answers } = await supabase
    .from('diagnostic_answers')
    .select('question_id, is_correct')
    .eq('attempt_id', attemptId)
  const answered = answers ?? []
  const isComplete = attempt.drawn_question_ids.every((id) =>
    answered.some((a) => a.question_id === id)
  )

  if (!isComplete) {
    revalidatePath('/diagnostic/placement')
    return
  }

  // 8. Score from DB-stored answers — never a client-reported score.
  const results: GradeResult[] = answered.map((a) => ({ correct: a.is_correct }))
  const score = computeScore(results)
  const correctCount = results.filter((r) => r.correct).length
  const placementLevel = derivePlacement(score)
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
  )

  await supabase
    .from('diagnostic_attempts')
    .update({
      status: 'completed',
      score,
      correct_count: correctCount,
      total_count: results.length,
      completed_at: new Date().toISOString(),
      elapsed_seconds: elapsedSeconds,
    })
    .eq('id', attemptId)

  // 9. Resolve the placed level's id (French 1 or French 2).
  const { data: placedLevel } = await supabase
    .from('levels')
    .select('id')
    .eq('level_number', placementLevel)
    .single()

  // 10. Advance the watermark via the ADMIN client ONLY (D-S01 / T-04-EoP-02).
  //     watermark = placementLevel unlocks levels 1..placementLevel (D-P04).
  const adminWrite = createAdminClient()
  await adminWrite
    .from('profiles')
    .update({
      unlocked_through_level_number: placementLevel,
      current_level_id: placedLevel?.id ?? attempt.level_id,
    })
    .eq('id', user.id)

  revalidatePath('/diagnostic/placement')
  revalidatePath('/dashboard')
  revalidatePath('/levels/french-1')
  revalidatePath('/levels/french-2')
}
