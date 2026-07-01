/**
 * /diagnostic/end-of-level/[levelSlug] — End-of-level diagnostic (DIAG-02).
 *
 * Flow: start → one unanswered question at a time → pass (unlock next level) or
 * fail (score + weak-area review + cooldown retry). The grading/unlock/cooldown
 * all happen server-side in the action; this page renders state.
 *
 * The answer key is never projected here — questions select id/question_text/type/
 * options, and weak-area derivation uses lesson_tag + is_correct, never the answer-key
 * column (Pitfall 1 / T-04-ID-04).
 *
 * UI-SPEC refs: §Interaction Contracts — end-of-level; §Copywriting — pass/fail.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { minDelay } from '@/lib/min-delay'
import { startEndOfLevelDiagnostic } from '@/actions/diagnostic'
import DiagnosticProgress from '@/components/diagnostic/DiagnosticProgress'
import DiagnosticQuestionCard from '@/components/diagnostic/DiagnosticQuestionCard'
import DiagnosticResultFail from '@/components/diagnostic/DiagnosticResultFail'

export const metadata = {
  title: 'End-of-level diagnostic — Frenchly',
}

interface LessonRow {
  id: string
  slug: string
  title: string
}
interface LevelRow {
  id: string
  slug: string
  name: string
  level_number: number
  lessons: LessonRow[]
}
interface AttemptRow {
  id: string
  status: 'in_progress' | 'completed' | 'failed'
  drawn_question_ids: string[]
  correct_count: number | null
  total_count: number | null
  cooldown_until: string | null
}
interface QuestionRow {
  id: string
  question_text: string
  type: 'mc' | 'fill_in'
  options: string[] | null
}

export default async function EndOfLevelPage({
  params,
}: {
  params: Promise<{ levelSlug: string }>
}) {
  const { levelSlug } = await params

  const supabase = await createClient()
  const delayPromise = minDelay(300)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/diagnostic/end-of-level/${levelSlug}`)

  const { data: level } = await supabase
    .from('levels')
    .select('id, slug, name, level_number, lessons ( id, slug, title )')
    .eq('slug', levelSlug)
    .single<LevelRow>()
  if (!level) redirect('/dashboard')

  const startThisLevel = startEndOfLevelDiagnostic.bind(null, { levelId: level.id })

  const { data: attempt } = await supabase
    .from('diagnostic_attempts')
    .select('id, status, drawn_question_ids, correct_count, total_count, cooldown_until')
    .eq('user_id', user.id)
    .eq('level_id', level.id)
    .eq('diagnostic_type', 'end_of_level')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle<AttemptRow>()

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-5 py-20">{children}</div>
    </main>
  )

  // ─── No attempt → start CTA ────────────────────────────────────────────────
  if (!attempt) {
    await delayPromise
    return shell(
      <div className="mx-auto max-w-[480px] text-center">
        <h1 className="font-heading text-[28px] font-semibold text-on-surface">
          Ready for the {level.name} check?
        </h1>
        <p className="mt-4 font-body text-[18px] leading-8 text-on-surface">
          Answer 10 questions to show what you&rsquo;ve learned. Pass and the next level unlocks.
        </p>
        <form action={startThisLevel} className="mt-8">
          <button
            type="submit"
            className="min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90"
          >
            Start the end-of-level diagnostic
          </button>
        </form>
      </div>
    )
  }

  // ─── Passed → unlock screen ────────────────────────────────────────────────
  if (attempt.status === 'completed') {
    await delayPromise
    const { data: nextLevel } = await supabase
      .from('levels')
      .select('slug')
      .eq('level_number', level.level_number + 1)
      .maybeSingle<{ slug: string }>()
    return shell(
      <div className="mx-auto max-w-[480px] text-center">
        <h1 className="font-heading text-[28px] font-semibold text-on-surface">Level complete</h1>
        <p className="mt-4 font-body text-[18px] leading-8 text-on-surface">
          You&rsquo;ve passed. The next level is now unlocked.
        </p>
        <Link
          href={nextLevel ? `/levels/${nextLevel.slug}` : '/dashboard'}
          className="mt-8 inline-block min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90"
        >
          {nextLevel ? 'Continue to next level' : 'Back to dashboard'}
        </Link>
      </div>
    )
  }

  // ─── Failed → score + weak-area review + cooldown retry ────────────────────
  if (attempt.status === 'failed') {
    // Incorrectly-answered question ids for this attempt.
    const { data: wrong } = await supabase
      .from('diagnostic_answers')
      .select('question_id')
      .eq('attempt_id', attempt.id)
      .eq('is_correct', false)
    const wrongIds = (wrong ?? []).map((w) => w.question_id)

    // Map those questions to their lesson_tag (never the answer key), then to lessons.
    let weakLessons: { id: string; title: string; levelSlug: string }[] = []
    if (wrongIds.length > 0) {
      const { data: taggedQs } = await supabase
        .from('diagnostic_questions')
        .select('id, lesson_tag')
        .in('id', wrongIds)
      const tags = new Set((taggedQs ?? []).map((q) => q.lesson_tag).filter(Boolean) as string[])
      weakLessons = (level.lessons ?? [])
        .filter((l) => tags.has(l.slug))
        .map((l) => ({ id: l.id, title: l.title, levelSlug: level.slug }))
    }

    await delayPromise
    return shell(
      <DiagnosticResultFail
        correctCount={attempt.correct_count ?? 0}
        total={attempt.total_count ?? 10}
        weakLessons={weakLessons}
        cooldownUntil={attempt.cooldown_until}
        retryAction={startThisLevel}
      />
    )
  }

  // ─── In progress → first unanswered question ───────────────────────────────
  const drawnIds = attempt.drawn_question_ids ?? []
  const { data: questionRows } = await supabase
    .from('diagnostic_questions')
    .select('id, question_text, type, options')
    .in('id', drawnIds)
  const { data: answeredRows } = await supabase
    .from('diagnostic_answers')
    .select('question_id')
    .eq('attempt_id', attempt.id)

  const answeredSet = new Set((answeredRows ?? []).map((a) => a.question_id))
  const firstUnansweredId = drawnIds.find((id) => !answeredSet.has(id))
  if (!firstUnansweredId) redirect(`/diagnostic/end-of-level/${levelSlug}`)

  const byId = new Map((questionRows ?? []).map((q) => [q.id, q as QuestionRow]))
  const question = byId.get(firstUnansweredId)
  if (!question) redirect('/dashboard')

  const total = drawnIds.length
  const answeredCount = answeredSet.size

  await delayPromise
  return shell(
    <>
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
    </>
  )
}
