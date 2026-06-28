/**
 * /diagnostic/placement — Placement diagnostic skeleton loader
 *
 * Next.js App Router: rendered while Server Component suspends.
 * Mirrors the structural layout of the placement diagnostic page.
 *
 * D-SK-02: animate-pulse (opacity pulse, no shimmer gradient).
 * D-SK-05: bg-surface-container-high (warm bone — no ad-hoc hex).
 * D-A11Y-04: motion-reduce:animate-none (prefers-reduced-motion).
 * D-A11Y: aria-hidden="true" — screen readers skip skeleton entirely.
 * Container: max-w-[720px] per CLAUDE.md lesson content width rule.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="max-w-[720px] mx-auto px-5 md:px-6 py-20">

        {/* Question block */}
        <div className="h-8 w-[400px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />

        {/* Answer option blocks — 4 options matching real diagnostic */}
        <div className="flex flex-col gap-3">
          <div className="h-[48px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[48px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[48px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[48px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>

      </div>
    </main>
  )
}
