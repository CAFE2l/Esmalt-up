import Link from "next/link";

function NailPolishIllustration() {
  return (
    <svg
      viewBox="0 0 200 280"
      role="img"
      aria-label="Esmalte Esmalt'up"
      className="w-60 drop-shadow-[0_30px_50px_rgba(232,68,122,0.35)] sm:w-72"
    >
      <defs>
        <linearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f28fb0" />
          <stop offset="100%" stopColor="#c92f64" />
        </linearGradient>
        <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f47ba1" />
          <stop offset="55%" stopColor="#e8447a" />
          <stop offset="100%" stopColor="#b21e56" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="252" rx="66" ry="10" fill="#b21e56" opacity="0.12" />
      <ellipse cx="100" cy="250" rx="44" ry="7" fill="#e8447a" opacity="0.2" />

      <rect x="66" y="12" width="68" height="46" rx="18" fill="url(#capGradient)" />
      <rect x="75" y="19" width="18" height="32" rx="9" fill="#ffffff" opacity="0.28" />

      <rect x="80" y="52" width="40" height="18" rx="6" fill="#f6b9cf" />

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

      <ellipse
        cx="78"
        cy="156"
        rx="13"
        ry="40"
        fill="#ffffff"
        opacity="0.3"
        transform="rotate(-15 78 156)"
      />

      <rect x="52" y="196" width="96" height="26" rx="13" fill="#ffffff" opacity="0.85" />
      <text
        x="100"
        y="214.5"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="#b21e56"
      >
        Esmalt&apos;up
      </text>

      <path d="M16 40l2.4 7.6L26 50l-7.6 2.4L16 60l-2.4-7.6L6 50l7.6-2.4z" fill="#e8447a" opacity="0.8" />
      <path d="M180 92l1.8 5.7L188 100l-6.2 2.3L180 108l-1.8-5.7L172 100l6.2-2.3z" fill="#f47ba1" opacity="0.9" />
      <circle cx="150" cy="44" r="3.4" fill="#f6b9cf" />
    </svg>
  );
}

export default function Home() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blush-200/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-primary-light/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blush-100 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-blush-50 px-4 py-1.5 text-sm font-medium text-primary-dark">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
            </svg>
            Esmaltes e Cuidados para Unhas
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-primary-light to-primary-dark bg-clip-text text-transparent">
              Esmalt&apos;up
            </span>
          </h1>

          <p className="mt-6 mx-auto max-w-xl text-lg leading-relaxed text-foreground/75 lg:mx-0">
            Kits de manicure completos, peças avulsas e um curso preparatório
            para você criar a sua própria assistência de manicure — com tudo o
            que precisa para brilhar.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              href="/kits"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
            >
              Explorar Kits
            </Link>
            <Link
              href="/curso"
              className="rounded-full border-2 border-blush-300 px-8 py-3.5 font-semibold text-foreground transition-colors hover:border-primary hover:bg-blush-50 hover:text-primary"
            >
              Conhecer o Curso
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-foreground/60 lg:justify-start">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Kits completos
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Peças avulsas
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Curso preparatório
            </span>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <NailPolishIllustration />
        </div>
      </div>
    </section>
  );
}