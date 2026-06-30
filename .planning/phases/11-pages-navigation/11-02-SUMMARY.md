---
plan: 11-02
status: complete
completed_at: "2026-06-30T23:00:00.000Z"
commits:
  - 281fd42 feat(11-01,11-02): contact page + dashboard real data
---

# Plan 11-02 Summary — Dashboard Real Data

## What was done

**Task 1 — Data fetching**
- Added nested level query (levels → lessons → sub_components, ordered by position via `referencedTable`)
- Added progress query with empty-.in sentinel (`["__none__"]`) on sub_component_progress
- Derived: `lessons`, `completedLessons`, `totalLessons`, `pct`, `firstIncomplete`, `continueHref`
- `continueHref` uses `firstIncomplete.id` (UUID), not slug — verified from lesson route

**Task 2 — UI**
- Removed dashed "coming soon" placeholder (`border-dashed`, "French 1 content launches")
- Added level card: `bg-surface-container rounded-[16px] p-8 border border-outline-variant`
- Added progress bar: `bg-surface-container-high` track + `bg-primary` fill with inline `width: ${pct}%`, ARIA attributes (`role="progressbar"`, `aria-valuenow/min/max/label`)
- Added label: `{completedLessons.length} of {totalLessons} lessons complete`
- Added Continue CTA: `<Link href={continueHref}>` with primary classes; text is "Continue lesson" or "All done — take the level quiz"
- `import Link from "next/link"` added; no `"use client"`

## Verification

- `npx tsc --noEmit` → exit 0
- Full test suite: 156/156 passed

## Success criteria met

- SC-3 / PAGE-05: Dashboard shows current level, progress bar with count, and Continue path ✓
- All 6 RESEARCH pitfalls honored (empty-.in sentinel, null-level fallback, referenced-table ordering, lesson-id href, server-only fetch, DiagnosticGate untouched) ✓
- No regressions: 156/156 tests green ✓
