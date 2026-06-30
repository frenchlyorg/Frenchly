export const metadata = {
  title: "Contact — Frenchly",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <article className="max-w-[720px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-on-surface mb-8">
          Contact
        </h1>
        <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
          Have a question or feedback? We&apos;d love to hear from you.
        </p>
        <a
          href="mailto:frenchlyorg@gmail.com"
          className="inline-block px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
        >
          frenchlyorg@gmail.com
        </a>
      </article>
    </main>
  );
}
