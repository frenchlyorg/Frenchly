/**
 * DiagnosticProgress — thin progress bar + question counter + soft elapsed badge.
 *
 * Server-renderable (no 'use client'). The elapsed label is passed in pre-formatted
 * (no setInterval here) so this stays a pure presentational component.
 * Design tokens only; the fill uses bg-primary (never green — green = correct only).
 *
 * UI-SPEC refs: §Component Inventory — DiagnosticProgress; §Accessibility.
 */
interface DiagnosticProgressProps {
  /** 1-based index of the question currently shown. */
  current: number
  /** Total questions in the drawn set. */
  total: number
  /** Pre-formatted soft elapsed label, e.g. "2m". Optional. */
  elapsedLabel?: string
}

export default function DiagnosticProgress({
  current,
  total,
  elapsedLabel,
}: DiagnosticProgressProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-label text-[13px] text-on-surface-variant">
          Question {current} of {total}
        </span>
        {elapsedLabel && (
          <span className="font-label text-[13px] text-on-surface-variant" aria-hidden="true">
            {elapsedLabel}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
        className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
