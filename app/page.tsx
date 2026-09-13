import Image from "next/image";
import Link from "next/link";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

function NailPolishIllustration() {
  return (
    <div className="relative w-60 sm:w-72">
      <svg viewBox="0 0 200 290" aria-hidden className="h-auto w-full">
        <defs>
          <radialGradient id="groundShadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#C98991" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#E599A8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F3B6C7" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <ellipse
          cx="100"
          cy="262"
          rx="80"
          ry="14"
          fill="url(#groundShadow)"
          filter="url(#softGlow)"
        />
        <ellipse cx="100" cy="260" rx="46" ry="8" fill="#C98991" opacity="0.35" />
        <ellipse cx="100" cy="259" rx="24" ry="5" fill="#8A5A63" opacity="0.4" />

        <circle cx="150" cy="44" r="3.4" fill="#F3B6C7" />
      </svg>

      <div className="absolute inset-x-0 bottom-[13%] flex justify-center">
        <Image
          src="/designs/icons/sem_background.png"
          alt="Esmalte Esmalt'up"
          width={524}
          height={476}
          sizes="(min-width: 640px) 230px, 192px"
          priority
          className="h-auto w-[80%] object-contain"
        />
      </div>
    </div>
  );
}

const highlights = [
  {
    href: "/kits",
    title: "Kits de Manicure",
    description:
      "Combinações completas com tudo o que você precisa para um cuidado impecável das unhas.",
    link: "Explorar kits",
  },
  {
    href: "/pecas-avulsas",
    title: "Peças Avulsas",
    description:
      "Produtos separados para montar ou completar o seu kit exatamente do seu jeito.",
    link: "Ver peças avulsas",
  },
  {
    href: "/curso",
    title: "Curso Preparatório",
    description:
      "O caminho para montar a sua própria assistência de manicure, do zero ao primeiro cliente.",
    link: "Conhecer o curso",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-bege">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-rosa-medio/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold/30 bg-branco px-4 py-1.5 text-sm font-medium text-rose-gold shadow-card">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
              </svg>
              Esmaltes e Cuidados para Unhas
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-glow bg-gradient-to-r from-rosa-blush via-rosa-medio to-rose-gold bg-clip-text text-transparent">
                Esmalt&apos;up
              </span>
            </h1>

            <p className="mt-6 mx-auto max-w-xl text-lg leading-relaxed text-foreground/85 lg:mx-0">
              Kits de manicure completos, peças avulsas e um curso preparatório
              para você criar a sua própria assistência de manicure — com tudo o
              que precisa para brilhar.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link href="/kits" className={`${primaryButton} px-8 py-3.5 text-base`}>
                Explorar Kits
              </Link>
              <Link href="/curso" className={`${outlineButton} px-8 py-3.5 text-base`}>
                Conhecer o Curso
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-foreground/70 lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-gold" />
                Kits completos
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-gold" />
                Peças avulsas
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-gold" />
                Curso preparatório
              </span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <NailPolishIllustration />
          </div>
        </div>
      </section>

      <section className="bg-rosa-claro">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
              O que você encontra
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo para brilhar de ponta a ponta
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-start gap-4 rounded-3xl border border-cinza-suave/70 bg-branco p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg active:translate-y-0 active:shadow-pressed"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rosa-claro text-rose-gold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                    {item.description}
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-rose-gold transition-colors hover:text-rosa-blush">
                  {item.link}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-cinza-suave/70 bg-branco">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-rose-gold">
            Dê o primeiro passo
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Pronta para começar?
          </h2>
          <p className="mt-4 text-lg text-foreground/75">
            Monte o seu kit, escolha as peças avulsas ou aprenda a criar a sua
            própria assistência de manicure.
          </p>
          <Link
            href="/curso"
            className={`${outlineButton} mt-8 px-8 py-3.5 text-base`}
          >
            Conhecer o Curso
          </Link>
        </div>
      </section>
    </>
  );
}