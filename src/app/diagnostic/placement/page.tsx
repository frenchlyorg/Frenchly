/**
 * /diagnostic/placement — Placement diagnostic Server Component (DIAG-01).
 *
 * Flow: start → one unanswered question at a time (resumable) → result.
 * - Auth guard redirects to /login?next=/diagnostic/placement (T-03-06 style).
 * - One-time (D-P02): a completed attempt without ?result=1 redirects to /dashboard;
 *   the result screen is shown only on the post-submit ?result=1 landing.
 * - The answer key is never projected here — questions select id, question_text,
 *   type, options, lesson_tag only (Pitfall 1 / answer-key boundary).
 *
 * UI-SPEC refs: §Layout Contracts — placement; §Interaction Contracts — resumable state.
 * Container: max-w-[720px] (lesson content width, DESIGN.md / CLAUDE.md rule 10).
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { derivePlacement } from '@/lib/diagnostics/scoring'
import { startPlacementDiagnostic } from '@/actions/diagnostic'
import DiagnosticProgress from '@/components/diagnostic/DiagnosticProgress'
import DiagnosticQuestionCard from '@/components/diagnostic/DiagnosticQuestionCard'
import DiagnosticResult from '@/components/diagnostic/DiagnosticResult'

export const metadata = {
  title: 'Placement — Frenchly',
}

interface AttemptRow {
  id: string
  status: 'in_progress' | 'completed' | 'failed'
  drawn_question_ids: string[]
  score: number | null
}

interface QuestionRow {
  id: string
  question_text: string
  type: 'mc' | 'fill_in'
  options: string[] | null
  lesson_tag: string | null
}

export default async function PlacementPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>
}) {
  const { result } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/diagnostic/placement')

  // Latest placement attempt for this user (RLS scopes to own rows).
  const { data: attempt } = await supabase
    .from('diagnostic_attempts')
    .select('id, status, drawn_question_ids, score')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle<AttemptRow>()

  // ─── Completed placement ───────────────────────────────────────────────────
  if (attempt?.status === 'completed') {
    if (result !== '1') redirect('/dashboard') // D-P02 one-time guard
    const placement = derivePlacement(Number(attempt.score ?? 0))
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[720px] px-5 py-20">
          <DiagnosticResult levelName={`French ${placement}`} />
        </div>
      </main>
    )
  }

  // ─── No attempt yet → start state ──────────────────────────────────────────
  if (!attempt) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[720px] px-5 py-20">
          <h1 className="font-heading text-[28px] font-semibold text-on-surface">
            Let&rsquo;s find your starting point
          </h1>
          <p className="mt-4 font-body text-[18px] leading-8 text-on-surface">
            Answer a short set of questions so we can place you in the right level. There&rsquo;s
            no pass or fail — just answer what you can.
          </p>
          <form action={startPlacementDiagnostic} className="mt-8">
            <button
              type="submit"
              className="min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90"
            >
              Start placement
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ─── In-progress → render the first unanswered question ────────────────────
  const drawnIds = attempt.drawn_question_ids ?? []

  const { data: questionRows } = await supabase
    .from('diagnostic_questions')
    .select('id, question_text, type, options, lesson_tag')
    .in('id', drawnIds)

  const { data: answeredRows } = await supabase
    .from('diagnostic_answers')
    .select('question_id')
    .eq('attempt_id', attempt.id)

  const answeredSet = new Set((answeredRows ?? []).map((a) => a.question_id))
  const firstUnansweredId = drawnIds.find((id) => !answeredSet.has(id))

  // All answered but not yet marked complete (transient) — surface the result.
  if (!firstUnansweredId) redirect('/diagnostic/placement?result=1')

  const byId = new Map((questionRows ?? []).map((q) => [q.id, q as QuestionRow]))
  const question = byId.get(firstUnansweredId)
  if (!question) redirect('/dashboard') // drawn id missing from pool — bail safely

  const total = drawnIds.length
  const answeredCount = answeredSet.size

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-5 py-20">
        <div className="mb-8">
          <DiagnosticProgress current={answeredCount + 1} total={total} />
        </div>
        <DiagnosticQuestionCard
          key={question.id}
          question={{
            id: question.id,
            type: question.type,
            question_text: question.question_text,
            options: question.options,
          }}
          attemptId={attempt.id}
          isLast={answeredCount === total - 1}
        />
      </div>
    </main>
  )
}
