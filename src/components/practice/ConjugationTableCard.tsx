'use client'

import React, { useState } from 'react'
import { gradeConjugationTable, GradeResult } from '@/lib/practice/grading'
import { ConjugationTableProblem } from '@/lib/practice/types'

const PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const
type Pronoun = (typeof PRONOUNS)[number]

function makeAllCorrect(
  answers: ConjugationTableProblem['answers']
): Record<string, GradeResult> {
  return Object.fromEntries(PRONOUNS.map(p => [p, { correct: true }]))
}

interface ConjugationTableCardProps {
  problem: ConjugationTableProblem
  id: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function ConjugationTableCard({
  problem,
  id,
  isCompleted,
  onComplete,
}: ConjugationTableCardProps) {
  // Pitfall 6 guard: if isCompleted, initialize to filled-in correct state
  const [cellValues, setCellValues] = useState<Record<string, string>>(() =>
    isCompleted
      ? { ...problem.answers }
      : Object.fromEntries(PRONOUNS.map(p => [p, '']))
  )
  const [checked, setChecked] = useState(isCompleted)
  const [cellResults, setCellResults] = useState<Record<string, GradeResult> | null>(
    isCompleted ? makeAllCorrect(problem.answers) : null
  )

  const hasContent = Object.values(cellValues).some(v => v.trim() !== '')

  function handleCheck() {
    if (checked || !hasContent) return
    const results = gradeConjugationTable(cellValues, problem.answers as Record<string, string>)
    setCellResults(results)
    setChecked(true)
    // D-06/D-09: auto-complete immediately, regardless of score
    onComplete(id)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, pronoun: Pronoun) {
    if (e.key === 'Enter' && pronoun === 'ils' && !checked) {
      e.preventDefault()
      handleCheck()
    }
  }

  function cellClassName(pronoun: string): string {
    const base =
      'min-h-[44px] rounded px-3 py-2 font-body text-[16px] bg-surface-container-low text-on-surface border border-outline outline-none focus:border-b-[3px] focus:border-primary transition-all w-full'
    if (!checked || !cellResults) return base
    const result = cellResults[pronoun]
    if (!result) return base
    if (result.correct) return `${base} bg-tertiary/10 border-tertiary border-b-[3px]`
    return `${base} bg-error/10 border-error border-b-[3px]`
  }

  const correctCount = cellResults
    ? Object.values(cellResults).filter(r => r.correct).length
    : 0

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
      <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>

      <div
        role="group"
        aria-label="Conjugation table"
        className="grid grid-cols-2 gap-x-6 gap-y-1"
      >
        {(['je', 'tu', 'il'] as const).map((pronoun, i) => {
          const rightPronoun = (['nous', 'vous', 'ils'] as const)[i]
          return (
            <React.Fragment key={pronoun}>
              {/* Left cell */}
              <div className="grid grid-cols-[36px_1fr] gap-x-3 gap-y-1">
                <span className="font-label text-[13px] text-on-surface-variant self-center text-right">{pronoun}</span>
                <div className="flex flex-col gap-1">
                  <input aria-label={`${pronoun} form`} value={cellValues[pronoun]} onChange={e => setCellValues(prev => ({ ...prev, [pronoun]: e.target.value }))} onKeyDown={e => handleKeyDown(e, pronoun)} disabled={checked} className={cellClassName(pronoun)} />
                  {checked && cellResults?.[pronoun]?.correct === false && (
                    <p className="font-label text-[11px] text-error">Answer: {problem.answers[pronoun]}</p>
                  )}
                </div>
              </div>
              {/* Right cell */}
              <div className="grid grid-cols-[44px_1fr] gap-x-3 gap-y-1">
                <span className="font-label text-[13px] text-on-surface-variant self-center text-right">{rightPronoun}</span>
                <div className="flex flex-col gap-1">
                  <input aria-label={`${rightPronoun} form`} value={cellValues[rightPronoun]} onChange={e => setCellValues(prev => ({ ...prev, [rightPronoun]: e.target.value }))} onKeyDown={e => handleKeyDown(e, rightPronoun)} disabled={checked} className={cellClassName(rightPronoun)} />
                  {checked && cellResults?.[rightPronoun]?.correct === false && (
                    <p className="font-label text-[11px] text-error">Answer: {problem.answers[rightPronoun]}</p>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      <button
        disabled={checked || !hasContent}
        onClick={handleCheck}
        className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Check conjugations
      </button>

      {checked && cellResults && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 font-label text-[13px] text-on-surface-variant"
        >
          {correctCount} of 6 correct
        </p>
      )}
    </div>
  )
}
