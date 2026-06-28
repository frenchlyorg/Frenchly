/**
 * /dashboard — Dashboard skeleton loader
 *
 * Next.js App Router: rendered while Server Component suspends.
 * Mirrors the structural layout of the real dashboard page.
 *
 * D-SK-02: animate-pulse (opacity pulse, no shimmer gradient).
 * D-SK-05: bg-surface-container-high (warm bone — no ad-hoc hex).
 * D-A11Y-04: motion-reduce:animate-none (prefers-reduced-motion).
 * D-A11Y: aria-hidden="true" — screen readers skip skeleton entirely.
 * Container: max-w-[1040px] per CLAUDE.md dashboard container width rule.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">

        {/* Greeting heading placeholder */}
        <div className="h-10 w-40 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-8" />

        {/* Card blocks — mirrors lesson card list */}
        <div className="flex flex-col gap-4">
          <div className="h-[80px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[80px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>

      </div>
    </main>
  )
}
