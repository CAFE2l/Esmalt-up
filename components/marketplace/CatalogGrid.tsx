"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  formatPrice,
  LEVEL_LABELS,
  type Product,
  type SkillLevel,
} from "@/lib/catalogData";
import ProductArt from "./ProductArt";

type LevelFilter = "todos" | SkillLevel;

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "todos", label: "Todos os níveis" },
  ...Object.entries(LEVEL_LABELS).map(([value, label]) => ({
    value: value as SkillLevel,
    label,
  })),
];

export default function CatalogGrid({
  products,
  title,
}: {
  products: Product[];
  title: string;
}) {
  const [level, setLevel] = useState<LevelFilter>("todos");
  const hasLevels = products.some((product) => product.level);

  const filtered = useMemo(
    () =>
      level === "todos"
        ? products
        : products.filter((product) => product.level === level),
    [products, level],
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-gold">
            Catálogo
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {hasLevels && (
            <label className="flex items-center gap-2 text-sm text-foreground/60">
              <span className="hidden sm:inline">Nível</span>
              <select
                aria-label="Filtrar por nível de experiência"
                value={level}
                onChange={(event) => setLevel(event.target.value as LevelFilter)}
                className="cursor-pointer rounded-full border border-rose-gold/40 bg-branco px-4 py-2 pr-8 text-sm font-medium text-foreground shadow-card outline-none transition-colors hover:border-rose-gold focus:border-rose-gold"
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="shrink-0 text-sm text-foreground/60">
            {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <article
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-rose-gold/25 bg-branco shadow-card transition-shadow hover:shadow-card-lg"
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20">
              <div
                aria-hidden
                className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-[0.7] saturate-150"
                style={{ backgroundImage: `url("${product.imageUrl}")` }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-rosa-blush/40 via-transparent to-rosa-medio/50"
              />
              <ProductArt
                product={product}
                className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-rosa-blush/10 mix-blend-soft-light"
              />
              {product.stockStatus === "out_of_stock" && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/70 backdrop-blur-sm">
                  Esgotado
                </span>
              )}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-branco to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-t-[1.75rem] ring-1 ring-inset ring-rose-gold/20"
              />
            </div>

            <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-fit rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold">
                  {CATEGORY_LABELS[product.category] ?? product.category}
                </span>
                {product.level && (
                  <span className="w-fit rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                    {LEVEL_LABELS[product.level]}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {product.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
                {product.description}
              </p>
              <p className="mt-4 text-xl font-semibold text-rose-gold">
                {formatPrice(product.priceCents)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}