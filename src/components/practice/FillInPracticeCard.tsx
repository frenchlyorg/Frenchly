'use client'

/**
 * FillInPracticeCard — fill-in-the-blank and conjugation-single practice card.
 *
 * Wraps the existing FillInInput. Handles submit/retry states and calls gradeFillin.
 * Handles both FillInProblem ('fill-in') and ConjugationSingleProblem ('conjugation-single')
 * — same component, different prompt copy (UI-SPEC §Design Contract).
 *
 * Completion trigger (D-06): onComplete fires immediately on correct answer.
 * Retry (D-08): resets inputValue='' + gradeResult=null — clean slate.
 * Pitfall 6 guard: isCompleted=true on mount sets gradeResult={ correct: true }, disables input.
 * Pitfall 5 guard: blank submissions are blocked (disabled button + gradeFillin blank guard).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import FillInInput from '@/components/diagnostic/FillInInput'
import { gradeFillin } from '@/lib/practice/grading'
import type { GradeResult } from '@/lib/practice/grading'
import type { FillInProblem, ConjugationSingleProblem } from '@/lib/practice/types'

interface FillInPracticeCardProps {
  problem: FillInProblem | ConjugationSingleProblem
  id: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function FillInPracticeCard({
  problem,
  id,
  isCompleted,
  onComplete,
}: FillInPracticeCardProps) {
  const [inputValue, setInputValue] = useState<string>('')
  // Pitfall 6 guard: initialize as correct when sub-component is already done
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(
    isCompleted ? { correct: true } : null
  )

  // Ref to FillInInput wrapper for focus management on retry
  const inputWrapperRef = useRef<HTMLDivElement | null>(null)

  // Keep state in sync when isCompleted changes (e.g. server state loads late)
  useEffect(() => {
    if (isCompleted && gradeResult === null) {
      setGradeResult({ correct: true })
    }
  }, [isCompleted, gradeResult])

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() === '') return
    const result = gradeFillin(inputValue, problem.correctAnswer)
    setGradeResult(result)
    if (result.correct) {
      onComplete(id)
    }
  }, [inputValue, problem.correctAnswer, onComplete, id])

  // D-08 / Pitfall 5: reset clean on retry, then move focus back to input
  const handleRetry = useCallback(() => {
    setInputValue('')
    setGradeResult(null)
    // Defer focus until after re-render so the input is re-enabled
    setTimeout(() => {
      const input = inputWrapperRef.current?.querySelector<HTMLInputElement>('input')
      input?.focus()
    }, 0)
  }, [])

  const isCorrect = gradeResult?.correct === true
  const isIncorrect = gradeResult !== null && !gradeResult.correct

  // Derive FillInInput state
  const inputState: 'default' | 'correct' | 'incorrect' = isCorrect
    ? 'correct'
    : isIncorrect
      ? 'incorrect'
      : 'default'

  // Submit is enabled when there's content and no grade result yet
  const submitEnabled = inputValue.trim() !== '' && gradeResult === null

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
      {/* Problem prompt */}
      <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>

      {/* Fill-in input */}
      <div ref={inputWrapperRef}>
        <FillInInput
          value={inputValue}
          state={inputState}
          disabled={isCorrect}
          accentNote={gradeResult?.accentNote}
          errorMessage={
            isIncorrect ? `The answer is ${problem.correctAnswer}` : undefined
          }
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Submit button — shown when not yet graded */}
      {gradeResult === null && (
        <button
          type="button"
          disabled={!submitEnabled}
          onClick={handleSubmit}
          className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit answer
        </button>
      )}

      {/* Try again — shown after incorrect submission */}
      {isIncorrect && (
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
