"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SHOWCASE_TABS,
  countByTab,
  formatBRL,
  productsForTab,
  type ShowcaseTabId,
} from "./data";
import AnimatedPrice from "./AnimatedPrice";
import { trackEvent } from "./analytics";
import { AUTOPLAY_MS, focusRing, productSpring } from "./chrome";
import ProductPhoto from "./ProductPhoto";
import ShowcaseTabs from "./ShowcaseTabs";
import ShowcaseThumb from "./ShowcaseThumb";
import { useMediaQuery, useTilt } from "./useTilt";
import { FavoritesButton } from "@/lib/wishlist";

const DEFAULT_TAB: ShowcaseTabId = "pecas";

interface ProductShowcaseProps {
  initialTab?: ShowcaseTabId;
}

export default function ProductShowcase({
  initialTab = DEFAULT_TAB,
}: ProductShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sectionRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [playing, setPlaying] = useState(true);

  const products = useMemo(() => productsForTab(activeTab), [activeTab]);
  const counts = countByTab();
  const currentProduct = products[activeIndex];
  const tilt = useTilt(isDesktop && !reduceMotion);

  const go = useCallback((delta: number) => {
    if (products.length < 2) return;
    setActiveIndex((current) => {
      const nextIndex = (current + delta + products.length) % products.length;
      trackEvent("carousel_interact", {
        action: delta > 0 ? "next" : "prev",
        index: nextIndex,
      });
      return nextIndex;
    });
  }, [products.length]);

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

  useEffect(() => {
    if (products.length > 0) {
      trackEvent("view_item_list", {
        item_list_name: activeTab,
        items: products.slice(0, 4).map((product, index) => ({
          item_id: product.id,
          item_name: product.name,
          index,
          price: product.price,
        })),
      });
    }
  }, [activeTab, products]);

  const autoplayOn =
    playing && !hoverPaused && inView && !reduceMotion && products.length > 1;

  useEffect(() => {
    if (!autoplayOn) return;
    const timeout = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, autoplayOn, go]);

  const selectTab = useCallback((tabId: ShowcaseTabId) => {
    setActiveTab(tabId);
    setActiveIndex(0);
    trackEvent("carousel_interact", { action: "tab", index: 0 });
  }, []);

  const selectProduct = useCallback((index: number) => {
    const product = products[index];
    if (!product) return;
    setActiveIndex(index);
    setPlaying(false);
    trackEvent("select_item", {
      item_id: product.id,
      item_name: product.name,
      index,
    });
    trackEvent("carousel_interact", { action: "thumb", index });
  }, [products]);

  const handleDragEnd = useCallback((_event: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -50 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 50 || info.velocity.x > 400) go(-1);
  }, [go]);

  const handleCtaClick = useCallback(() => {
    if (!currentProduct) return;
    setPlaying(false);
    trackEvent("cta_click", {
      item_id: currentProduct.id,
      item_name: currentProduct.name,
      destination: `/produto/${currentProduct.slug}`,
    });
  }, [currentProduct]);

  if (!currentProduct) {
    return (
      <section ref={sectionRef} className="py-12">
        <ShowcaseTabs tabs={SHOWCASE_TABS} activeId={activeTab} counts={counts} onChange={selectTab} />
        <div className="mt-8 grid min-h-96 place-items-center rounded-3xl border border-white/10 bg-white/5 text-white/60">
          Nenhum produto nesta categoria
        </div>
      </section>
    );
  }

  const nextProducts = products
    .slice(activeIndex + 1, activeIndex + 4)
    .concat(products.slice(0, Math.max(0, activeIndex + 4 - products.length)))
    .slice(0, 3);

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={sectionRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Produtos em destaque"
        className="relative overflow-hidden py-8 sm:py-12"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        onFocusCapture={() => setHoverPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoverPaused(false);
        }}
      >
        <div className="mb-8 flex justify-center">
          <ShowcaseTabs tabs={SHOWCASE_TABS} activeId={activeTab} counts={counts} onChange={selectTab} />
        </div>

        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 px-5 pb-14 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_rgba(0,0,0,0.35)] sm:px-8 sm:pt-8"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${currentProduct.tintSoft} 25%, #1c1519), #1c1519)`,
          }}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={`${activeTab}-${activeIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={productSpring}
              className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr_0.65fr] lg:gap-8"
            >
              <div className="order-2 flex flex-col justify-center space-y-4 lg:order-1">
                <span
                  className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium"
                  style={{ color: currentProduct.tint }}
                >
                  {currentProduct.category}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {currentProduct.name}
                </h2>
                <p className="text-sm leading-relaxed text-white/70">{currentProduct.description}</p>
                <AnimatedPrice
                  value={currentProduct.price}
                  className="text-3xl font-semibold tabular-nums"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/produto/${currentProduct.slug}`}
                    onClick={handleCtaClick}
                    className={cn("rounded-full px-6 py-3 text-sm font-semibold text-[#1c1519]", focusRing)}
                    style={{ background: currentProduct.tint }}
                  >
                    Ver detalhes
                  </Link>
                  <FavoritesButton
                    product={{
                      id: currentProduct.id,
                      slug: currentProduct.slug,
                      name: currentProduct.name,
                      kind: currentProduct.tab === "kits" ? "kit" : "peca",
                      category: currentProduct.category,
                      priceCents: Math.round(currentProduct.price * 100),
                      imageUrl: currentProduct.image,
                    }}
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  />
                </div>
                <p className="text-xs text-white/40">Frete grátis acima de R$ 199</p>
              </div>

              <div className="order-1 relative flex aspect-square items-center justify-center lg:order-2">
                {products.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Anterior"
                      onClick={() => go(-1)}
                      className={cn("absolute left-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white sm:h-12 sm:w-12", focusRing)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próximo"
                      onClick={() => go(1)}
                      className={cn("absolute right-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white sm:h-12 sm:w-12", focusRing)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <m.div
                  drag={products.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  onPointerMove={tilt.onPointerMove}
                  onPointerLeave={tilt.onPointerLeave}
                  style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
                  className="relative w-full max-w-sm"
                >
                  <ProductPhoto product={currentProduct} sizes="(min-width: 1024px) 384px, 80vw" priority={activeIndex === 0} />
                </m.div>
              </div>

              <ul className="order-3 hidden space-y-3 lg:block">
                {nextProducts.map((product, index) => (
                  <ShowcaseThumb
                    key={product.id}
                    product={product}
                    featured={index === 0}
                    onSelect={() => selectProduct(products.findIndex((item) => item.id === product.id))}
                  />
                ))}
              </ul>
            </m.div>
          </AnimatePresence>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {products.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => selectProduct(index)}
                  aria-label={`Ir para produto ${index + 1}`}
                  aria-current={index === activeIndex}
                  className={cn("h-2 rounded-full transition-all", index === activeIndex ? "w-8" : "w-2")}
                  style={{ background: index === activeIndex ? currentProduct.tint : "rgba(255,255,255,.35)" }}
                />
              ))}
            </div>
            {products.length > 1 && !reduceMotion && (
              <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "Pausar" : "Reproduzir"}
                className={cn("grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-white/70", focusRing)}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {currentProduct.name}, {formatBRL(currentProduct.price)}
        </p>
      </section>
    </LazyMotion>
  );
}
