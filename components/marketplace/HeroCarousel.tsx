"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CATEGORY_LABELS,
  formatPrice,
  type Product,
} from "@/lib/catalogData";
import ProductArt from "./ProductArt";

const AUTOPLAY_MS = 5500;

type Slot = "prev" | "current" | "next" | "hidden";

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

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
      {dir === "prev" ? (
        <path d="M15 5l-7 7 7 7" />
      ) : (
        <path d="M9 5l7 7-7 7" />
      )}
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
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragging = useRef(false);
  const length = products.length;

  const go = useCallback(
    (delta: number) => {
      if (length < 2) return;
      setIndex((current) => wrap(current + delta, length));
    },
    [length],
  );

  useEffect(() => {
    if (reduceMotion || paused || length < 2) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, length, index, go]);

  if (length === 0) return null;

  const current = products[index];
  const transition = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 260, damping: 28 };

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
          filter: "blur(1px)",
          pointerEvents: "auto" as const,
        },
        current: {
          x: "0%",
          scale: 1,
          rotateY: 0,
          opacity: 1,
          zIndex: 4,
          filter: "blur(0px)",
          pointerEvents: "auto" as const,
        },
        next: {
          x: "38%",
          scale: 0.72,
          rotateY: -32,
          opacity: 0.5,
          zIndex: 1,
          filter: "blur(1px)",
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label={title}
      className="relative overflow-hidden bg-bege"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
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
            {current.name}, {formatPrice(current.priceCents)}
          </p>

          <motion.div
            className="relative mx-auto h-[28rem] max-w-4xl cursor-grab active:cursor-grabbing sm:h-[30rem]"
            drag={length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragStart={() => {
              dragging.current = true;
              setPaused(true);
            }}
            onDragEnd={(_, info) => {
              dragging.current = false;
              setPaused(false);
              if (info.offset.x < -72 || info.velocity.x < -480) go(1);
              else if (info.offset.x > 72 || info.velocity.x > 480) go(-1);
            }}
          >
            {products.map((product, productIndex) => {
              const slot = slotFor(productIndex, index, length);
              const isCurrent = slot === "current";
              return (
                <motion.article
                  key={product.id}
                  initial={false}
                  animate={variants[slot]}
                  transition={transition}
                  style={{ transformStyle: "preserve-3d", position: "absolute", inset: 0 }}
                  className="flex items-center justify-center px-2 sm:px-10"
                  onClick={() => {
                    if (dragging.current || isCurrent) return;
                    setIndex(productIndex);
                  }}
                >
                  <div
                    className={`relative flex h-[24rem] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-rose-gold/25 bg-branco shadow-card-lg sm:h-[26rem] sm:flex-row ${
                      isCurrent ? "" : "pointer-events-none sm:pointer-events-auto"
                    }`}
                  >
                    <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20 sm:h-auto sm:w-[46%]">
                      <ProductArt product={product} className="h-40 w-40 sm:h-52 sm:w-52" />
                      {isCurrent && !reduceMotion && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-140%", skewX: -18 }}
                          animate={{ x: "340%" }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            repeatDelay: 2.8,
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
                      <p className="mt-4 text-2xl font-semibold text-rose-gold">
                        {formatPrice(product.priceCents)}
                      </p>
                      {isCurrent && (
                        <a
                          href={catalogHref}
                          className="mt-4 w-fit text-sm font-semibold text-rosa-blush transition-colors hover:text-rose-gold"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ver no catálogo
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
                className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card backdrop-blur-sm transition-transform hover:-translate-y-[calc(50%+2px)] hover:bg-rosa-blush hover:text-white sm:inline-flex"
              >
                <Arrow dir="prev" />
              </button>
              <button
                type="button"
                aria-label="Próximo"
                onClick={() => go(1)}
                className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card backdrop-blur-sm transition-transform hover:-translate-y-[calc(50%+2px)] hover:bg-rosa-blush hover:text-white sm:inline-flex"
              >
                <Arrow dir="next" />
              </button>
            </>
          )}

          {length > 1 && (
            <div className="mt-2 flex items-center justify-center gap-2">
              {products.map((product, productIndex) => {
                const active = productIndex === index;
                return (
                  <button
                    key={product.id}
                    type="button"
                    aria-label={`Ir para ${product.name}`}
                    aria-current={active ? "true" : undefined}
                    onClick={() => setIndex(productIndex)}
                    className={`h-2.5 rounded-full transition-all ${
                      active
                        ? "w-8 bg-gradient-to-r from-rosa-blush to-rose-gold"
                        : "w-2.5 bg-cinza-suave hover:bg-rosa-medio"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
