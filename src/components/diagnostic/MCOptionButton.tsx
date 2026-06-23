'use client'

/**
 * MCOptionButton — a single multiple-choice option, used inside a radiogroup.
 *
 * GREEN (tertiary) appears ONLY in the correct state (CLAUDE.md rule 3 / UX-10).
 * The correct/incorrect states are for post-submit review (Plan 05); placement
 * uses only default + selected.
 *
 * UI-SPEC refs: §Component Inventory — MCOptionButton; §Color; §Accessibility.
 */
import { Check, X } from 'lucide-react'

export type MCOptionState = 'default' | 'correct' | 'incorrect'

interface MCOptionButtonProps {
  option: string
  selected: boolean
  state?: MCOptionState
  disabled?: boolean
  onSelect: (option: string) => void
}

export default function MCOptionButton({
  option,
  selected,
  state = 'default',
  disabled = false,
  onSelect,
}: MCOptionButtonProps) {
  const base =
    'flex w-full items-center justify-between gap-3 min-h-[44px] px-4 py-3 rounded-[8px] border text-left font-body text-[16px] transition-colors'

  let stateClasses: string
  if (state === 'correct') {
    stateClasses = 'bg-tertiary/10 border-tertiary text-on-surface'
  } else if (state === 'incorrect') {
    stateClasses = 'bg-error/10 border-error text-on-surface'
  } else if (selected) {
    stateClasses = 'bg-surface-container-low border-primary border-2 text-on-surface'
  } else {
    stateClasses =
      'bg-surface-container-low border-outline text-on-surface hover:border-primary disabled:opacity-60'
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(option)}
      className={[base, stateClasses, disabled ? 'cursor-default' : 'cursor-pointer'].join(' ')}
    >
      <span>{option}</span>
      {state === 'correct' && <Check size={18} className="text-tertiary" aria-hidden="true" />}
      {state === 'incorrect' && <X size={18} className="text-error" aria-hidden="true" />}
    </button>
  )
}
