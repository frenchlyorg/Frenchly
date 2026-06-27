'use client'

/**
 * SubComponentItem — per-item toggle in the lesson sub-component list.
 *
 * UI-SPEC refs: §Component Inventory — SubComponentItem; §Interaction Contracts — mark complete toggle.
 * Design rules: aria-pressed, 48px touch target, no green (text-tertiary/bg-tertiary banned),
 * completed = muted (text-on-surface-variant), not struck through.
 *
 * Phase 5: kind='practice' renders PracticeCardRouter below the title row.
 * The toggle button is replaced by a non-interactive spacer (role="presentation",
 * tabIndex={-1}) — completion is driven by the problem result, not manual click (T-05-04).
 */

import LessonMarkdown from './LessonMarkdown'
import PracticeCardRouter from '@/components/practice/PracticeCardRouter'
import type { ProblemData } from '@/lib/practice/types'

interface SubComponentItemProps {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  isCompleted: boolean
  onComplete: (id: string) => void
}

// Internal-only prop for practice problem data — does not change the external API
interface SubComponentItemInternalProps extends SubComponentItemProps {
  problemData?: ProblemData | null
  initialFeedback?: string | null
  initialSubmissionText?: string | null
}

// Maps kind to display label (sentence case per CLAUDE.md)
const KIND_LABELS: Record<SubComponentItemProps['kind'], string> = {
  explainer: 'reading',
  practice: 'practice',
  writing: 'writing',
}

// Kind chip background — warm tonal palette only, no green
const KIND_CHIP_BG: Record<SubComponentItemProps['kind'], string> = {
  explainer: 'bg-surface-container-high',
  practice: 'bg-surface-container-highest',
  writing: 'bg-surface-container-highest',
}

export default function SubComponentItem({
  id,
  title,
  kind,
  content,
  isCompleted,
  onComplete,
  problemData,
  initialFeedback,
  initialSubmissionText,
}: SubComponentItemInternalProps) {
  return (
    <div className="py-2">
    <div className="flex items-center gap-3">
      {kind === 'practice' || kind === 'writing' ? (
        /* Non-interactive spacer for practice and writing kinds — not clickable (T-05-04 / Pitfall 3).
           Completion is driven by PracticeCardRouter's onComplete callback, not manual click. */
        <div
          role="presentation"
          tabIndex={-1}
          aria-label={`${title} — answer to complete`}
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'min-h-[48px] min-w-[48px] rounded-full',
            'border-2',
            isCompleted
              ? 'bg-primary border-primary text-on-primary'
              : 'bg-surface-container-high border-outline-variant text-on-surface-variant',
          ].join(' ')}
        >
          {isCompleted && (
            /* Filled checkmark when done — same visual as other kinds */
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10l4.5 4.5L16 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {/* Incomplete: muted circle with no icon — visually indicates "answer to complete" */}
        </div>
      ) : (
        /* Completion toggle button — 48px min touch target (UI-SPEC §Spacing) */
        <button
          type="button"
          onClick={() => onComplete(id)}
          disabled={isCompleted}
          aria-pressed={isCompleted}
          aria-label={isCompleted ? `${title} — done` : `Mark ${title} complete`}
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'min-h-[48px] min-w-[48px] rounded-full',
            'border-2 transition-colors',
            isCompleted
              ? 'bg-primary border-primary text-on-primary cursor-default'
              : 'bg-transparent border-outline text-on-surface hover:border-primary focus:outline-none focus:border-primary focus:border-[3px]',
            'disabled:cursor-default',
          ].join(' ')}
        >
          {isCompleted ? (
            /* Filled checkmark when done */
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10l4.5 4.5L16 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            /* Dash/outline indicator when incomplete */
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 10h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}

      {/* Content: title + kind chip */}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        {/* Title — muted when completed (no strikethrough per UI-SPEC) */}
        <span
          className={[
            'font-body text-[16px] leading-7',
            isCompleted ? 'text-on-surface-variant' : 'text-on-surface',
          ].join(' ')}
        >
          {title}
        </span>

        {/* Kind chip — warm tonal, no green */}
        <span
          className={[
            'inline-flex items-center font-label text-[13px] text-on-surface-variant',
            'rounded-full px-2 py-0.5 leading-4',
            KIND_CHIP_BG[kind],
          ].join(' ')}
        >
          {KIND_LABELS[kind]}
        </span>
      </div>

      {/* CHANGE 2: Action label — "In progress" / "Done" for practice; sentence case per CLAUDE.md */}
      <span
        className={[
          'flex-shrink-0 font-label text-[13px]',
          isCompleted ? 'text-on-surface-variant' : 'text-primary',
        ].join(' ')}
        aria-hidden="true"
      >
        {(kind === 'practice' || kind === 'writing')
          ? isCompleted ? 'Done' : 'In progress'
          : isCompleted ? 'Done' : 'Mark complete'}
      </span>
    </div>

      {/* Explainer body — markdown content rendered below the toggle row,
          indented to align past the 48px button + 12px gap. Only explainers
          carry content in Phase 3; practice/writing are title-only placeholders. */}
      {content && kind !== 'practice' && kind !== 'writing' && (
        <div className="mt-3 sm:ml-[60px]">
          <LessonMarkdown markdown={content} />
        </div>
      )}

      {/* Practice problem panel — renders PracticeCardRouter below title row.
          Additional block, not replacing the content block above. */}
      {kind === 'practice' && (
        <div className="mt-4 sm:ml-[60px]" aria-label={`Practice problem: ${title}`}>
          {problemData ? (
            <PracticeCardRouter
              problemData={problemData}
              subComponentId={id}
              isCompleted={isCompleted}
              onComplete={onComplete}
            />
          ) : (
            <p className="font-body text-[16px] text-on-surface-variant">
              This practice problem isn&apos;t available yet.
            </p>
          )}
        </div>
      )}

      {/* Writing exercise panel — mirrors practice panel, passes initialFeedback for revisit */}
      {kind === 'writing' && (
        <div className="mt-4 sm:ml-[60px]" aria-label={`Writing exercise: ${title}`}>
          {problemData ? (
            <PracticeCardRouter
              problemData={problemData}
              subComponentId={id}
              isCompleted={isCompleted}
              onComplete={onComplete}
              initialFeedback={initialFeedback}
              initialSubmissionText={initialSubmissionText}
            />
          ) : (
            <p className="font-body text-[16px] text-on-surface-variant">
              This writing exercise isn&apos;t available yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
