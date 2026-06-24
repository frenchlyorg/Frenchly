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
import {
  gradeAnswer,
  computeScore,
  derivePlacement,
  derivePassFail,
  drawQuestions,
} from '@/lib/diagnostics/scoring'
import { computeCooldownUntil, isCooldownActive } from '@/lib/diagnostics/gating'
import type { DiagnosticQuestion, GradeResult } from '@/lib/diagnostics/types'

const PLACEMENT_DRAW_COUNT = 10
const END_OF_LEVEL_DRAW_COUNT = 10
const COOLDOWN_HOURS = 3

const SubmitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().max(500).trim(),
})

const StartEndOfLevelSchema = z.object({
  levelId: z.string().uuid(),
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
 * Skip placement and start at French 1. Creates a completed placement attempt
 * (so the gate clears) and sets the watermark to 1. Admin client required for
 * the watermark write (authenticated role has no UPDATE grant on that column).
 */
export async function skipPlacementDiagnostic(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Block if already placed (D-P02 — one-time only).
  const { data: existing } = await supabase
    .from('diagnostic_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')
  if (existing?.some((a) => a.status === 'completed')) redirect('/dashboard')

  const { data: french1 } = await supabase
    .from('levels')
    .select('id')
    .eq('slug', 'french-1')
    .single()
  if (!french1) throw new Error('French 1 level not found')

  // Insert a zero-score completed placement so the gate never shows again.
  await supabase.from('diagnostic_attempts').insert({
    user_id: user.id,
    level_id: french1.id,
    diagnostic_type: 'placement',
    status: 'completed',
    drawn_question_ids: [],
    score: 0,
    correct_count: 0,
    total_count: 0,
  })

  // Set watermark to 1 (French 1 unlocked). Admin client required.
  const admin = createAdminClient()
  await admin.from('profiles').update({ unlocked_through_level_number: 1 }).eq('id', user.id)

  redirect('/dashboard')
}

/**
 * Start (or resume) an end-of-level diagnostic for the given level (DIAG-02).
 * - Redirects unauthenticated callers to /login.
 * - Blocks a retry while a prior failed attempt's per-level cooldown is active
 *   (server-side re-check — the client countdown is display-only). D-U03 / Pitfall 3.
 * - Re-draws a fresh question set on each new attempt (D-E04 — not the identical set).
 * - Resumes an existing in_progress attempt rather than creating a duplicate.
 */
export async function startEndOfLevelDiagnostic(raw: { levelId: string }): Promise<void> {
  const parsed = StartEndOfLevelSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Invalid input')
  const { levelId } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // The end-of-level route is keyed by slug — resolve it for the redirect.
  const { data: level } = await supabase.from('levels').select('slug').eq('id', levelId).single()
  const levelSlug = level?.slug ?? ''

  // Most recent end-of-level attempt for this (user, level).
  const { data: latest } = await supabase
    .from('diagnostic_attempts')
    .select('id, status, cooldown_until')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .eq('diagnostic_type', 'end_of_level')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Active per-level cooldown on a prior fail blocks the retry (D-U03).
  if (
    latest?.status === 'failed' &&
    isCooldownActive(latest.cooldown_until ? new Date(latest.cooldown_until) : null)
  ) {
    throw new Error('Cooldown active')
  }

  // Create a fresh attempt unless one is already in progress (resume).
  if (latest?.status !== 'in_progress') {
    const { data: pool } = await supabase
      .from('diagnostic_questions')
      .select('id')
      .eq('level_id', levelId)
    const poolIds = (pool ?? []).map((q) => q.id)
    const drawnIds = drawQuestions(poolIds, END_OF_LEVEL_DRAW_COUNT)

    const { error } = await supabase.from('diagnostic_attempts').insert({
      user_id: user.id,
      level_id: levelId,
      diagnostic_type: 'end_of_level',
      status: 'in_progress',
      drawn_question_ids: drawnIds,
      total_count: drawnIds.length,
    })
    if (error) throw new Error('Could not start diagnostic')
  }

  revalidatePath(`/diagnostic/end-of-level/${levelSlug}`)
  redirect(`/diagnostic/end-of-level/${levelSlug}`)
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
  const isComplete = attempt.drawn_question_ids.every((id: string) =>
    answered.some((a: { question_id: string }) => a.question_id === id)
  )

  if (!isComplete) {
    revalidatePath('/diagnostic/placement')
    return
  }

  // 8. Score from DB-stored answers — never a client-reported score.
  const results: GradeResult[] = answered.map((a) => ({ correct: a.is_correct }))
  const score = computeScore(results)
  const correctCount = results.filter((r) => r.correct).length
  const completedAt = new Date()
  const elapsedSeconds = Math.max(
    0,
    Math.floor((completedAt.getTime() - new Date(attempt.started_at).getTime()) / 1000)
  )

  // 9. Placement branch — place the student and unlock through the placed level.
  if (attempt.diagnostic_type === 'placement') {
    const placementLevel = derivePlacement(score)

    await supabase
      .from('diagnostic_attempts')
      .update({
        status: 'completed',
        score,
        correct_count: correctCount,
        total_count: results.length,
        completed_at: completedAt.toISOString(),
        elapsed_seconds: elapsedSeconds,
      })
      .eq('id', attemptId)

    const { data: placedLevel } = await supabase
      .from('levels')
      .select('id')
      .eq('level_number', placementLevel)
      .single()

    // Watermark write via the ADMIN client ONLY (D-S01 / T-04-EoP-02).
    const adminWrite = createAdminClient()
    await adminWrite
      .from('profiles')
      .update({
        unlocked_through_level_number: placementLevel,
        current_level_id: placedLevel?.id ?? attempt.level_id,
      })
      .eq('id', user.id)

    revalidatePath('/dashboard')
    revalidatePath('/levels/french-1')
    revalidatePath('/levels/french-2')

    // Surface the result screen once. A later bare visit to /diagnostic/placement
    // hits the completed-attempt guard and redirects to /dashboard (D-P02).
    redirect('/diagnostic/placement?result=1')
  }

  // 10. End-of-level branch (DIAG-02) — pass advances the watermark; fail starts a cooldown.
  const outcome = derivePassFail(score)
  const update: Record<string, unknown> = {
    status: outcome === 'pass' ? 'completed' : 'failed',
    score,
    correct_count: correctCount,
    total_count: results.length,
    completed_at: completedAt.toISOString(),
    elapsed_seconds: elapsedSeconds,
  }
  if (outcome === 'fail') {
    // 3-hour per-level cooldown (D-E03). No watermark advance on fail.
    update.cooldown_until = computeCooldownUntil(completedAt, COOLDOWN_HOURS).toISOString()
  }
  await supabase.from('diagnostic_attempts').update(update).eq('id', attemptId)

  const { data: thisLevel } = await supabase
    .from('levels')
    .select('level_number, slug')
    .eq('id', attempt.level_id)
    .single()
  const levelNumber = thisLevel?.level_number ?? 1
  const levelSlug = thisLevel?.slug ?? ''

  if (outcome === 'pass') {
    // Advance the watermark to the next level (D-E02 / D-P04). No hard-coded id —
    // resolve the next level by level_number; if none exists, max level reached.
    const { data: nextLevel } = await supabase
      .from('levels')
      .select('id')
      .eq('level_number', levelNumber + 1)
      .maybeSingle()

    const profileUpdate: Record<string, unknown> = {
      unlocked_through_level_number: levelNumber + 1,
    }
    if (nextLevel?.id) profileUpdate.current_level_id = nextLevel.id

    // Watermark advance via the ADMIN client ONLY (D-S01 / T-04-EoP-05).
    const adminWrite = createAdminClient()
    await adminWrite.from('profiles').update(profileUpdate).eq('id', user.id)

    revalidatePath('/dashboard')
  }

  revalidatePath(`/levels/${levelSlug}`)
  redirect(`/diagnostic/end-of-level/${levelSlug}`)
}
