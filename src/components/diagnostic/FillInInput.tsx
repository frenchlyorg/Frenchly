'use client'

/**
 * FillInInput — free-text answer input for fill-in questions.
 *
 * Focus state thickens the coral bottom border (DESIGN rule 5). Post-submit correct
 * uses border-tertiary (green = correct only); incorrect uses border-error. The soft
 * accent note uses text-secondary (warm amber) — NOT green, NOT error — because the
 * answer was still correct (D-D03 leniency).
 *
 * UI-SPEC refs: §Component Inventory — FillInInput; §Color; §Accessibility.
 */
export type FillInState = 'default' | 'correct' | 'incorrect'

interface FillInInputProps {
  value: string
  state?: FillInState
  disabled?: boolean
  accentNote?: string
  errorMessage?: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export default function FillInInput({
  value,
  state = 'default',
  disabled = false,
  accentNote,
  errorMessage,
  onChange,
  onSubmit,
}: FillInInputProps) {
  let borderClasses = 'border-outline focus:border-b-[3px] focus:border-primary'
  if (state === 'correct') borderClasses = 'border-tertiary border-b-[3px]'
  else if (state === 'incorrect') borderClasses = 'border-error border-b-[3px]'

  return (
    <div>
      <input
        type="text"
        name="answer"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          }
        }}
        aria-label="Your answer"
        aria-describedby={accentNote ? 'fillin-accent-note' : undefined}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={[
          'w-full min-h-[44px] rounded px-3 py-2 font-body text-[16px]',
          'bg-surface-container-low text-on-surface border outline-none',
          borderClasses,
        ].join(' ')}
      />
      {accentNote && (
        <p id="fillin-accent-note" className="mt-2 font-label text-[13px] text-secondary">
          Correct — watch the accents: {accentNote}, not {value}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-2 font-label text-[13px] text-error">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
