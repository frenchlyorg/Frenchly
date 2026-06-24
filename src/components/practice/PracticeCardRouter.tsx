'use client'

/**
 * PracticeCardRouter — routes ProblemData.type to the correct card component.
 *
 * 'mc'                 → MCPracticeCard
 * 'fill-in'            → FillInPracticeCard
 * 'conjugation-single' → FillInPracticeCard (same component, different prompt — UI-SPEC §Design Contract)
 * 'conjugation-table'  → ConjugationTableCard (Plan 03)
 * 'matching'           → MatchingCard (Plan 03)
 */

import MCPracticeCard from '@/components/practice/MCPracticeCard'
import FillInPracticeCard from '@/components/practice/FillInPracticeCard'
import ConjugationTableCard from '@/components/practice/ConjugationTableCard'
import MatchingCard from '@/components/practice/MatchingCard'
import type { ProblemData } from '@/lib/practice/types'

interface PracticeCardRouterProps {
  problemData: ProblemData
  subComponentId: string
  isCompleted: boolean
  onComplete: (id: string) => void
}

export default function PracticeCardRouter({
  problemData,
  subComponentId,
  isCompleted,
  onComplete,
}: PracticeCardRouterProps) {
  switch (problemData.type) {
    case 'mc':
      return (
        <MCPracticeCard
          problem={problemData}
          id={subComponentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      )

    case 'fill-in':
      return (
        <FillInPracticeCard
          problem={problemData}
          id={subComponentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      )

    case 'conjugation-single':
      // Reuses FillInPracticeCard — single blank behaves identically to fill-in (D-01)
      return (
        <FillInPracticeCard
          problem={problemData}
          id={subComponentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      )

    case 'conjugation-table':
      return (
        <ConjugationTableCard
          problem={problemData}
          id={subComponentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      )

    case 'matching':
      return (
        <MatchingCard
          problem={problemData}
          id={subComponentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      )

    default:
      // TypeScript exhaustiveness: this branch is unreachable if ProblemData is complete
      return null
  }
}
