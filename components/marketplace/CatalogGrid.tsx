"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { m, m as motion, useReducedMotion, LayoutGroup } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Pedestal, LEDUnderline } from "@/components/ui/LED";
import { PrimaryButton } from "@/components/ui/Button";
import { FloatingHeartButton } from "@/lib/wishlist";
import {
  CATEGORY_LABELS,
  formatPrice,
  LEVEL_LABELS,
  type Product,
  type SkillLevel,
} from "@/lib/catalogData";
import ProductArt from "./ProductArt";
import { trackSelectItem, trackViewItemList, trackFilterApply } from "@/lib/analytics";

import type { Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 250,
      damping: 30,
    },
  },
};

type LevelFilter = "todos" | SkillLevel;

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "todos", label: "Todos os níveis" },
  ...Object.entries(LEVEL_LABELS).map(([value, label]) => ({
    value: value as SkillLevel,
    label,
  })),
];

// Category filter options
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "todos", label: "Todas as categorias" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
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
  const reduceMotion = useReducedMotion();
  const [level, setLevel] = useState<LevelFilter>("todos");
  const [category, setCategory] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"relevancia" | "menor_preco" | "maior_preco">("relevancia");
  const hasLevels = products.some((product) => product.level);
  const hasCategories = products.some((p) => p.category);

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach((p) => uniqueCategories.add(p.category));
    return Array.from(uniqueCategories);
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];
    
    // Filter by level
    if (level !== "todos") {
      result = result.filter((product) => product.level === level);
    }
    
    // Filter by category
    if (category !== "todos") {
      result = result.filter((product) => product.category === category);
    }
    
    // Sort
    switch (sortBy) {
      case "menor_preco":
        result.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "maior_preco":
        result.sort((a, b) => b.priceCents - a.priceCents);
        break;
      default:
        // Keep original order (featured first)
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    
    return result;
  }, [products, level, category, sortBy]);

  // Track view_item_list event
  const listName = title.toLowerCase().replace(/\s+/g, '_');
  useEffect(() => {
    trackViewItemList(listName, filtered);
  }, [listName, filtered]);

  // Track filter changes
  const handleLevelChange = useCallback((newLevel: LevelFilter) => {
    setLevel(newLevel);
    trackFilterApply('level', newLevel);
  }, []);

  const handleCategoryChange = useCallback((newCategory: string) => {
    setCategory(newCategory);
    trackFilterApply('category', newCategory);
  }, []);

  const handleSortChange = useCallback((newSort: "relevancia" | "menor_preco" | "maior_preco") => {
    setSortBy(newSort);
    trackFilterApply('sort', newSort);
  }, []);

  // Animated counter — derived value; `key={count}` re-triggers the entrance
  // animation whenever the visible product count changes.
  const count = filtered.length;

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
          <LEDUnderline active={true} color="pink" animated={!reduceMotion} className="mt-2" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Category filter */}
          {hasCategories && categories.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-foreground/60">
              <span className="hidden sm:inline">Categoria</span>
              <select
                aria-label="Filtrar por categoria"
                value={category}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="cursor-pointer rounded-full border border-rose-gold/40 bg-branco px-4 py-2 pr-8 text-sm font-medium text-foreground shadow-card outline-none transition-colors hover:border-rose-gold focus:border-rose-gold"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Level filter */}
          {hasLevels && (
            <label className="flex items-center gap-2 text-sm text-foreground/60">
              <span className="hidden sm:inline">Nível</span>
              <select
                aria-label="Filtrar por nível de experiência"
                value={level}
                onChange={(event) => handleLevelChange(event.target.value as LevelFilter)}
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

          {/* Sort */}
          <label className="flex items-center gap-2 text-sm text-foreground/60">
            <span className="hidden sm:inline">Ordenar</span>
            <select
              aria-label="Ordenar por"
              value={sortBy}
              onChange={(event) => handleSortChange(event.target.value as "relevancia" | "menor_preco" | "maior_preco")}
              className="cursor-pointer rounded-full border border-rose-gold/40 bg-branco px-4 py-2 pr-8 text-sm font-medium text-foreground shadow-card outline-none transition-colors hover:border-rose-gold focus:border-rose-gold"
            >
              <option value="relevancia">Relevância</option>
              <option value="menor_preco">Menor preço</option>
              <option value="maior_preco">Maior preço</option>
            </select>
          </label>

          <span className="shrink-0 text-sm text-foreground/60">
            <motion.span
              key={count}
              initial={{ scale: 1.2, color: '#e8a0b4' }}
              animate={{ scale: 1, color: 'rgba(var(--foreground-rgb), 0.6)' }}
              transition={{ duration: 0.3 }}
            >
              {count} {count === 1 ? "produto" : "produtos"}
            </motion.span>
          </span>
        </div>
      </div>

      {/* Clear filters button */}
      {(level !== "todos" || category !== "todos" || sortBy !== "relevancia") && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-end"
        >
          <button
            type="button"
            onClick={() => {
              setLevel("todos");
              setCategory("todos");
              setSortBy("relevancia");
              trackFilterApply('clear', 'all');
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-gold transition-colors hover:text-rosa-blush"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <path d="M3 6h18M7 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6m4 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m4 0v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
            </svg>
            Limpar filtros
          </button>
        </m.div>
      )}

      {/* No results state */}
      {filtered.length === 0 && (
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="relative mb-8">
            <GlassCard className="h-32 w-32 flex items-center justify-center" hoverable={false}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16 text-rose-gold/50">
                <path d="M20 7h-9M20 12h-9M20 17h-9M14 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
              </svg>
            </GlassCard>
          </div>
          <h3 className="text-xl font-semibold text-white">Nenhum resultado</h3>
          <p className="mt-2 text-foreground/70 max-w-md">
            Não encontramos produtos com esses filtros. Tente ajustar suas opções.
          </p>
          <PrimaryButton
            onClick={() => {
              setLevel("todos");
              setCategory("todos");
              setSortBy("relevancia");
            }}
            className="mt-6"
          >
            Ver todos os produtos
          </PrimaryButton>
        </m.div>
      )}

      {/* Product grid */}
      <LayoutGroup>
        <m.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={reduceMotion ? {} : container}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((product, index) => (
            <motion.article
              key={product.id}
              variants={reduceMotion ? {} : item}
              layout
              className="group relative"
            >
              <GlassCard
                className="flex h-full flex-col overflow-hidden"
                hoverable
                withLed={false}
              >
                <Link
                  href={`/produto/${product.slug}`}
                  aria-label={`Ver ${product.name}`}
                  className="absolute inset-0 z-10"
                  onClick={() => trackSelectItem(product, listName, index)}
                />

                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20">
                  <Pedestal aspectRatio="1 / 1">
                    <ProductArt
                      product={product}
                      className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </Pedestal>
                  
                  {/* Floating heart button */}
                  <FloatingHeartButton product={product} position="top-right" />
                  
                  {/* Glass overlay on image */}
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
                  <div className="mt-auto pt-4">
                    <p className="text-xl font-semibold text-rose-gold">
                      {formatPrice(product.priceCents)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.article>
          ))}
        </m.div>
      </LayoutGroup>
    </section>
  );
}
