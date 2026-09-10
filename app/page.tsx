import Link from "next/link";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

function NailPolishIllustration() {
  return (
    <svg
      viewBox="0 0 200 290"
      role="img"
      aria-label="Esmalte Esmalt'up"
      className="w-60 sm:w-72"
    >
      <defs>
        <linearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3b6c7" />
          <stop offset="100%" stopColor="#c98991" />
        </linearGradient>
        <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fad0e6" />
          <stop offset="45%" stopColor="#f3b6c7" />
          <stop offset="100%" stopColor="#e599a8" />
        </linearGradient>
        <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A5A63" stopOpacity="0" />
          <stop offset="100%" stopColor="#8A5A63" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id="groundShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#C98991" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#E599A8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F3B6C7" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="bottleClip">
          <path
            d="M80 66
               C74 66 69 71 69 78
               C69 90 58 98 44 118
               C26 144 24 186 38 210
               C58 244 142 244 162 210
               C176 186 174 144 156 118
               C142 98 131 90 131 78
               C131 71 126 66 120 66
               Z"
          />
        </clipPath>
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

      <rect x="66" y="12" width="68" height="46" rx="18" fill="url(#capGradient)" />
      <rect x="75" y="19" width="18" height="32" rx="9" fill="#ffffff" opacity="0.3" />

      <rect x="80" y="52" width="40" height="18" rx="6" fill="#f3b6c7" />

      <path
        d="M80 66
           C74 66 69 71 69 78
           C69 90 58 98 44 118
           C26 144 24 186 38 210
           C58 244 142 244 162 210
           C176 186 174 144 156 118
           C142 98 131 90 131 78
           C131 71 126 66 120 66
           Z"
        fill="url(#bodyGradient)"
      />

      <g clipPath="url(#bottleClip)">
        <ellipse
          cx="100"
          cy="214"
          rx="90"
          ry="54"
          fill="url(#bottomShade)"
        />
        <rect x="0" y="212" width="200" height="60" fill="url(#bottomShade)" opacity="0.7" />
        <ellipse
          cx="100"
          cy="72"
          rx="64"
          ry="14"
          fill="#ffffff"
          opacity="0.18"
        />
      </g>

      <ellipse
        cx="76"
        cy="150"
        rx="12"
        ry="40"
        fill="#ffffff"
        opacity="0.35"
        transform="rotate(-15 76 150)"
      />
      <ellipse
        cx="92"
        cy="162"
        rx="5"
        ry="22"
        fill="#ffffff"
        opacity="0.25"
        transform="rotate(-15 92 162)"
      />

      <rect x="52" y="196" width="96" height="26" rx="13" fill="#ffffff" opacity="0.9" />
      <text
        x="100"
        y="214.5"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="#8A5A63"
      >
        Esmalt&apos;up
      </text>

      <path d="M16 40l2.4 7.6L26 50l-7.6 2.4L16 60l-2.4-7.6L6 50l7.6-2.4z" fill="#C98991" />
      <path d="M180 92l1.8 5.7L188 100l-6.2 2.3L180 108l-1.8-5.7L172 100l6.2-2.3z" fill="#E599A8" opacity="0.85" />
      <circle cx="150" cy="44" r="3.4" fill="#F3B6C7" />
    </svg>
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