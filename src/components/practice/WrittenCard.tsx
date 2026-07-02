'use client'

/**
 * WrittenCard — open-ended writing exercise card.
 *
 * Renders the writing prompt, an auto-resizing textarea, live word count,
 * and a "Check my writing" submit button that POSTs to /api/check-writing.
 *
 * State machine:
 *   idle → loading (fetch in flight) → done (feedback received, textarea disabled)
 *
 * Revisit case (isCompleted=true on mount): textarea blank+disabled, feedback from
 * initialFeedback shown immediately — no fetch (D-08, D-09).
 *
 * Error handling:
 *   - HTTP 429 → rate-limit message (D-07)
 *   - fetch throw → fallback message (D-06)
 *   - Both paths call onComplete in finally; SubComponentList.handleComplete
 *     then calls markSubComponentComplete (D-05, CR-04 fix).
 *
 * Design rules:
 *   - Feedback box: bg-surface-container + border-outline-variant only.
 *     NEVER text-tertiary / bg-tertiary / border-tertiary (CLAUDE.md rule 3).
 */

import { useCallback, useRef, useState } from 'react'
import type { WrittenProblem } from '@/lib/practice/types'

interface WrittenCardProps {
  problem: WrittenProblem
  subComponentId: string
  isCompleted: boolean
  initialFeedback?: string | null
  initialSubmissionText?: string | null
  onComplete: (id: string) => void
}

export default function WrittenCard({
  problem,
  subComponentId,
  isCompleted,
  initialFeedback = null,
  initialSubmissionText = null,
  onComplete,
}: WrittenCardProps) {
  const [text, setText] = useState<string>(initialSubmissionText ?? '')
  const [feedback, setFeedback] = useState<string | null>(
    initialFeedback ?? (isCompleted ? "We couldn't check that right now — keep going!" : null)
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [done, setDone] = useState<boolean>(isCompleted)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // D-02: word count derived inline — no extra state
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // D-01: auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [])

  // D-05 / D-06 / D-07: handleSubmit with try/catch/finally
  const handleSubmit = useCallback(async () => {
    if (!text.trim() || loading || done) return
    setLoading(true)
    try {
      const res = await fetch('/api/check-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subComponentId, text }),
      })
      const data = await res.json()
      if (data.rateLimited) {
        // D-07: rate limit — route returns 200 + rateLimited:true, lessons never block
        setFeedback("You've used all your writing checks for today — come back tomorrow!")
      } else {
        // D-05: set feedback from successful response
        setFeedback(data.feedback ?? "We couldn't check that right now — keep going!")
      }
    } catch {
      // D-06: network error fallback
      setFeedback("We couldn't check that right now — keep going!")
    } finally {
      // D-05: onComplete called AFTER setFeedback (feedback state is set in try/catch
      // before finally executes — T-06-12 mitigation).
      // CR-04/CR-05 fix: removed direct markSubComponentComplete call — onComplete
      // already triggers SubComponentList.handleComplete which calls markSubComponentComplete.
      // The direct call was firing it twice per submission and left an unhandled rejection
      // risk since finally blocks are not covered by the surrounding try/catch.
      setLoading(false)
      setDone(true)
      onComplete(subComponentId)
    }
  }, [text, loading, done, subComponentId, onComplete])

  const submitDisabled = text.trim() === '' || loading || done

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
      {/* Problem prompt */}
      <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>

      {/* Optional hints dropdown */}
      {problem.hints && (
        <details className="mb-4 rounded-lg border border-outline-variant bg-surface-container">
          <summary className="cursor-pointer px-4 py-2 font-label text-[13px] text-on-surface-variant select-none">
            Helpful phrases
          </summary>
          <p className="px-4 pb-3 pt-1 font-body text-[15px] text-on-surface whitespace-pre-line">
            {problem.hints}
          </p>
        </details>
      )}

      {/* Auto-resizing textarea — D-01 */}
      <textarea
        ref={textareaRef}
        name="submission"
        value={text}
        onChange={handleChange}
        disabled={loading || done}
        placeholder="Your writing"
        autoComplete="off"
        rows={1}
        style={{ caretColor: 'var(--color-primary)' }}
        className={[
          'w-full rounded px-3 py-2 font-body text-[16px]',
          'bg-surface-container-low text-on-surface border outline-none',
          'border-outline focus:border-b-[3px] focus:border-primary',
          'resize-none overflow-hidden',
          (loading || done) ? 'disabled:opacity-70 disabled:cursor-not-allowed' : '',
        ].join(' ')}
      />

      {/* D-02: word count display */}
      <p className="font-label text-[13px] text-on-surface-variant mt-1">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </p>

      {/* D-03: Submit button — hidden when done (D-08) */}
      {!done && (
        <button
          type="button"
          disabled={submitDisabled}
          onClick={handleSubmit}
          aria-busy={loading}
          className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          Check my writing
        </button>
      )}

      {/* Feedback display — warm neutral box only, NEVER green tokens (CLAUDE.md rule 3) */}
      {feedback !== null && (
        <div className="mt-4 rounded-lg bg-surface-container border border-outline-variant px-4 py-3">
          <p className="font-body text-[16px] text-on-surface">{feedback}</p>
        </div>
      )}
    </div>
  )
}
