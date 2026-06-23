/**
 * Phase 04 — Diagnostic gating pure functions (cooldown + lesson completion).
 *
 * Pure functions — no imports, no side effects, no DB access.
 * Safe to import in tests and React components without a database.
 */

/** completedAt + cooldownHours, as a Date. */
export function computeCooldownUntil(completedAt: Date, cooldownHours: number): Date {
  return new Date(completedAt.getTime() + cooldownHours * 60 * 60 * 1000)
}

/** True when now is before cooldownUntil (D-U03). Null → not active. */
export function isCooldownActive(cooldownUntil: Date | null, now: Date = new Date()): boolean {
  if (cooldownUntil == null) return false
  return now < cooldownUntil
}

/**
 * Human-readable remaining cooldown: "2h 14m" or "45m" (no leading 0h, no seconds).
 * Returns '' once expired. Minutes are rounded up so the countdown never shows 0m
 * while time remains.
 */
export function formatCooldownRemaining(cooldownUntil: Date, now: Date = new Date()): string {
  const ms = cooldownUntil.getTime() - now.getTime()
  if (ms <= 0) return ''
  const totalMinutes = Math.ceil(ms / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/**
 * True only when the level has at least one sub-component and every one is
 * complete (D-E01). Empty list → false (nothing to gate on).
 */
export function deriveAllLessonsComplete(
  subComponentIds: string[],
  completedSubComponentIds: Set<string>
): boolean {
  return subComponentIds.length > 0 && subComponentIds.every((id) => completedSubComponentIds.has(id))
}
