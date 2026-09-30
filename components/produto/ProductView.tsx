"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryLabel, getInstallments, type Product } from "@/lib/products";
import ProductGallery from "./ProductGallery";
import ProductBuyBox from "./ProductBuyBox";
import Stars from "./Stars";
import { cn } from "@/lib/cn";

interface ProductViewProps {
  product: Product;
  initialAverage: number | null;
  initialCount: number;
}

export default function ProductView({
  product,
  initialAverage,
  initialCount,
}: ProductViewProps) {
  const router = useRouter();

  const handleBuyNow = () => {
    router.push("/checkout");
  };

  const categoryLabel = getCategoryLabel(product.category);
  const outOfStock = product.stock <= 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-foreground/60">
        <a href="/" className="hover:text-rose-gold">
          Início
        </a>
        <span aria-hidden>/</span>
        <a href={product.kind === "kit" ? "/kits" : "/pecas-avulsas"} className="hover:text-rose-gold">
          {product.kind === "kit" ? "Kits" : "Peças Avulsas"}
        </a>
        <span aria-hidden>/</span>
        <span className="max-w-[140px] truncate text-foreground/80">
          {categoryLabel}
        </span>
        <span aria-hidden>/</span>
        <span className="max-w-[140px] truncate text-foreground/80">
          {product.name}
        </span>
      </nav>

      {/* Main content - 3 column layout on desktop */}
      <div className="grid gap-8 lg:grid-cols-[45%_30%_25%] lg:gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-1">
          <ProductGallery
            images={product.images}
            videoUrl={product.videoUrl}
            productName={product.name}
            outOfStock={outOfStock}
          />
        </div>

        {/* Center: Product Info */}
        <div className="space-y-6">
          {/* Category and badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold">
              {categoryLabel}
            </span>
            {product.level && (
              <span className="rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                {product.level === "iniciante" ? "Iniciante" : product.level === "medio" ? "Médio" : "Profissional"}
              </span>
            )}
            {product.brand && (
              <span className="rounded-full bg-cinza-suave/20 px-3 py-1 text-xs font-medium text-foreground/70">
                {product.brand}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          {initialAverage ? (
            <div className="flex items-center gap-2">
              <Stars rating={initialAverage} />
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("avaliacoes")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-sm text-foreground/60 underline-offset-2 hover:text-rose-gold hover:underline"
              >
                {initialAverage.toFixed(1)} · {initialCount}{" "}
                {initialCount === 1 ? "avaliação" : "avaliações"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-foreground/50">
              Seja o primeiro a avaliar este produto.
            </p>
          )}

          {/* Description */}
          <p className="text-sm leading-relaxed text-foreground/75 sm:text-base">
            {product.description}
          </p>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Por que você vai amar</h3>
              <ul className="space-y-2">
                {product.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/70">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 text-rose-gold">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kit contents for kits */}
          {product.kind === "kit" && product.specs && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">O que vem no kit</h3>
              <div className="rounded-2xl border border-cinza-suave/30 bg-rosa-claro/30 p-4">
                <ul className="space-y-1 text-sm text-foreground/70">
                  {product.specs.map((spec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-gold" />
                      {spec.label}: {spec.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Specs table */}
          {product.specs && product.specs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Especificações</h3>
              <div className="rounded-2xl border border-cinza-suave/30 bg-branco p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {product.specs.map((spec, index) => (
                      <tr
                        key={index}
                        className={cn(
                          "border-b border-cinza-suave/20 last:border-0",
                          index % 2 === 0 && "bg-rosa-claro/30"
                        )}
                      >
                        <td className="py-2 pl-2 pr-3 font-medium text-foreground/70">
                          {spec.label}
                        </td>
                        <td className="py-2 pl-3 pr-2">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Buy Box (sticky on desktop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-cinza-suave/40 bg-branco p-6 shadow-card">
            <ProductBuyBox product={product} onBuyNow={handleBuyNow} />
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cinza-suave/40 bg-branco p-4 shadow-header lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-foreground/60">Total</p>
            <p className="text-lg font-bold text-rose-gold">{/* Dynamic total */}</p>
          </div>
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-bold text-white shadow-lg"
          >
            Comprar agora
          </button>
        </div>
      </div>
    </section>
  );
}
