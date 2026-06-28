/**
 * LevelCard — lesson card for the level page.
 *
 * Displays: lesson title (headline-md), time estimate ("{N} min"),
 * sub-component count ("{N} parts"), locked/unlocked state, guillemet
 * active-lesson marker.
 *
 * Pure presentational Server-renderable component (no 'use client').
 * Design tokens only — no ad-hoc hex, no green (text-tertiary/bg-tertiary
 * reserved for Phase 5 correct-answer feedback).
 *
 * UI-SPEC refs: §Component Inventory — LevelCard; §Interaction Contracts — locked card;
 * §Copywriting Contract; CLAUDE.md design rules.
 */
import Link from 'next/link'
import LockBadge from '@/components/ui/LockBadge'

interface LevelCardProps {
  /** Slug of the parent level, used to build the lesson href. */
  levelSlug: string
  /** Lesson UUID — used in the lesson view route. */
  lessonId: string
  /** Lesson title (sentence case). */
  title: string
  /** Estimated lesson duration in minutes. */
  estimatedMinutes: number
  /** Number of sub-components (parts). */
  partsCount: number
  /** How many sub-components the student has completed. */
  completedCount: number
  /** When true, the card is non-interactive and shows a lock badge. */
  isLocked: boolean
  /**
   * When true, the lesson is in-progress.
   * Adds the guillemet «  active-lesson marker and changes CTA to "Continue".
   */
  isActive: boolean
}

export default function LevelCard({
  levelSlug,
  lessonId,
  title,
  estimatedMinutes,
  partsCount,
  completedCount,
  isLocked,
  isActive,
}: LevelCardProps) {
  const isComplete = partsCount > 0 && completedCount >= partsCount
  const progressPct = partsCount > 0 ? (completedCount / partsCount) * 100 : 0
  const cardInner = (
    <div
      className={[
        'border border-outline-variant rounded-[16px] p-6 bg-surface-container-low',
        isLocked ? 'opacity-60 cursor-default' : 'cursor-pointer hover:border-primary-container transition-colors',
      ].join(' ')}
      // Accessibility: locked card is non-interactive
      {...(isLocked && {
        'aria-disabled': 'true' as const,
        tabIndex: -1,
        title: 'Locked — complete French 1 to unlock',
      })}
    >
      {/* Card header: title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className={[
            'font-heading text-[24px] font-medium leading-8',
            isLocked ? 'text-on-surface-variant' : 'text-on-surface',
          ].join(' ')}
        >
          {/* Active-lesson marker — coral dot (bg-primary token, warm palette) */}
          {isActive && !isLocked && (
            <span
              className="inline-block h-2 w-2 rounded-full bg-primary mr-2 align-middle"
              aria-hidden="true"
            />
          )}
          {title}
        </h3>

        {/* Lock badge on locked cards */}
        {isLocked && <LockBadge />}
      </div>

      {/* Card metadata: time estimate + parts count */}
      <div className="flex items-center gap-3">
        <span className="font-label text-[13px] text-on-surface-variant">
          {estimatedMinutes} min
        </span>
        <span className="font-label text-[13px] text-on-surface-variant" aria-hidden="true">
          ·
        </span>
        <span className="font-label text-[13px] text-on-surface-variant">
          {partsCount} parts
        </span>
      </div>

      {/* Progress bar — thin coral fill, completed/total parts (unlocked cards only) */}
      {!isLocked && partsCount > 0 && (
        <div className="mt-4">
          <div
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={partsCount}
            aria-label={`${completedCount} of ${partsCount} parts complete`}
            className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA — only shown on unlocked cards */}
      {!isLocked && (
        <p className="mt-3 font-label text-[13px] text-primary">
          {isComplete ? 'Completed' : isActive ? 'Continue' : 'Start lesson'}
        </p>
      )}
    </div>
  )

  // Locked cards: render the card div directly (no Link, no onClick)
  if (isLocked) {
    return cardInner
  }

  // Unlocked cards: wrap in a Next.js Link to the lesson view route
  return (
    <Link
      href={`/levels/${levelSlug}/lessons/${lessonId}`}
      aria-label={`${isActive ? 'Continue' : 'Start lesson'}: ${title}`}
    >
      {cardInner}
    </Link>
  )
}
