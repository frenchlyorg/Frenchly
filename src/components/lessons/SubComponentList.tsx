'use client'

/**
 * SubComponentList — optimistic lesson progress list.
 *
 * UI-SPEC refs: §Component Inventory — SubComponentList; §Interaction Contracts — mark complete toggle.
 * Pattern: useOptimistic + startTransition (RESEARCH Pattern 3; Pitfall 1 — setter MUST be inside startTransition).
 * revalidatePath in the Server Action syncs ground-truth after transition (Pitfall 2 guard).
 */

import { useOptimistic, useTransition, useState } from 'react'
import { markSubComponentComplete } from '@/app/lessons/actions'
import SubComponentItem from './SubComponentItem'

interface SubComponentData {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  position: number
}

interface SubComponentListProps {
  subComponents: SubComponentData[]
  initialCompletedIds: string[]
}

export default function SubComponentList({
  subComponents,
  initialCompletedIds,
}: SubComponentListProps) {
  const [, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // useOptimistic: reducer adds the id to the set (binary done/not-done, D-L02)
  const [completedIds, setOptimisticCompleted] = useOptimistic(
    new Set(initialCompletedIds),
    (current: Set<string>, id: string) => new Set([...current, id])
  )

  function handleComplete(id: string) {
    // Already complete → idempotent no-op (T-03-12 double-tap guard in UI layer)
    if (completedIds.has(id)) return

    setSaveError(null)

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

  const total = subComponents.length
  const completedCount = subComponents.filter((sc) => completedIds.has(sc.id)).length
  const allDone = total > 0 && completedCount === total

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

      {/* Sub-component list — gap-8px between items (UI-SPEC §Spacing sm=8px) */}
      <ul className="flex flex-col gap-2" aria-label="Lesson parts">
        {subComponents.map((sc) => (
          <li key={sc.id} className="border-b border-outline-variant last:border-b-0">
            <SubComponentItem
              id={sc.id}
              title={sc.title}
              kind={sc.kind}
              isCompleted={completedIds.has(sc.id)}
              onComplete={handleComplete}
            />
          </li>
        ))}
      </ul>

      {/* Lesson complete state — shown when all sub-components done (UI-SPEC §Copywriting) */}
      {allDone && (
        <div className="mt-8 p-6 rounded-[16px] bg-surface-container-low border border-outline-variant">
          <h2 className="font-heading text-[24px] font-semibold text-on-surface mb-2">
            Lesson complete
          </h2>
          <p className="font-body text-[16px] text-on-surface-variant">
            Head back to French 1 to choose your next lesson.
          </p>
        </div>
      )}
    </div>
  )
}
