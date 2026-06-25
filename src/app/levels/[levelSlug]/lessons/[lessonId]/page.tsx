/**
 * /levels/[levelSlug]/lessons/[lessonId] — Lesson view Server Component
 *
 * Fetches sub-components (content) and own progress (user data) in two separate
 * queries to keep the RLS boundary explicit (Open Question Q3).
 *
 * Auth: getUser() guard — redirects to /login with next param (T-03-13).
 * Security: user_id scoped to authenticated session server-side; progress query
 *           uses eq('user_id', user.id) and RLS enforces it at DB layer.
 *
 * UI-SPEC refs: §Layout Contracts — Lesson Page max-w-720px;
 *               §Copywriting Contract — back link, headline, complete state.
 * CLAUDE.md: lesson content max-width = 720px (NOT 1040px).
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubComponentList from '@/components/lessons/SubComponentList'
import Link from 'next/link'
import { parseProblemContent } from '@/lib/practice/schema'
import type { ProblemData } from '@/lib/practice/types'

export const metadata = {
  title: 'Lesson — Frenchly',
}

// ─── DB shapes ───────────────────────────────────────────────────────────────

interface SubComponentRow {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  position: number
  // Parsed at server render time for practice kind; null for explainer/writing or invalid JSON
  problemData?: ProblemData | null
}

interface LessonRow {
  id: string
  slug: string
  title: string
  estimated_minutes: number
  sub_components: SubComponentRow[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LessonPage({
  params,
}: {
  params: Promise<{ levelSlug: string; lessonId: string }>
}) {
  // Next 15+ requires awaiting params
  const { levelSlug, lessonId } = await params

  // Auth guard — derive user server-side; never accept user_id from client (T-03-13)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/levels/${levelSlug}/lessons/${lessonId}`)
  }

  // Query 1 (content): lesson with sub-components ordered by position
  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      'id, slug, title, estimated_minutes, sub_components ( id, title, kind, content, position )'
    )
    .eq('id', lessonId)
    .order('position', { referencedTable: 'sub_components' })
    .single<LessonRow>()

  // Unknown lesson id → not-found state
  if (!lesson) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-[720px] mx-auto px-5 md:px-6 py-12">
          <p className="font-body text-on-surface-variant">Lesson not found.</p>
        </div>
      </main>
    )
  }

  // Parse practice problem JSON server-side so client components receive typed ProblemData.
  // parseProblemContent never throws — returns null for non-practice kinds or invalid JSON.
  const subComponents = (lesson.sub_components ?? []).map((sc) => ({
    ...sc,
    problemData: sc.kind === 'practice' ? parseProblemContent(sc.content) : null,
  }))
  const subComponentIds = subComponents.map((sc) => sc.id)

  // Query 2 (user data): own progress rows — separate query keeps RLS boundary explicit
  // SELECT is scoped to user.id + enforced by RLS SELECT policy (T-03-13)
  const { data: progressRows } =
    subComponentIds.length > 0
      ? await supabase
          .from('sub_component_progress')
          .select('sub_component_id')
          .eq('user_id', user.id)
          .in('sub_component_id', subComponentIds)
      : { data: [] }

  const completedIds = (progressRows ?? []).map((r) => r.sub_component_id)

  // Level name for back-link copy — derive from levelSlug (e.g. "french-1" → "French 1")
  const levelDisplayName = levelSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <main className="min-h-screen bg-background">
      {/* Lesson content column — max-w-720px per CLAUDE.md + DESIGN.md */}
      <div className="max-w-[720px] mx-auto px-5 md:px-6 py-12">

        {/* Back link — above the title (UI-SPEC §Layout Contracts — Lesson Page) */}
        <Link
          href={`/levels/${levelSlug}`}
          className="inline-block font-body text-[16px] font-normal text-primary mb-6 hover:underline"
        >
          Back to {levelDisplayName}
        </Link>

        {/* Lesson header */}
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-on-surface mb-2">
          {lesson.title}
        </h1>

        {/* Time estimate — label-sm muted (UI-SPEC §Typography) */}
        <p className="font-label text-[13px] text-on-surface-variant mb-8">
          {lesson.estimated_minutes} min
        </p>

        {/* Sub-component list with optimistic progress (LESSON-03) */}
        <SubComponentList
          subComponents={subComponents}
          initialCompletedIds={completedIds}
        />
      </div>
    </main>
  )
}
