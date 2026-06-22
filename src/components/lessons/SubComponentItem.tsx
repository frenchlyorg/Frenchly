'use client'

/**
 * SubComponentItem — per-item toggle in the lesson sub-component list.
 *
 * UI-SPEC refs: §Component Inventory — SubComponentItem; §Interaction Contracts — mark complete toggle.
 * Design rules: aria-pressed, 48px touch target, no green (text-tertiary/bg-tertiary banned),
 * completed = muted (text-on-surface-variant), not struck through.
 */

import LessonMarkdown from './LessonMarkdown'

interface SubComponentItemProps {
  id: string
  title: string
  kind: 'explainer' | 'practice' | 'writing'
  content: string | null
  isCompleted: boolean
  onComplete: (id: string) => void
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
}: SubComponentItemProps) {
  return (
    <div className="py-2">
    <div className="flex items-center gap-3">
      {/* Completion toggle button — 48px min touch target (UI-SPEC §Spacing) */}
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

      {/* Action label — sentence case per CLAUDE.md */}
      <span
        className={[
          'flex-shrink-0 font-label text-[13px]',
          isCompleted ? 'text-on-surface-variant' : 'text-primary',
        ].join(' ')}
        aria-hidden="true"
      >
        {isCompleted ? 'Done' : 'Mark complete'}
      </span>
    </div>

      {/* Explainer body — markdown content rendered below the toggle row,
          indented to align past the 48px button + 12px gap. Only explainers
          carry content in Phase 3; practice/writing are title-only placeholders. */}
      {content && (
        <div className="mt-3 sm:ml-[60px]">
          <LessonMarkdown markdown={content} />
        </div>
      )}
    </div>
  )
}
