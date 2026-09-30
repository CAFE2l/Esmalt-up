"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SHOWCASE_TABS,
  productsForTab,
  countByTab,
  formatBRL,
  type ShowcaseTabId,
  type _ShowcaseProduct,
} from "./data";
import ShowcaseTabs from "./ShowcaseTabs";
import ShowcaseThumb from "./ShowcaseThumb";
import ProductPhoto from "./ProductPhoto";
import AnimatedPrice from "./AnimatedPrice";
import { trackEvent, type ShowcaseInteractAction } from "./analytics";
import { focusRing, AUTOPLAY_MS, productSpring } from "./chrome";
import { useTilt, useMediaQuery } from "./useTilt";

const DEFAULT_TAB: ShowcaseTabId = "pecas";

interface ProductShowcaseProps {
  initialTab?: ShowcaseTabId;
  onToggleFavorite?: (productId: string, isFavorite: boolean) => void;
  initialFavorites?: Set<string>;
}

export default function ProductShowcase({
  initialTab = DEFAULT_TAB,
  onToggleFavorite,
  initialFavorites = new Set(),
}: ProductShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sectionRef = useRef<HTMLElement>(null);
  const dragging = useRef(false);

  const [activeTab, setActiveTab] = useState<ShowcaseTabId>(initialTab);
  const [activeIndex, setActiveIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(initialFavorites);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userAutoplay, setUserAutoplay] = useState(true);
  const [inView, setInView] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const products = productsForTab(activeTab);
  const counts = countByTab();
  const currentProduct = products[activeIndex];

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("esmaltup-favorites");
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
    setLoaded(true);
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("esmaltup-favorites", JSON.stringify([...favorites]));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [favorites, loaded]);

  // Track view_item_list event when tab changes
  useEffect(() => {
    if (products.length > 0) {
      trackEvent("view_item_list", {
        item_list_name: activeTab,
        items: products.slice(0, 4).map((p, i) => ({
          item_id: p.id,
          item_name: p.name,
          index: i,
          price: p.price,
        })),
      });
    }
  }, [activeTab, products]);

  // Intersection observer for autoplay pause when hidden
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

  // Autoplay logic
  const autoplayOn = userAutoplay && !hoverPaused && inView && !reduceMotion && products.length > 1 && isPlaying;

  useEffect(() => {
    if (!autoplayOn) return;
    const id = window.setTimeout(() => {
      go(1);
      trackEvent("carousel_interact", { action: "autoplay_stop", index: activeIndex });
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplayOn, activeIndex, products.length, go]);

  // Reset to first item when tab changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeTab]);

  const go = useCallback(
    (delta: number) => {
      if (products.length < 2) return;
      setActiveIndex((current) => {
        const newIndex = (current + delta + products.length) % products.length;
        const action: ShowcaseInteractAction = delta > 0 ? "next" : "prev";
        trackEvent("carousel_interact", { action, index: newIndex });
        return newIndex;
      });
    },
    [products.length],
  );

  const handleTabChange = useCallback(
    (tabId: ShowcaseTabId) => {
      setActiveTab(tabId);
      trackEvent("carousel_interact", { action: "tab", index: 0 });
    },
    [],
  );

  const handleThumbClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setUserAutoplay(false);
      setIsPlaying(false);
      trackEvent("select_item", {
        item_id: products[index].id,
        item_name: products[index].name,
        index,
      });
      trackEvent("carousel_interact", { action: "thumb", index });
    },
    [products],
  );

  const handleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        const isFavorite = next.has(productId);
        if (isFavorite) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        onToggleFavorite?.(productId, !isFavorite);
        trackEvent("add_to_wishlist", {
          item_id: productId,
          item_name: products.find((p) => p.id === productId)?.name,
        });
        return next;
      });
    },
    [onToggleFavorite, products],
  );

  const handleCTAClick = useCallback(() => {
    setUserAutoplay(false);
    setIsPlaying(false);
    trackEvent("cta_click", {
      item_id: currentProduct?.id,
      item_name: currentProduct?.name,
      destination: `/produtos/${currentProduct?.slug}`,
    });
  }, [currentProduct]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x < -50 || info.velocity.x < -400) {
        go(1);
      } else if (info.offset.x > 50 || info.velocity.x > 400) {
        go(-1);
      }
    },
    [go],
  );

  const tilt = useTilt(isDesktop && !reduceMotion);

  // Empty state
  if (products.length === 0) {
    return (
      <section ref={sectionRef} className="py-12">
        <ShowcaseTabs
          tabs={SHOWCASE_TABS}
          activeId={activeTab}
          counts={counts}
          onChange={handleTabChange}
        />
        <div className="mt-8 flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <p className="text-white/60">Nenhum produto nesta categoria</p>
        </div>
      </section>
    );
  }

  // Skeleton loading state
  if (!loaded) {
    return (
      <section ref={sectionRef} className="py-12">
        <div className="h-12 w-64 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 min-h-[500px] animate-pulse rounded-3xl bg-white/5" />
      </section>
    );
  }

  const nextThumbs = products
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
        className="relative overflow-hidden py-12"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        onFocusCapture={() => setHoverPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setHoverPaused(false);
          }
        }}
      >
        {/* Category tabs */}
        <div className="mb-8 flex justify-center">
          <ShowcaseTabs
            tabs={SHOWCASE_TABS}
            activeId={activeTab}
            counts={counts}
            onChange={handleTabChange}
          />
        </div>

        {/* Ambient background orbs */}
        {!reduceMotion && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
              style={{ background: currentProduct?.tint }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
              style={{ background: currentProduct?.tintSoft }}
            />
          </>
        )}

        {/* Main stage */}
        <div
          className={cn(
            "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
            "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_rgba(0,0,0,0.35)]",
          )}
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${currentProduct?.tintSoft} 15%, #1c1519), #1c1519)`,
          }}
        >
          <AnimatePresence mode="wait">
            {currentProduct && (
              <m.div
                key={`${activeTab}-${activeIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={productSpring}
                className="relative min-h-[500px] lg:min-h-[560px]"
              >
                {/* Desktop layout */}
                <div className="hidden lg:grid lg:grid-cols-[40%_35%_25%] lg:gap-8 lg:p-8">
                  {/* Left: Content */}
                  <div className="flex flex-col justify-center space-y-6">
                    <m.span
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium"
                      style={{ color: currentProduct.tint }}
                    >
                      {currentProduct.category}
                    </m.span>

                    <m.h2
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                    >
                      {currentProduct.name}
                    </m.h2>

                    <m.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm leading-relaxed text-white/70 sm:text-base"
                    >
                      {currentProduct.description}
                    </m.p>

                    <m.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-baseline gap-2"
                    >
                      <AnimatedPrice
                        value={currentProduct.price}
                        className="text-4xl font-semibold tabular-nums"
                        style={{ color: currentProduct.tint }}
                      />
                    </m.div>

                    <m.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-3"
                    >
                      <Link
                        href={`/produtos/${currentProduct.slug}`}
                        onClick={handleCTAClick}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#1c1519]",
                          "transition-transform duration-200 hover:scale-103 active:scale-97",
                          focusRing,
                        )}
                        style={{
                          background: currentProduct.tint,
                          boxShadow: `0 0 24px color-mix(in srgb, ${currentProduct.tint} 35%, transparent)`,
                        }}
                      >
                        Ver detalhes
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleFavorite(currentProduct.id)}
                        aria-label={favorites.has(currentProduct.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        className={cn(
                          "inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10",
                          "transition-transform duration-200 hover:scale-103 active:scale-97",
                          focusRing,
                          favorites.has(currentProduct.id) && "text-[#e8a0b4]",
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-transform duration-200",
                            favorites.has(currentProduct.id) && "fill-current scale-110",
                          )}
                        />
                      </button>
                    </m.div>

                    {/* EDITABLE: Static example text - replace with real shipping info */}
                    <m.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="text-xs text-white/40"
                    >
                      Frete grátis acima de R$ 199
                    </m.p>
                  </div>

                  {/* Center: Hero product */}
                  <div className="relative flex items-center justify-center">
                    {/* Colored radial glow */}
                    {!reduceMotion && (
                      <div
                        aria-hidden
                        className="absolute inset-0 rounded-full opacity-30 blur-3xl"
                        style={{ background: currentProduct.tint }}
                      />
                    )}

                    {/* Navigation arrows */}
                    {products.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Anterior"
                          onClick={() => go(-1)}
                          className={cn(
                            "absolute left-0 top-1/2 z-10 -translate-y-1/2",
                            "h-12 w-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md",
                            "flex items-center justify-center text-white/80",
                            "transition-all duration-200 hover:scale-110 hover:bg-white/20",
                            focusRing,
                          )}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Próximo"
                          onClick={() => go(1)}
                          className={cn(
                            "absolute right-0 top-1/2 z-10 -translate-y-1/2",
                            "h-12 w-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md",
                            "flex items-center justify-center text-white/80",
                            "transition-all duration-200 hover:scale-110 hover:bg-white/20",
                            focusRing,
                          )}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Product with float animation */}
                    <m.div
                      animate={!reduceMotion ? { y: [0, -8, 0] } : {}}
                      transition={!reduceMotion ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : {}}
                      onPointerMove={tilt.onPointerMove}
                      onPointerLeave={tilt.onPointerLeave}
                      style={{
                        rotateX: tilt.rotateX,
                        rotateY: tilt.rotateY,
                        transformStyle: "preserve-3d",
                      }}
                      className="relative w-full max-w-sm"
                    >
                      {/* Ground shadow (scales opposite to float) */}
                      {!reduceMotion && (
                        <m.div
                          animate={{ scale: [1, 0.85, 1], opacity: [0.4, 0.25, 0.4] }}
                          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute -bottom-8 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-full bg-black/40 blur-xl"
                        />
                      )}

                      <ProductPhoto product={currentProduct} sizes="384px" priority={activeIndex === 0} />
                    </m.div>
                  </div>

                  {/* Right: Thumbnail rail */}
                  <div className="flex flex-col justify-center space-y-4">
                    <ul className="space-y-3">
                      {nextThumbs.map((thumb, i) => (
                        <ShowcaseThumb
                          key={thumb.id}
                          product={thumb}
                          featured={i === 0}
                          onSelect={() => {
                            const thumbIndex = products.findIndex((p) => p.id === thumb.id);
                            if (thumbIndex !== -1) handleThumbClick(thumbIndex);
                          }}
                        />
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="lg:hidden p-6 space-y-6">
                  {/* Mobile: Product image with overlay arrows */}
                  <div className="relative aspect-square max-w-sm mx-auto">
                    {products.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Anterior"
                          onClick={() => go(-1)}
                          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 focus-ring"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Próximo"
                          onClick={() => go(1)}
                          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 focus-ring"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <m.div
                      drag={products.length > 1 ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragStart={() => {
                        dragging.current = true;
                        setHoverPaused(true);
                      }}
                      onDragEnd={(e, info) => {
                        dragging.current = false;
                        setHoverPaused(false);
                        handleDragEnd(e, info);
                      }}
                      className="relative h-full"
                    >
                      <ProductPhoto product={currentProduct} sizes="384px" priority={activeIndex === 0} />
                    </m.div>
                  </div>

                  {/* Mobile: Content */}
                  <div className="space-y-4">
                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium" style={{ color: currentProduct.tint }}>
                      {currentProduct.category}
                    </span>
                    <h2 className="text-2xl font-bold text-white">{currentProduct.name}</h2>
                    <p className="text-sm text-white/70">{currentProduct.description}</p>
                    <AnimatedPrice value={currentProduct.price} className="text-3xl font-semibold tabular-nums" style={{ color: currentProduct.tint }} />
                    
                    <div className="flex gap-3">
                      <Link
                        href={`/produtos/${currentProduct.slug}`}
                        onClick={handleCTAClick}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#1c1519] focus-ring"
                        style={{ background: currentProduct.tint }}
                      >
                        Ver detalhes
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleFavorite(currentProduct.id)}
                        aria-label={favorites.has(currentProduct.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        className={cn(
                          "h-12 w-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center focus-ring",
                          favorites.has(currentProduct.id) && "text-[#e8a0b4]",
                        )}
                      >
                        <Heart className={cn("h-5 w-5", favorites.has(currentProduct.id) && "fill-current")} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile: Horizontal thumbnail scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-6 px-6">
                    {products.map((thumb, i) => (
                      <button
                        key={thumb.id}
                        type="button"
                        onClick={() => handleThumbClick(i)}
                        className={cn(
                          "relative shrink-0 snap-center rounded-2xl p-1 text-left",
                          i === activeIndex && "ring-2 ring-white/30",
                        )}
                        style={{
                          background: `linear-gradient(180deg, color-mix(in srgb, ${thumb.tint} 28%, #241c20), #1c1519 78%)`,
                        }}
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                          <ProductPhoto product={thumb} sizes="80px" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom: Progress dots and play/pause */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 lg:bottom-6">
                  <div className="flex items-center gap-2">
                    {products.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleThumbClick(i)}
                        aria-label={`Ir para produto ${i + 1}`}
                        className={cn(
                          "relative h-2 rounded-full transition-all duration-300",
                          i === activeIndex ? "w-8" : "w-2",
                        )}
                      >
                        <m.span
                          layoutId="active-dot"
                          className="absolute inset-0 rounded-full"
                          style={{ background: currentProduct.tint }}
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        />
                        {i === activeIndex && autoplayOn && (
                          <m.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                            className="absolute inset-0 origin-left rounded-full bg-white/50"
                            style={{ transformOrigin: "left" }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {products.length > 1 && !reduceMotion && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(!isPlaying);
                        setUserAutoplay(!isPlaying);
                      }}
                      aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                      className="h-8 w-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/60 hover:text-white focus-ring transition-colors"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Live region for screen readers */}
          <p className="sr-only" aria-live="polite">
            {currentProduct
              ? `${currentProduct.name}, ${formatBRL(currentProduct.price)}`
              : "Carregando..."}
          </p>
        </div>
      </section>
    </LazyMotion>
  );
}
