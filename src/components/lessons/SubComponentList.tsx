'use client'

/**
 * SubComponentList — optimistic lesson progress list with accordion layout.
 *
 * UI-SPEC refs: §Component Inventory — SubComponentList, PostLessonBar, AccordionShell;
 *               §Interaction Contracts — D-AC, D-PL; §Color — Post-lesson Loading Bar, Accordion.
 * Pattern: useOptimistic + startTransition (RESEARCH Pattern 3; Pitfall 1 — setter MUST be inside startTransition).
 * Phase 9: openId state drives one-open-at-a-time accordion (D-AC-06).
 *          PostLessonBar fires when allDone becomes true (D-PL-01).
 *          levelSlug prop required for router.push navigation (RESEARCH §Pitfall 5).
 * Pitfall guards: RAF before setBarWidth(100) for CSS transition (RESEARCH §Pitfall 2);
 *                 navigatedRef prevents double-fire in StrictMode (RESEARCH §Pitfall 3);
 *                 openId is useState — NOT derived — to prevent reset on optimistic update (§Pitfall 6).
 */

import { useOptimistic, useTransition, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { markSubComponentComplete } from '@/app/lessons/actions'
import SubComponentItem from './SubComponentItem'
import type { ProblemData } from '@/lib/practice/types'

interface SubComponentData {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  position: number
  // Pre-parsed server-side for practice/writing kinds; null for explainer or invalid JSON
  problemData?: ProblemData | null
  // Loaded from writing_submissions on revisit; null for non-writing kinds or first visit (D-09)
  initialFeedback?: string | null
  initialSubmissionText?: string | null
}

interface SubComponentListProps {
  subComponents: SubComponentData[]
  initialCompletedIds: string[]
  levelSlug: string
}

export default function SubComponentList({
  subComponents,
  initialCompletedIds,
  levelSlug,
}: SubComponentListProps) {
  const [, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // useOptimistic: reducer adds the id to the set (binary done/not-done, D-L02)
  const [completedIds, setOptimisticCompleted] = useOptimistic(
    new Set(initialCompletedIds),
    (current: Set<string>, id: string) => new Set([...current, id])
  )

  // Accordion open state — must be useState (NOT derived) to prevent reset on optimistic update
  // (RESEARCH §Pitfall 6). Initialised with first sub-component open (D-AC-02).
  const [openId, setOpenId] = useState<string | null>(
    subComponents.length > 0 ? subComponents[0].id : null
  )

  // Post-lesson bar state
  const router = useRouter()
  const [barWidth, setBarWidth] = useState(0)
  const navigatedRef = useRef(false)

  // Stable random message — chosen once on mount, does not change during fill animation (D-PL-04)
  const message = useMemo(() => {
    const pool = [
      'Well done! Loading your next lesson.',
      'Nice job! Returning to your lessons.',
      'Lesson complete. Keep up the momentum.',
      'Très bien! Back to your level.',
      'Great work. Heading to your next lesson.',
    ]
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  const total = subComponents.length
  const completedCount = subComponents.filter((sc) => completedIds.has(sc.id)).length
  const allDone = total > 0 && completedCount === total

  // Post-lesson bar effect — fires when allDone becomes true (D-PL-01 through D-PL-07)
  useEffect(() => {
    if (!allDone) return
    if (navigatedRef.current) return // StrictMode double-fire guard (RESEARCH §Pitfall 3)

    // RAF defers setBarWidth(100) by one frame so CSS transition fires from 0→100
    // (RESEARCH §Pitfall 2 — without RAF, browser renders 0→100 synchronously = no animation)
    const rafId = requestAnimationFrame(() => {
      setBarWidth(100)
    })

    const timerId = setTimeout(() => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      router.push(`/levels/${levelSlug}`)
    }, 1500)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timerId)
    }
  }, [allDone, levelSlug, router])

  function handleComplete(id: string) {
    // Already complete → idempotent no-op (T-03-12 double-tap guard in UI layer)
    if (completedIds.has(id)) return

    setSaveError(null)

    // Derive next incomplete item BEFORE the optimistic update (RESEARCH §Pitfall 6 — must be
    // synchronous, outside startTransition, so openId doesn't reset on re-render).
    const sorted = [...subComponents].sort((a, b) => a.position - b.position)
    const currentIndex = sorted.findIndex((sc) => sc.id === id)
    const nextIncomplete = sorted
      .slice(currentIndex + 1)
      .find((sc) => !completedIds.has(sc.id) && sc.id !== id)

    // Auto-advance: open next incomplete item, or close all (post-lesson bar will appear) (D-AC-03)
    setOpenId(nextIncomplete?.id ?? null)

    // CRITICAL: setOptimisticCompleted MUST be inside startTransition (Pitfall 1)
    startTransition(async () => {
      setOptimisticCompleted(id)
      try {
        await markSubComponentComplete(id)
      } catch {
        // Revert on error — show inline error message (UI-SPEC §Interaction Contracts)
        setSaveError("Couldn't save progress. Try again.")
      }
    })
  }

  // Empty list copy (UI-SPEC §Copywriting Contract)
  if (total === 0) {
    return (
      <p className="font-body text-[16px] text-on-surface-variant">
        This lesson has no parts yet. Check back soon.
      </p>
    )
  }

  return (
    <div>
      {/* Post-lesson loading bar — fixed top-0, 4px coral fill, fills over 1500ms then navigates
          (D-PL-02 through D-PL-07). Replaces the old static "Lesson complete" card (D-PL-07). */}
      {allDone && (
        <div
          className="fixed top-0 left-0 right-0 z-50"
          role="progressbar"
          aria-valuenow={barWidth}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading next lesson"
        >
          {/* Track — warm bone tone, full viewport width */}
          <div className="h-1 w-full bg-surface-container-high">
            {/* Fill — coral primary, CSS width transition (D-PL-06) */}
            <div
              className="h-full bg-primary transition-all duration-[1500ms] ease-in-out motion-reduce:transition-none"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {/* Message — sentence case, font-label, on-surface-variant (D-PL-04, D-PL-05) */}
          <p className="mt-2 text-center font-label text-[13px] text-on-surface-variant">
            {message}
          </p>
        </div>
      )}

      {/* Progress bar — thin 4px bar, primary fill, no circular rings (DESIGN.md) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label text-[13px] text-on-surface-variant">
            {completedCount} of {total} complete
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${completedCount} of ${total} sub-components complete`}
          className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: total > 0 ? `${(completedCount / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Inline save error (UI-SPEC §Interaction Contracts — error revert) */}
      {saveError && (
        <p className="font-label text-[13px] text-error mb-4" role="alert">
          {saveError}
        </p>
      )}

      {/* Sub-component list — accordion, gap-8px between items (UI-SPEC §Spacing sm=8px) */}
      <ul className="flex flex-col gap-2" aria-label="Lesson parts">
        {subComponents.map((sc) => (
          <li key={sc.id} className="border-b border-outline-variant last:border-b-0">
            <SubComponentItem
              id={sc.id}
              title={sc.title}
              kind={sc.kind}
              content={sc.content}
              isCompleted={completedIds.has(sc.id)}
              onComplete={handleComplete}
              problemData={sc.problemData}
              initialFeedback={sc.initialFeedback}
              initialSubmissionText={sc.initialSubmissionText}
              isOpen={openId === sc.id}
              onToggle={() => setOpenId(openId === sc.id ? null : sc.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
