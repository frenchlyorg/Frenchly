/**
 * /levels/[levelSlug] — Level page Server Component
 *
 * Shows the level name, description, and a card per lesson with time estimate,
 * sub-component count, and locked/unlocked state.
 *
 * Auth: getUser() guard (defense-in-depth on top of proxy matcher — T-03-06).
 * Lock rule: deriveIsLevelLocked from profiles.current_level_id (T-03-07).
 * D-L04: French 1 lessons are freely jumpable — no per-lesson sequential gating.
 *
 * UI-SPEC refs: §Layout Contracts — Level Page; §Copywriting Contract.
 * Container: max-w-[1040px] (dashboard container width, DESIGN.md + CLAUDE.md).
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deriveIsLevelLocked } from '@/lib/lessons/locking'
import LevelCard from '@/components/lessons/LevelCard'
import LockBadge from '@/components/ui/LockBadge'
import DiagnosticGate from '@/components/diagnostic/DiagnosticGate'

export const metadata = {
  title: 'Levels — Frenchly',
}

// ─── DB shape ────────────────────────────────────────────────────────────────

interface SubComponentRow {
  id: string
  position: number
}

interface LessonRow {
  id: string
  slug: string
  title: string
  estimated_minutes: number
  position: number
  sub_components: SubComponentRow[]
}

interface LevelRow {
  id: string
  slug: string
  name: string
  level_number: number
  description: string | null
  lessons: LessonRow[]
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LevelPage({
  params,
}: {
  params: Promise<{ levelSlug: string }>
}) {
  // Next 15+ requires awaiting params
  const { levelSlug } = await params

  // Defense-in-depth auth guard (T-03-06 — proxy already guards, double-check here)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/levels/${levelSlug}`)
  }

  // Placement gate (D-P01 / T-04-EoP-04): force first-time students through the
  // diagnostic before any level content. Server Component guard, not middleware (Pitfall 4).
  const { data: completedPlacement } = await supabase
    .from('diagnostic_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('diagnostic_type', 'placement')
    .eq('status', 'completed')
    .maybeSingle()

  if (!completedPlacement) {
    const { data: inProgress } = await supabase
      .from('diagnostic_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('diagnostic_type', 'placement')
      .eq('status', 'in_progress')
      .maybeSingle()
    return <DiagnosticGate hasInProgress={!!inProgress} />
  }

  // Fetch level with nested lessons + sub_components (Pitfall 5: nested shape)
  const { data: level } = await supabase
    .from('levels')
    .select(
      'id, slug, name, level_number, description, lessons ( id, slug, title, estimated_minutes, position, sub_components ( id, position ) )'
    )
    .eq('slug', levelSlug)
    .order('position', { referencedTable: 'lessons' })
    .single<LevelRow>()

  // Fetch student's watermark (+ legacy current_level_id) for lock derivation (T-03-07, D-S02)
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level_id, unlocked_through_level_number')
    .eq('id', user.id)
    .single()

  // Derive lock state server-side from the numeric watermark (falls back to the
  // Phase 3 current_level_id rule when the watermark is null).
  const isLocked = level
    ? deriveIsLevelLocked({
        levelId: level.id,
        levelNumber: level.level_number,
        currentLevelId: profile?.current_level_id ?? null,
        unlockedThroughLevelNumber: profile?.unlocked_through_level_number ?? null,
      })
    : false

  // Unknown slug → not-found state
  if (!level) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
          <p className="font-body text-on-surface-variant">Level not found.</p>
        </div>
      </main>
    )
  }

  const lessons = level.lessons ?? []

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">

        {/* Level header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-heading text-[48px] font-bold leading-[56px] tracking-[-0.02em] text-on-surface">
              {level.name}
            </h1>
            {isLocked && <LockBadge />}
          </div>

          {level.description && (
            <p className="font-body text-[16px] text-on-surface-variant leading-7 max-w-[640px]">
              {level.description}
            </p>
          )}

          {/* Locked level unlock prompt (D-L06) */}
          {isLocked && (
            <p className="mt-4 font-body text-[16px] text-on-surface-variant">
              Complete the French 1 placement test to unlock French 2.
            </p>
          )}
        </div>

        {/* Lesson card grid — single column mobile, 2-column tablet+ */}
        {lessons.length === 0 ? (
          <p className="font-body text-[16px] text-on-surface-variant">
            No lessons available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map((lesson) => (
              <LevelCard
                key={lesson.id}
                levelSlug={level.slug}
                lessonId={lesson.id}
                title={lesson.title}
                estimatedMinutes={lesson.estimated_minutes}
                partsCount={lesson.sub_components?.length ?? 0}
                isLocked={isLocked}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
