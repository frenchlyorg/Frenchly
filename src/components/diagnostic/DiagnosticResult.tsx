/**
 * DiagnosticResult — placement result screen.
 *
 * Server-renderable. Shows the placed level inside the guillemet motif and
 * encouraging copy. NO raw percentage (D-P05) — placement is about where to
 * start, not a grade. Primary CTA goes to the dashboard.
 *
 * UI-SPEC refs: §Component Inventory — DiagnosticResult; §Copywriting Contract.
 */
import Link from 'next/link'

interface DiagnosticResultProps {
  /** Display name of the placed level, e.g. "French 1" or "French 2". */
  levelName: string
}

export default function DiagnosticResult({ levelName }: DiagnosticResultProps) {
  return (
    <div className="mx-auto max-w-[480px] rounded-[16px] bg-surface-container-low p-8 text-center">
      <p className="font-label text-[13px] text-on-surface-variant">You&rsquo;re all set</p>

      <h1 className="mt-3 font-heading text-[28px] font-semibold text-on-surface">
        {levelName}
      </h1>

      <p className="mt-4 font-body text-[18px] leading-8 text-on-surface">
        Great start — we&rsquo;ll begin you in {levelName}. You can dive into your first lesson now.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 inline-block min-h-[44px] rounded-[8px] bg-primary px-6 py-3 font-label font-semibold text-white hover:bg-primary/90"
      >
        Go to my lessons
      </Link>
    </div>
  )
}
