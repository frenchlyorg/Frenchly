'use client'

import { useState } from 'react'
import { gradeMatching } from '@/lib/practice/grading'
import { MatchingProblem } from '@/lib/practice/types'

/** Fisher-Yates shuffle — returns a new shuffled array, does not mutate the original */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface MatchingCardProps {
  problem: MatchingProblem
  id: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function MatchingCard({
  problem,
  id,
  isCompleted,
  onComplete,
}: MatchingCardProps) {
  // Pitfall 4 guard: shuffle right column ONCE at mount via lazy useState initializer — stable across re-renders
  const [shuffledRight] = useState<string[]>(() =>
    shuffleArray(problem.pairs.map(p => p.right))
  )

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  // Pitfall 6 guard: if isCompleted, initialize with all pairs filled in
  const [pairings, setPairings] = useState<Record<string, string>>(() =>
    isCompleted
      ? Object.fromEntries(problem.pairs.map(p => [p.left, p.right]))
      : {}
  )
  const [checked, setChecked] = useState(isCompleted)
  const [matchResults, setMatchResults] = useState<Record<string, boolean> | null>(
    isCompleted
      ? Object.fromEntries(problem.pairs.map(p => [p.left, true]))
      : null
  )

  const allPaired = Object.keys(pairings).length >= problem.pairs.length

  function handleLeftClick(item: string) {
    if (checked) return

    if (selectedLeft === item) {
      // Deselect if clicking already-selected left item
      setSelectedLeft(null)
      return
    }

    // If item is already paired, remove pair and set as selected (D-03 rule 3)
    if (pairings[item] !== undefined) {
      setPairings(prev => {
        const next = { ...prev }
        delete next[item]
        return next
      })
    }

    setSelectedLeft(item)
  }

  function handleRightClick(item: string) {
    if (checked || !selectedLeft) return

    setPairings(prev => {
      const next = { ...prev }

      // If this right item is already claimed by another left item, break that pair
      const priorLeft = Object.keys(next).find(left => next[left] === item)
      if (priorLeft !== undefined && priorLeft !== selectedLeft) {
        delete next[priorLeft]
      }

      // Form the new pair
      next[selectedLeft] = item
      return next
    })

    setSelectedLeft(null)
  }

  function handleCheck() {
    if (checked || !allPaired) return
    const results = gradeMatching(pairings, problem.pairs)
    setMatchResults(results)
    setChecked(true)
    // D-05/D-06: auto-complete immediately, regardless of score
    onComplete(id)
  }

  // --- Style helpers ---

  function leftItemClass(item: string): string {
    const base =
      'min-h-[44px] w-full flex items-center px-4 py-3 rounded-[8px] border text-left font-body text-[16px] transition-colors'

    if (checked && matchResults) {
      const correct = matchResults[item]
      if (correct) return `${base} bg-tertiary/10 border-tertiary text-on-surface cursor-default`
      return `${base} bg-error/10 border-error text-on-surface cursor-default`
    }

    if (selectedLeft === item) {
      return `${base} bg-surface-container border-primary border-2 text-on-surface`
    }

    if (pairings[item] !== undefined) {
      return `${base} bg-surface-container-high border-primary text-on-surface`
    }

    return `${base} bg-surface-container-low border-outline text-on-surface`
  }

  function rightItemClass(item: string): string {
    const base =
      'min-h-[44px] w-full flex items-center px-4 py-3 rounded-[8px] border text-left font-body text-[16px] transition-colors'

    if (checked && matchResults) {
      // Find which left item this right item is paired with to determine correctness
      const leftForItem = Object.keys(pairings).find(left => pairings[left] === item)
      if (leftForItem !== undefined) {
        const correct = matchResults[leftForItem]
        if (correct) return `${base} bg-tertiary/10 border-tertiary text-on-surface cursor-default`
        return `${base} bg-error/10 border-error text-on-surface cursor-default`
      }
      return `${base} bg-surface-container-low border-outline text-on-surface cursor-default`
    }

    const isPaired = Object.values(pairings).includes(item)
    if (isPaired) return `${base} bg-surface-container-high border-primary text-on-surface`
    return `${base} bg-surface-container-low border-outline text-on-surface`
  }

  function leftAriaLabel(item: string): string {
    if (selectedLeft === item) return `${item} — selected`
    if (pairings[item] !== undefined) return `${item} — paired with ${pairings[item]}`
    return `${item} — unpaired`
  }

  const correctCount = matchResults
    ? Object.values(matchResults).filter(Boolean).length
    : 0

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[16px] p-6 mt-4">
      <p className="font-body text-[18px] leading-8 text-on-surface mb-4">{problem.prompt}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {problem.pairs.map(pair => (
            <button
              key={pair.left}
              type="button"
              aria-pressed={!!pairings[pair.left]}
              aria-label={leftAriaLabel(pair.left)}
              onClick={() => handleLeftClick(pair.left)}
              disabled={checked}
              className={leftItemClass(pair.left)}
            >
              {pair.left}
            </button>
          ))}
        </div>

        {/* Right column — shuffled */}
        <div className="flex flex-col gap-2">
          {shuffledRight.map(item => (
            <button
              key={item}
              type="button"
              aria-label={
                Object.values(pairings).includes(item)
                  ? `${item} — paired`
                  : `${item} — available`
              }
              onClick={() => handleRightClick(item)}
              disabled={checked}
              className={rightItemClass(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Post-Check incorrect pair reveals */}
      {checked && matchResults && (
        <div className="mt-3">
          {problem.pairs
            .filter(pair => matchResults[pair.left] === false)
            .map(pair => (
              <p key={pair.left} className="font-label text-[13px] text-error mt-1">
                &ldquo;{pair.left}&rdquo; pairs with &ldquo;{pair.right}&rdquo;
              </p>
            ))}
        </div>
      )}

      <button
        disabled={checked || !allPaired}
        onClick={handleCheck}
        className="mt-4 px-6 py-3 bg-primary text-white font-label text-[13px] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Check matches
      </button>

      {checked && matchResults && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 font-label text-[13px] text-on-surface-variant"
        >
          {correctCount} of {problem.pairs.length} correct
        </p>
      )}
    </div>
  )
}
