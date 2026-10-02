"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/products";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  kind: "kit" | "peca";
  category: string;
  stock: number;
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  className?: string;
}

export default function ProductCarousel({ products, title, className = "" }: ProductCarouselProps) {
  const { addItem } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollTo = useCallback((index: number) => {
    if (!containerRef.current) return;
    const card = containerRef.current.children[index] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    setActiveIndex(index);
  }, [reducedMotion]);

  const next = useCallback(() => scrollTo((activeIndex + 1) % products.length), [activeIndex, products.length, scrollTo]);
  const prev = useCallback(() => scrollTo((activeIndex - 1 + products.length) % products.length), [activeIndex, products.length, scrollTo]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const cardWidth = containerRef.current.children[0]?.clientWidth ?? 280;
    setActiveIndex(Math.min(Math.round(containerRef.current.scrollLeft / cardWidth), products.length - 1));
  }, [products.length]);

  useEffect(() => {
    if (reducedMotion || products.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, reducedMotion, products.length]);

  if (products.length === 0) return null;

  return (
    <section className={`relative ${className}`} aria-roledescription="carousel" aria-label={title || "Produtos"}>
      {title && <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>}
      <div ref={containerRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} onScroll={handleScroll} tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); next(); } if (e.key === "ArrowLeft") { e.preventDefault(); prev(); } }}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} isActive={i === activeIndex} onAddToCart={() => addItem(product.id)} />
        ))}
      </div>
      {products.length > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-branco/80 text-foreground shadow-md hover:bg-branco">‹</button>
          <button type="button" onClick={next} aria-label="Próximo" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-branco/80 text-foreground shadow-md hover:bg-branco">›</button>
        </>
      )}
      <div className="mt-4 flex items-center justify-center gap-2">
        {products.map((_, i) => (
          <button key={i} type="button" onClick={() => scrollTo(i)} aria-label={`Ir para produto ${i + 1}`} className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-6 bg-rose-gold" : "w-2 bg-cinza-suave/50"}`} />
        ))}
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
  isActive: boolean;
  onAddToCart: () => void;
}

function ProductCard({ product, isActive, onAddToCart }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const handleShare = async () => {
    const url = `${window.location.origin}/produto/${product.slug}`;
    try {
      if (navigator.share) { await navigator.share({ title: product.name, url }); }
      else { await navigator.clipboard.writeText(url); setShareMsg("Link copiado!"); setTimeout(() => setShareMsg(null), 2000); }
    } catch { /* ignore */ }
  };

  return (
    <div role="option" aria-selected={isActive} className={`snap-center shrink-0 rounded-3xl border border-cinza-suave/40 bg-branco p-4 shadow-card transition-all duration-300 ${isActive ? "w-72 sm:w-80 scale-100 opacity-100" : "w-56 sm:w-64 scale-90 opacity-60"}`}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-4" loading="lazy" />
      </div>
      <div className="mt-3">
        <Link href={`/produto/${product.slug}`} className="line-clamp-1 text-sm font-semibold text-foreground hover:text-rose-gold">{product.name}</Link>
        <p className="text-base font-bold text-rose-gold">{formatPrice(product.priceCents)}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => setLiked(!liked)} className={`rounded-full p-2 transition-colors ${liked ? "text-rose-gold" : "text-foreground/50 hover:text-rose-gold"}`} aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </button>
        <button type="button" onClick={handleShare} className="rounded-full p-2 text-foreground/50 transition-colors hover:text-rose-gold" aria-label="Compartilhar">
          <Share2 className="h-5 w-5" />
        </button>
        <button type="button" onClick={onAddToCart} className="ml-auto rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold p-2.5 text-white shadow-card transition-transform hover:scale-105 active:scale-95" aria-label="Adicionar ao carrinho">
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
      {shareMsg && <p className="mt-2 text-center text-xs text-emerald-400">{shareMsg}</p>}
    </div>
  );
}
