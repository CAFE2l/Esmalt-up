import Link from "next/link";
import { outlineButton } from "./buttonStyles";

export default function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden bg-rosa-claro">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-rosa-medio/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 right-0 h-72 w-72 rounded-full bg-rose-gold/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold/30 bg-branco px-4 py-1.5 text-sm font-medium text-rose-gold shadow-card">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
          </svg>
          Em construção
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg text-foreground/75">{description}</p>
        <Link
          href="/"
          className={`${outlineButton} mt-8 px-7 py-3 text-sm`}
        >
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}