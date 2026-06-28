/**
 * /levels/[levelSlug] — Level page skeleton loader
 *
 * Next.js App Router: this file is automatically rendered while the Server Component
 * suspends. Mirrors the structural layout of the real level page.
 *
 * D-SK-01: max-w-[1040px] container, 2-column card grid skeleton.
 * D-SK-02: animate-pulse (opacity pulse, no shimmer gradient).
 * D-SK-05: bg-surface-container-high (warm bone — no ad-hoc hex).
 * D-A11Y-04: motion-reduce:animate-none (prefers-reduced-motion).
 * D-A11Y: aria-hidden="true" — screen readers skip skeleton entirely.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">

        {/* Header group — mirrors h1 + description */}
        <div className="mb-10">
          <div className="h-12 w-48 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-3" />
          <div className="h-4 max-w-[480px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Lesson card grid — 2-column matches real layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[120px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[120px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[120px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[120px] rounded-[16px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>

      </div>
    </main>
  )
}
