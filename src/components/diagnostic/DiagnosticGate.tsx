/**
 * DiagnosticGate — mandatory placement interstitial for first-time students.
 *
 * Server-renderable (no 'use client'). Rendered by the dashboard and level pages
 * (a Server Component guard, NOT middleware — middleware cannot do the RLS read,
 * Pitfall 4) whenever the student has no completed placement. There is deliberately
 * NO skip/dismiss affordance — placement is forced (D-P01 / D-P02).
 *
 * UI-SPEC refs: §Component Inventory — DiagnosticGate; §Copywriting Contract.
 */
import Link from 'next/link'

interface DiagnosticGateProps {
  /** When true the student already has an unfinished diagnostic — show resume copy. */
  hasInProgress: boolean
}

export default function DiagnosticGate({ hasInProgress }: DiagnosticGateProps) {
  const body = hasInProgress
    ? 'You have an unfinished diagnostic. Pick up where you left off.'
    : 'Answer 10 short questions so we can find the right starting point for you. There are no wrong answers — this helps us help you.'
  const cta = hasInProgress ? 'Continue diagnostic' : 'Start placement diagnostic'

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="mx-auto max-w-[480px] px-5 py-20">
        <div className="rounded-[16px] bg-surface-container-low p-8 text-center">
          <h1 className="font-heading text-[28px] font-semibold text-on-surface">
            Before you begin
          </h1>

          <p className="mt-4 font-body text-[16px] leading-7 text-on-surface-variant">{body}</p>

          <Link
            href="/diagnostic/placement"
            className="mt-8 inline-block min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90"
          >
            {cta}
          </Link>
        </div>
      </div>
    </main>
  )
}
