'use client'

/**
 * MCPracticeCard — multiple-choice practice problem card.
 *
 * Wraps the existing MCOptionButton. Handles select/submit/retry states.
 * GREEN (tertiary) is used ONLY for the correct-answer state on MCOptionButton
 * (CLAUDE.md rule 3 / UX-10). Primary button (bg-primary text-white) for CTAs.
 *
 * Completion trigger (D-06): onComplete fires immediately on correct submission.
 * Retry (D-08): resets selectedOption=null + submitted=false — no prior answer shown.
 * Pitfall 6 guard: isCompleted=true on mount initializes submitted=true + selectedOption=correctAnswer.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import MCOptionButton from '@/components/diagnostic/MCOptionButton'
import type { MCProblem } from '@/lib/practice/types'

interface MCPracticeCardProps {
  problem: MCProblem
  id: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function MCPracticeCard({
  problem,
  id,
  isCompleted,
  onComplete,
}: MCPracticeCardProps) {
  // Pitfall 6 guard: pre-populate correct state when already completed on mount
  const [selectedOption, setSelectedOption] = useState<string | null>(
    isCompleted ? problem.correctAnswer : null
  )
  const [submitted, setSubmitted] = useState<boolean>(isCompleted)

  // Container ref for focus management — querySelector finds first button on retry
  const optionsRef = useRef<HTMLDivElement | null>(null)

  // Keep state in sync when isCompleted changes (e.g. server state loads late)
  useEffect(() => {
    if (isCompleted && !submitted) {
      setSelectedOption(problem.correctAnswer)
      setSubmitted(true)
    }
  }, [isCompleted, submitted, problem.correctAnswer])

  const handleSubmit = useCallback(() => {
    if (!selectedOption) return
    setSubmitted(true)
    if (selectedOption === problem.correctAnswer) {
      onComplete(id)
    }
  }, [selectedOption, problem.correctAnswer, onComplete, id])

  // D-08 / Pitfall 5: reset clean on retry, then move focus to first option
  const handleRetry = useCallback(() => {
    setSelectedOption(null)
    setSubmitted(false)
    // Defer focus until after re-render so the buttons are re-enabled
    setTimeout(() => {
      const firstButton = optionsRef.current?.querySelector<HTMLButtonElement>('button')
      firstButton?.focus()
    }, 0)
  }, [])

  const isIncorrectSubmission = submitted && selectedOption !== problem.correctAnswer

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
      {/* Problem prompt */}
      <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>

      {/* Option list */}
      <div
        ref={optionsRef}
        role="radiogroup"
        aria-label="Answer options"
        className="flex flex-col gap-3"
      >
        {problem.options.map((option) => {
          let optionState: 'default' | 'correct' | 'incorrect' = 'default'
          if (submitted) {
            if (option === problem.correctAnswer) {
              optionState = 'correct'
            } else if (option === selectedOption) {
              optionState = 'incorrect'
            }
          }

          return (
            <MCOptionButton
              key={option}
              option={option}
              selected={selectedOption === option}
              state={optionState}
              disabled={submitted}
              onSelect={submitted ? () => {} : setSelectedOption}
            />
          )
        })}
      </div>

      {/* Submit button — shown when not yet submitted */}
      {!submitted && (
        <button
          type="button"
          disabled={!selectedOption}
          onClick={handleSubmit}
          className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit answer
        </button>
      )}

      {/* Try again — shown after incorrect submission */}
      {isIncorrectSubmission && (
        <button
          type="button"
          onClick={handleRetry}
          aria-label={`Try again — ${problem.prompt.slice(0, 30)}`}
          className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px]"
        >
          Try again
        </button>
      )}
    </div>
  )
}
