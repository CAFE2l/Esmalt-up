"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CATEGORY_LABELS,
  LEVEL_LABELS,
  formatPrice,
  getByKind,
  type Product,
} from "@/lib/catalogData";
import ProductArt from "./ProductArt";

const AUTOPLAY_MS = 5000;
const SUGGEST_EVERY = 3;

type Slot = "prev" | "current" | "next" | "hidden";

type Suggestion = { product: Product; label: string; href: string };
type Slide =
  | { type: "product"; product: Product }
  | { type: "suggestion"; suggestion: Suggestion };

function wrap(index: number, length: number) {
  return (index + length) % length;
}

function slotFor(index: number, current: number, length: number): Slot {
  if (index === current) return "current";
  if (length < 2) return "hidden";
  const next = wrap(current + 1, length);
  if (length === 2) return index === next ? "next" : "hidden";
  if (index === wrap(current - 1, length)) return "prev";
  if (index === next) return "next";
  return "hidden";
}

function slideKey(slide: Slide) {
  return slide.type === "product"
    ? slide.product.id
    : `sugestao-${slide.suggestion.product.id}`;
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      {dir === "prev" ? (
        <path d="M15 5l-7 7 7 7" />
      ) : (
        <path d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}

function PlayPause({ playing }: { playing: boolean }) {
  if (!playing) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function Close() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function HeroCarousel({
  products,
  title,
  catalogHref,
}: {
  products: Product[];
  title: string;
  catalogHref: string;
}) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const dragging = useRef(false);
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userAutoplay, setUserAutoplay] = useState(true);
  const [inView, setInView] = useState(true);
  const [quickView, setQuickView] = useState<Product | null>(null);

  const slides = useMemo<Slide[]>(() => {
    const kind = products[0]?.kind;
    const others = kind ? getByKind(kind === "peca" ? "kit" : "peca") : [];
    const list: Slide[] = [];
    products.forEach((product, productIndex) => {
      list.push({ type: "product", product });
      if (
        (productIndex + 1) % SUGGEST_EVERY === 0 &&
        others.length > 0 &&
        products.length >= SUGGEST_EVERY + 1
      ) {
        const block = Math.floor(productIndex / SUGGEST_EVERY);
        list.push({
          type: "suggestion",
          suggestion: {
            product: others[block % others.length],
            label: kind === "peca" ? "Combine com" : "Complete com",
            href: kind === "peca" ? "/kits" : "/pecas-avulsas",
          },
        });
      }
    });
    return list;
  }, [products]);

  const length = slides.length;

  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (length < 2) return;
      setIndex((current) => wrap(current + delta, length));
    },
    [length],
  );

  const autoplayOn =
    userAutoplay &&
    !hoverPaused &&
    !quickView &&
    inView &&
    !reduceMotion &&
    length > 1;

  useEffect(() => {
    if (!autoplayOn) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplayOn, index, go]);

  useEffect(() => {
    if (!quickView) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickView(null);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [quickView]);

  if (length === 0) return null;

  const currentSlide = slides[index];
  const transition = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 250, damping: 32, mass: 0.95 };
  const drawerTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 300, damping: 34 };

  const variants = reduceMotion
    ? {
        prev: { x: "-30%", scale: 0.92, opacity: 0.35, zIndex: 1, pointerEvents: "auto" as const },
        current: { x: "0%", scale: 1, opacity: 1, zIndex: 4, pointerEvents: "auto" as const },
        next: { x: "30%", scale: 0.92, opacity: 0.35, zIndex: 1, pointerEvents: "auto" as const },
        hidden: { opacity: 0, zIndex: 0, pointerEvents: "none" as const },
      }
    : {
        prev: {
          x: "-38%",
          scale: 0.72,
          rotateY: 32,
          opacity: 0.5,
          zIndex: 1,
          filter: "blur(1px) brightness(0.9)",
          pointerEvents: "auto" as const,
        },
        current: {
          x: "0%",
          scale: 1,
          rotateY: 0,
          opacity: 1,
          zIndex: 4,
          filter: "blur(0px) brightness(1)",
          pointerEvents: "auto" as const,
        },
        next: {
          x: "38%",
          scale: 0.72,
          rotateY: -32,
          opacity: 0.5,
          zIndex: 1,
          filter: "blur(1px) brightness(0.9)",
          pointerEvents: "auto" as const,
        },
        hidden: {
          x: "0%",
          scale: 0.45,
          opacity: 0,
          zIndex: 0,
          rotateY: 0,
          pointerEvents: "none" as const,
        },
      };

  const relatedProducts = quickView
    ? getByKind(quickView.kind)
        .filter(
          (product) =>
            product.category === quickView.category &&
            product.id !== quickView.id,
        )
        .slice(0, 3)
    : [];

  const effectivelyPlaying = autoplayOn;

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={title}
      className="relative overflow-hidden bg-bege"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setHoverPaused(false);
        }
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-medio/30 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, 16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-rose-gold/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, 24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-rosa-medio/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-gold">
              Esmalt&apos;up
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-rosa-blush via-rosa-medio to-rose-gold bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
          </div>
          <a
            href={catalogHref}
            className="shrink-0 text-sm font-semibold text-rose-gold transition-colors hover:text-rosa-blush"
          >
            Ver todos
          </a>
        </div>

        <div
          className="relative mt-8 pb-12"
          style={{ perspective: reduceMotion ? undefined : 1400 }}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(-1);
            }
          }}
        >
          <p className="sr-only" aria-live="polite">
            {currentSlide.type === "product"
              ? `${currentSlide.product.name}, ${formatPrice(currentSlide.product.priceCents)}`
              : `${currentSlide.suggestion.label} ${currentSlide.suggestion.product.name}`}
          </p>

          <motion.div
            className="relative mx-auto h-[28rem] max-w-4xl cursor-grab active:cursor-grabbing sm:h-[30rem]"
            drag={length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            dragMomentum
            dragTransition={{ power: 0.15, timeConstant: 300 }}
            onDragStart={() => {
              dragging.current = true;
              setHoverPaused(true);
            }}
            onDragEnd={(_, info) => {
              dragging.current = false;
              setHoverPaused(false);
              if (info.offset.x < -72 || info.velocity.x < -480) go(1);
              else if (info.offset.x > 72 || info.velocity.x > 480) go(-1);
            }}
            onTouchStart={() => setHoverPaused(true)}
            onTouchEnd={() => setHoverPaused(false)}
          >
            {slides.map((slide, slideIndex) => {
              const slot = slotFor(slideIndex, index, length);
              const isCurrent = slot === "current";
              if (slot === "hidden") return null;

              const articleProps = {
                key: slideKey(slide),
                initial: false,
                animate: variants[slot],
                transition,
                style: {
                  transformStyle: "preserve-3d" as const,
                  position: "absolute" as const,
                  inset: 0,
                },
                className:
                  "flex items-center justify-center px-2 sm:px-10 pointer-events-none",
                onClick: () => {
                  if (dragging.current || isCurrent) return;
                  setIndex(slideIndex);
                },
              };

              if (slide.type === "product") {
                const product = slide.product;
                return (
                  <motion.article {...articleProps} key={slideKey(slide)}>
                    <div
                      className={`relative flex h-[24rem] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-rose-gold/25 bg-branco shadow-card-lg sm:h-[26rem] sm:flex-row ${
                        isCurrent
                          ? "pointer-events-auto"
                          : "pointer-events-none transition-transform duration-300 hover:scale-[1.03] hover:brightness-105 sm:pointer-events-auto"
                      }`}
                    >
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20 sm:h-auto sm:w-[46%]">
                        <ProductArt product={product} className="absolute inset-0 h-full w-full" />
                        {isCurrent && !reduceMotion && (
                          <motion.span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            initial={{ x: "-140%", skewX: -18 }}
                            animate={{ x: "340%" }}
                            transition={{
                              duration: 2.6,
                              repeat: Infinity,
                              repeatDelay: 3.2,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-center px-6 py-5 sm:px-8">
                        <span className="w-fit rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold">
                          {CATEGORY_LABELS[product.category] ?? product.category}
                        </span>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                          {product.name}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">
                          {product.description}
                        </p>
                        <motion.p
                          className="mt-4 text-2xl font-semibold text-rose-gold"
                          animate={
                            isCurrent && !reduceMotion
                              ? {
                                  textShadow: [
                                    "0 0 0px rgba(229,153,168,0)",
                                    "0 0 14px rgba(229,153,168,0.5)",
                                    "0 0 0px rgba(229,153,168,0)",
                                  ],
                                  scale: [1, 1.02, 1],
                                }
                              : { textShadow: "0 0 0px rgba(229,153,168,0)", scale: 1 }
                          }
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {formatPrice(product.priceCents)}
                        </motion.p>
                        {isCurrent && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setQuickView(product);
                            }}
                            className="mt-4 w-fit rounded text-sm font-semibold text-rosa-blush transition-colors hover:text-rose-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
                          >
                            Ver no catálogo
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              }

              const suggestion = slide.suggestion;
              return (
                <motion.article {...articleProps} key={slideKey(slide)}>
                  <div
                    className={`relative flex h-[24rem] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border-2 border-dashed border-rose-gold/40 bg-gradient-to-br from-rosa-claro/70 via-branco to-rosa-blush/20 shadow-card-lg sm:h-[26rem] sm:flex-row ${
                      isCurrent
                        ? "pointer-events-auto"
                        : "pointer-events-none transition-transform duration-300 hover:scale-[1.03] hover:brightness-105 sm:pointer-events-auto"
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-branco/60 sm:h-auto sm:w-[46%]">
                      <ProductArt
                        product={suggestion.product}
                        className="absolute inset-0 h-full w-full"
                      />
                      {isCurrent && !reduceMotion && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-140%", skewX: -18 }}
                          animate={{ x: "340%" }}
                          transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            repeatDelay: 3.2,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center px-6 py-5 sm:px-8">
                      <span className="w-fit rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                        {suggestion.label}
                      </span>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                        {suggestion.product.name}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">
                        {suggestion.product.description}
                      </p>
                      <p className="mt-4 text-2xl font-semibold text-rose-gold">
                        {formatPrice(suggestion.product.priceCents)}
                      </p>
                      {isCurrent && (
                        <a
                          href={suggestion.href}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-4 w-fit rounded text-sm font-semibold text-rosa-blush transition-colors hover:text-rose-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
                        >
                          Ver {suggestion.product.kind === "kit" ? "kit" : "peça"} →
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => go(-1)}
                className="absolute left-8 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2 sm:inline-flex"
              >
                <Arrow dir="prev" />
              </button>
              <button
                type="button"
                aria-label="Próximo"
                onClick={() => go(1)}
                className="absolute right-8 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2 sm:inline-flex"
              >
                <Arrow dir="next" />
              </button>
            </>
          )}

          {length > 1 && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex items-center justify-center gap-2">
                {slides.map((slide, slideIndex) => {
                  const active = slideIndex === index;
                  const label =
                    slide.type === "product"
                      ? `Ir para ${slide.product.name}`
                      : `Sugestão: ${slide.suggestion.product.name}`;
                  return (
                    <button
                      key={slideKey(slide)}
                      type="button"
                      aria-label={label}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setIndex(slideIndex)}
                      className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold ${
                        active
                          ? "w-8 bg-gradient-to-r from-rosa-blush to-rose-gold shadow-card"
                          : "w-2.5 bg-cinza-suave hover:scale-125 hover:bg-rosa-medio"
                      }`}
                    />
                  );
                })}
              </div>
              <button
                type="button"
                aria-label={effectivelyPlaying ? "Pausar apresentação" : "Reproduzir apresentação"}
                onClick={() => setUserAutoplay((value) => !value)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
              >
                <PlayPause playing={effectivelyPlaying} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {quickView && (
          <>
            <motion.div
              key="quickview-backdrop"
              aria-hidden
              className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={drawerTransition}
              onClick={() => setQuickView(null)}
            />
            <motion.aside
              key="quickview-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quickview-title"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-branco shadow-card-lg sm:border-l sm:border-rose-gold/20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={drawerTransition}
            >
              <header className="flex items-center justify-between border-b border-rose-gold/15 px-5 py-4">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-rose-gold">
                  Detalhes
                </span>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setQuickView(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-gold/30 bg-rosa-claro/40 text-rose-gold transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
                >
                  <Close />
                </button>
              </header>

              <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20">
                <ProductArt product={quickView} className="absolute inset-0 h-full w-full" />
                {quickView.stockStatus === "out_of_stock" && (
                  <span className="absolute right-3 top-3 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/70 backdrop-blur-sm">
                    Esgotado
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-fit rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold">
                    {CATEGORY_LABELS[quickView.category] ?? quickView.category}
                  </span>
                  {quickView.level && (
                    <span className="w-fit rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                      {LEVEL_LABELS[quickView.level]}
                    </span>
                  )}
                </div>
                <h2
                  id="quickview-title"
                  className="mt-3 text-2xl font-bold tracking-tight"
                >
                  {quickView.name}
                </h2>
                <p className="mt-4 text-3xl font-semibold text-rose-gold">
                  {formatPrice(quickView.priceCents)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                  {quickView.description}
                </p>

                {relatedProducts.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-foreground/70">
                      {quickView.kind === "kit"
                        ? "Outros kits desta categoria"
                        : "Outras peças desta categoria"}
                    </p>
                    <div className="mt-3 flex gap-3">
                      {relatedProducts.map((related) => (
                        <button
                          key={related.id}
                          type="button"
                          aria-label={`Ver ${related.name}`}
                          onClick={() => setQuickView(related)}
                          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-rose-gold/25 bg-rosa-claro/40 transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
                        >
                          <ProductArt
                            product={related}
                            className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <footer className="border-t border-rose-gold/15 p-5">
                <a
                  href={catalogHref}
                  onClick={() => setQuickView(null)}
                  className="block w-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-semibold text-white shadow-card transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
                >
                  Ver todo o catálogo
                </a>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}