import { HeroBackground, DisabledCTA } from "@/components/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[600px] md:h-[680px] flex items-center justify-center overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 flex flex-col items-center px-5 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-on-surface mb-4">
            Learn French. Actually learn it.
          </h1>
          <p className="font-body text-lg text-on-surface-variant mb-8 max-w-[560px] leading-relaxed">
            Adaptive lessons for high school students who want to speak, not just pass.
          </p>
          <DisabledCTA />
        </div>
      </section>

      {/* Feature callouts */}
      <section className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        <h2 className="font-heading text-2xl font-semibold text-on-surface mb-12 text-center">
          Why Frenchly?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container rounded-lg p-8 border border-outline-variant">
            <h3 className="font-heading text-xl font-medium text-on-surface mb-3">
              Adaptive from day one
            </h3>
            <p className="font-body text-base text-on-surface-variant leading-relaxed">
              A short placement quiz finds your level so you start where you belong, not at lesson 1.
            </p>
          </div>
          <div className="bg-surface-container rounded-lg p-8 border border-outline-variant">
            <h3 className="font-heading text-xl font-medium text-on-surface mb-3">
              Grammar that sticks
            </h3>
            <p className="font-body text-base text-on-surface-variant leading-relaxed">
              Spaced-repetition practice with immediate feedback — no red marks, just clear corrections.
            </p>
          </div>
          <div className="bg-surface-container rounded-lg p-8 border border-outline-variant">
            <h3 className="font-heading text-xl font-medium text-on-surface mb-3">
              One focused session
            </h3>
            <p className="font-body text-base text-on-surface-variant leading-relaxed">
              No streaks to break. No social pressure. Just 15 minutes of focused French per day.
            </p>
          </div>
        </div>
      </section>

      {/* Mission teaser */}
      <section className="bg-surface-container-low py-20">
        <div className="max-w-[720px] mx-auto px-5 md:px-6 text-center">
          <h2 className="font-heading text-2xl font-semibold text-on-surface mb-6">
            Built for students who deserve better tools
          </h2>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
            Frenchly was built for high school students studying French who felt left behind by
            textbooks and let down by gamified apps. It offers focused, grammar-forward lessons
            with immediate feedback — no fluff, no fake points. Just French.
          </p>
          <a href="/mission" className="text-primary hover:underline font-label text-sm">
            Read our mission
          </a>
        </div>
      </section>
    </div>
  );
}
