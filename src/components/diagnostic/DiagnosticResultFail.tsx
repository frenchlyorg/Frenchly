'use client'

/**
 * DiagnosticResultFail — end-of-level fail screen (D-E03).
 *
 * Shows the correct-count score (NO percentage, D-P05 extended), a weak-area review
 * section linking the lessons behind missed questions, and a cooldown-gated retry.
 * Manages retry-enabled state from CooldownCountdown.onExpire.
 *
 * No green (correct-answer) color anywhere in the fail flow — primary/neutral tones
 * only (CLAUDE.md rule 3 / UX-10).
 *
 * UI-SPEC refs: §Component Inventory — DiagnosticResultFail; §Copywriting Contract.
 */
import { useState } from 'react'
import Link from 'next/link'
import { isCooldownActive } from '@/lib/diagnostics/gating'
import CooldownCountdown from './CooldownCountdown'

interface WeakLesson {
  id: string
  title: string
  levelSlug: string
}

interface DiagnosticResultFailProps {
  correctCount: number
  total: number
  weakLessons: WeakLesson[]
  cooldownUntil: string | null
  /** Bound Server Action that re-starts (re-draws) the end-of-level diagnostic. */
  retryAction: () => Promise<void>
}

export default function DiagnosticResultFail({
  correctCount,
  total,
  weakLessons,
  cooldownUntil,
  retryAction,
}: DiagnosticResultFailProps) {
  const [active, setActive] = useState(
    cooldownUntil ? isCooldownActive(new Date(cooldownUntil)) : false
  )

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="font-heading text-[28px] font-semibold text-on-surface">Not quite yet</h1>
      <p className="mt-2 font-label text-[13px] text-on-surface-variant">
        You got {correctCount} of {total} right.
      </p>

      {weakLessons.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-[18px] font-semibold text-on-surface">
            <span className="text-primary" aria-hidden="true">
              «{' '}
            </span>
            Review these topics
            <span className="text-primary" aria-hidden="true">
              {' '}»
            </span>
          </h2>
          <p className="mt-2 font-body text-[16px] leading-7 text-on-surface-variant">
            These lessons cover what tripped you up. Give them another look before retrying.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {weakLessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/levels/${lesson.levelSlug}/lessons/${lesson.id}`}
                  className="font-body text-[16px] text-primary hover:underline"
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 rounded-[8px] border border-outline-variant bg-surface-container p-6">
        {active && cooldownUntil ? (
          <>
            <p className="font-label text-[13px] text-on-surface-variant">Retry available in</p>
            <div className="mt-1">
              <CooldownCountdown cooldownUntil={cooldownUntil} onExpire={() => setActive(false)} />
            </div>
          </>
        ) : null}

        <form action={retryAction} className="mt-4">
          <button
            type="submit"
            disabled={active}
            className={[
              'min-h-[44px] rounded-[8px] px-6 py-3 font-label font-semibold',
              active
                ? 'bg-primary text-white opacity-40 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90',
            ].join(' ')}
          >
            Retry diagnostic
          </button>
        </form>
      </div>
    </div>
  )
}
