import Link from "next/link";

export default function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-blush-100 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 right-0 h-72 w-72 rounded-full bg-primary-light/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-blush-50 px-4 py-1.5 text-sm font-medium text-primary-dark">
          Em construção
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg text-foreground/70">{description}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border-2 border-blush-300 px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}