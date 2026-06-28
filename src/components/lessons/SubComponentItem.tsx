'use client'

/**
 * SubComponentItem — accordion shell for a single lesson sub-component.
 *
 * UI-SPEC refs: §Component Inventory — AccordionShell; §Interaction Contracts — D-AC;
 *               §Color — Accordion; §Accessibility Contracts — accordion button ARIA.
 * Design rules: aria-expanded + aria-controls on header button; role="region" on content;
 *               no green (text-tertiary/bg-tertiary banned); no nested interactive elements.
 *
 * Phase 5: kind='practice' renders PracticeCardRouter below the title row.
 * Phase 9: Accordion layout — header button (isOpen, onToggle) + collapsible content region.
 *          For kind='explainer': "Mark complete" button lives INSIDE the content region
 *          (not the header button) to avoid nested interactive elements (RESEARCH §Pitfall 4).
 *          For kind='practice'/'writing': completion circle spacer inside header button is
 *          a plain div — no role="presentation", no tabIndex, no aria-label (RESEARCH §Pitfall 4).
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
  isOpen: boolean
  onToggle: () => void
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
  isOpen,
  onToggle,
}: SubComponentItemInternalProps) {
  return (
    <div>
      {/* ── Accordion header button — full-width, always visible ── */}
      <button
        type="button"
        id={`header-${id}`}
        aria-expanded={isOpen}
        aria-controls={`content-${id}`}
        onClick={onToggle}
        className="flex items-center gap-3 py-3 w-full text-left min-h-[48px] hover:bg-surface-container-low focus:outline-none focus:border-primary focus:border-[3px] rounded-[8px]"
      >
        {kind === 'practice' || kind === 'writing' ? (
          /* Non-interactive spacer for practice and writing kinds — inside accordion button,
             must be a plain div with NO role, NO tabIndex, NO aria-label (RESEARCH §Pitfall 4).
             Parent button handles all AT interaction. Completion is driven by PracticeCardRouter. */
          <div
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
            )}
            {/* Incomplete: muted circle with no icon — visually indicates "answer to complete" */}
          </div>
        ) : (
          /* Explainer kind — purely presentational circle div (NO onClick, NO aria-pressed,
             NO tabIndex). Shows completion state visually. The actual "Mark complete" action
             is in the collapsible content region below (RESEARCH §Open Questions #2). */
          <div
            className={[
              'flex-shrink-0 flex items-center justify-center',
              'min-h-[48px] min-w-[48px] rounded-full',
              'border-2',
              isCompleted
                ? 'bg-primary border-primary text-on-primary cursor-default'
                : 'bg-transparent border-outline text-on-surface',
            ].join(' ')}
            aria-hidden="true"
          >
            {/* Checkmark — faint outline when incomplete, filled coral when done */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className={isCompleted ? '' : 'opacity-40'}
            >
              <path
                d="M4 10l4.5 4.5L16 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
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

        {/* Action label — right-aligned, sentence case (CLAUDE.md rule 9) */}
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
      </button>

      {/* ── Collapsible content region — max-height transition (RESEARCH §Q2) ── */}
      <div
        id={`content-${id}`}
        role="region"
        aria-labelledby={`header-${id}`}
        className={[
          'overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'max-h-[2000px]' : 'max-h-0',
        ].join(' ')}
      >
        {/* Explainer body — markdown content rendered below the toggle row,
            indented to align past the 48px circle + 12px gap. */}
        {content && kind !== 'practice' && kind !== 'writing' && (
          <div className="mt-3 sm:ml-[60px]">
            <LessonMarkdown markdown={content} />
          </div>
        )}

        {/* Explainer "Mark complete" button — lives INSIDE content region, NOT in header button.
            Prevents nested interactive elements (RESEARCH §Pitfall 4, §Open Questions #2). */}
        {kind === 'explainer' && (
          <div className="mt-4 pb-6 sm:ml-[60px]">
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
                  : 'bg-transparent border-outline text-on-surface-variant hover:border-primary hover:text-primary focus:outline-none focus:border-primary focus:border-[3px]',
                'disabled:cursor-default',
              ].join(' ')}
            >
              {/* Checkmark — outline when incomplete (tick to complete), filled coral when done */}
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
            </button>
          </div>
        )}

        {/* Practice problem panel — renders PracticeCardRouter below title row. */}
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
    </div>
  )
}
