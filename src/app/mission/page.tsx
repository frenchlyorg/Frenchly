export default function MissionPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <article className="max-w-[720px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-on-surface mb-8">Our mission</h1>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">
          Every year, hundreds of thousands of high school students take French and struggle not
          because they lack ability, but because their tools are wrong for them.
        </p>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">
          Frenchly was built to fix that. Not with points and streaks, but with adaptive grammar
          lessons, immediate feedback, and a design that respects your attention.
        </p>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">
          We believe good teaching is honest: it tells you what you got wrong, shows you the right
          answer, and gives you a chance to try again. That&apos;s it.
        </p>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
          Frenchly is free to use. No account needed to explore. When you&apos;re ready to save your
          progress, create an account and your lessons follow you.
        </p>
        <a href="/" className="text-primary hover:underline font-label text-sm">
          Back to home
        </a>
      </article>
    </main>
  );
}
