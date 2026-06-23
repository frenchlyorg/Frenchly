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
 * Phase 4 watermark rule (D-S02 / DIAG-03):
 *   When `unlockedThroughLevelNumber` is provided, a level is locked iff its
 *   `levelNumber` exceeds the watermark: `levelNumber > unlockedThroughLevelNumber`.
 *   This has no hard-coded level ceiling — it extends to any number of levels, and
 *   a higher placement (e.g. French 2) keeps lower levels accessible (D-P04).
 *
 * Graceful fallback (A3):
 *   When `unlockedThroughLevelNumber` is null/undefined (e.g. a profile predating
 *   the watermark backfill), fall back to the Phase 3 UUID-equality behaviour so
 *   nothing regresses: null currentLevelId → unlocked; else locked when the ids differ.
 */
export function deriveIsLevelLocked(args: {
  levelId: string
  levelNumber: number
  currentLevelId: string | null | undefined
  unlockedThroughLevelNumber?: number | null
}): boolean {
  // Phase 4: numeric watermark takes precedence when present.
  if (args.unlockedThroughLevelNumber != null) {
    return args.levelNumber > args.unlockedThroughLevelNumber
  }

  // Phase 3 fallback — null/undefined currentLevelId → treat as French 1 → not locked
  if (args.currentLevelId == null) {
    return false
  }

  // Locked when the student's current level is a different level
  return args.levelId !== args.currentLevelId
}
