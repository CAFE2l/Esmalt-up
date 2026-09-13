"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalogData";
import { useCart } from "@/lib/CartContext";
import Stars from "./Stars";
import { cn } from "@/lib/cn";

export default function RelatedProducts({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Quem viu, também viu
        </h2>
        <span className="text-sm text-foreground/60">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const outOfStock = product.stockStatus === "out_of_stock";
          return (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-cinza-suave/40 bg-branco shadow-card transition-shadow hover:shadow-card-lg"
            >
              <Link
                href={`/produto/${product.id}`}
                className="relative aspect-square overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-[0.7] saturate-150"
                  style={{ backgroundImage: `url("${product.imageUrl}")` }}
                />
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="relative object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {outOfStock && (
                  <span className="absolute right-3 top-3 rounded-full bg-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 backdrop-blur-sm">
                    Esgotado
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                <Link
                  href={`/produto/${product.id}`}
                  className="line-clamp-2 text-sm font-semibold text-foreground hover:text-rose-gold"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-lg font-semibold text-rose-gold">
                  {formatPrice(product.priceCents)}
                </p>
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addItem(product.id)}
                  className={cn(
                    "mt-3 rounded-full border border-rose-gold/40 py-2 text-xs font-semibold transition-colors",
                    outOfStock
                      ? "opacity-40"
                      : "text-rose-gold hover:bg-rosa-blush hover:text-white",
                  )}
                >
                  {outOfStock ? "Indisponível" : "Adicionar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ProductRating({ rating, count }: { rating: number | null; count: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Stars rating={rating} size={14} />
      <span className="text-xs text-foreground/60">
        {rating.toFixed(1)} ({count ?? 0})
      </span>
    </div>
  );
}