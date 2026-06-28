/**
 * /levels/[levelSlug]/lessons/[lessonId] — Lesson page skeleton loader
 *
 * Next.js App Router: rendered while Server Component suspends.
 * Mirrors the structural layout of the real lesson page.
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
      <div aria-hidden="true" className="max-w-[720px] mx-auto px-5 md:px-6 py-12">

        {/* Back link placeholder */}
        <div className="h-4 w-32 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />

        {/* Lesson title block */}
        <div className="h-8 w-[320px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-2" />

        {/* Time estimate */}
        <div className="h-4 w-16 rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none mb-8" />

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-surface-container-high animate-pulse motion-reduce:animate-none mb-6" />

        {/* Sub-component item list — 4 stacked blocks matching accordion item height */}
        <div className="flex flex-col gap-2">
          <div className="h-[52px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[52px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[52px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
          <div className="h-[52px] rounded-[8px] bg-surface-container-high animate-pulse motion-reduce:animate-none" />
        </div>

      </div>
    </main>
  )
}
