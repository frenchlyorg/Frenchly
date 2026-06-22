/**
 * LockBadge — locked pill badge for locked level cards and level page headers.
 *
 * Pure presentational component. No 'use client' needed.
 * Tokens: bg-surface-container, text-on-surface-variant, rounded-full, font-label
 * Copy: "Locked" (sentence case, per CLAUDE.md + UI-SPEC copywriting contract)
 */
export default function LockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 font-label text-[11px] text-on-surface-variant bg-surface-container rounded-full px-2 py-0.5"
      aria-label="Locked"
    >
      {/* Lock glyph — text character, no icon library (UI-SPEC §Registry Safety) */}
      <span aria-hidden="true">&#128274;</span>
      Locked
    </span>
  )
}
