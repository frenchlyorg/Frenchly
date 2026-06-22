/**
 * LESSON-04: Level lock derivation helper.
 *
 * Pure function — no imports, no side effects, no DB access.
 * Safe to import in tests without a database.
 *
 * Lock rule (D-L05 / D-L06):
 *   A level is locked when the student's current_level_id is set AND does not
 *   match this level's id.
 *
 * Null/undefined guard (Pitfall 3):
 *   If current_level_id is null or undefined the student is new (or has no
 *   level assigned yet). Treat as French 1 → unlocked.
 *
 * Phase 4 note:
 *   levelNumber is carried in the signature but unused here. Phase 4 will
 *   generalise the rule to `levelNumber > unlockedThroughNumber` once the
 *   diagnostic system introduces an `unlocked_through` watermark. Keep the
 *   signature stable so callers need no change.
 */
export function deriveIsLevelLocked(args: {
  levelId: string
  /** Unused in Phase 3 — reserved for Phase 4 generalisation. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  levelNumber: number
  currentLevelId: string | null | undefined
}): boolean {
  // Null/undefined → treat as French 1 default → not locked
  if (args.currentLevelId == null) {
    return false
  }

  // Locked when the student's current level is a different level
  return args.levelId !== args.currentLevelId
}
