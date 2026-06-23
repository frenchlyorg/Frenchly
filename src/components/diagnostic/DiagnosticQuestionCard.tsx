'use client'

/**
 * DiagnosticQuestionCard — renders one diagnostic question (MC or fill-in) and
 * submits the answer via the submitDiagnosticAnswer Server Action. The server
 * grades + records the answer and revalidates; the page then advances to the
 * next unanswered question (or, on the final answer, redirects to the result).
 *
 * The question prop never carries correct_answer (answer-key boundary, Pitfall 1).
 *
 * UI-SPEC refs: §Component Inventory — DiagnosticQuestionCard; §Interaction Contracts.
 */
import { useState, useTransition } from 'react'
import { submitDiagnosticAnswer } from '@/actions/diagnostic'
import MCOptionButton from './MCOptionButton'
import FillInInput from './FillInInput'

interface CardQuestion {
  id: string
  type: 'mc' | 'fill_in'
  question_text: string
  options: string[] | null
}

interface DiagnosticQuestionCardProps {
  question: CardQuestion
  attemptId: string
  /** When true this is the final drawn question — changes the submit copy. */
  isLast?: boolean
}

export default function DiagnosticQuestionCard({
  question,
  attemptId,
  isLast = false,
}: DiagnosticQuestionCardProps) {
  const [selected, setSelected] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const answer = question.type === 'mc' ? selected : value
  const canSubmit = answer.trim().length > 0 && !pending

  function submit() {
    if (answer.trim().length === 0) {
      setError('Enter an answer before continuing.')
      return
    }
    setError('')
    startTransition(async () => {
      await submitDiagnosticAnswer({ attemptId, questionId: question.id, answer })
    })
  }

  return (
    <div className="rounded-[16px] border border-outline-variant bg-surface-container-low p-6">
      <p className="font-body text-[18px] leading-8 text-on-surface">{question.question_text}</p>

      <div className="mt-5">
        {question.type === 'mc' ? (
          <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-3">
            {(question.options ?? []).map((opt) => (
              <MCOptionButton
                key={opt}
                option={opt}
                selected={selected === opt}
                disabled={pending}
                onSelect={setSelected}
              />
            ))}
          </div>
        ) : (
          <FillInInput
            value={value}
            disabled={pending}
            errorMessage={error}
            onChange={setValue}
            onSubmit={submit}
          />
        )}
      </div>

      {error && question.type === 'mc' && (
        <p role="alert" className="mt-3 font-label text-[13px] text-error">
          {error}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isLast ? 'Submit and see results' : 'Submit answer'}
        </button>
      </div>
    </div>
  )
}
