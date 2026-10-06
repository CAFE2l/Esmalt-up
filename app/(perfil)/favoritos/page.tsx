"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  Check,
  Heart,
  Share2,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites, type FavoriteProduct } from "@/lib/wishlist";
import { useCart } from "@/lib/CartContext";
import {
  formatPrice,
  getFeaturedSync,
  getPrimaryProductImage,
  type Product,
} from "@/lib/products";
import { primaryButton, outlineButton } from "@/components/buttonStyles";
import {
  AmbientBackground,
  GlassBadge,
  GlassSkeleton,
  GlowToast,
  type GlowToastData,
} from "@/components/ui";
import ProductCarousel from "@/components/ui/ProductCarousel";
import {
  fadeUpItem,
  reducedMotionVariants,
  staggerContainer,
} from "@/lib/motion/variants";

type SortKey = "recentes" | "menor-preco" | "maior-preco" | "nome";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recentes", label: "Mais recentes" },
  { key: "menor-preco", label: "Menor preço" },
  { key: "maior-preco", label: "Maior preço" },
  { key: "nome", label: "Nome A–Z" },
];

function FavoriteCard({
  product,
  onRemove,
  onAddToCart,
}: {
  product: FavoriteProduct;
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getPrimaryProductImage(product);
  const outOfStock = product.stock <= 0;

  return (
    <motion.li
      layout
      variants={fadeUpItem}
      className="glow-surface group relative overflow-hidden rounded-3xl transition-shadow duration-300 hover:glow-halo focus-within:glow-halo"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-rosa-claro/40"
      >
        {image && !imageFailed ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid h-full place-items-center text-rose-gold/40">
            <Heart className="h-14 w-14" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3 z-10">
          <GlassBadge tone={outOfStock ? "danger" : "success"} className="bg-black/50">
            {outOfStock ? "Esgotado" : "Em estoque"}
          </GlassBadge>
        </span>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/produto/${product.slug}`}
            className="line-clamp-2 min-h-10 font-semibold text-foreground transition-colors hover:text-rose-gold"
          >
            {product.name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${product.name} dos favoritos`}
            title="Remover dos favoritos"
            className="-mt-1 -mr-1 shrink-0 rounded-full p-2 text-rose-gold transition-colors hover:bg-rosa-claro focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold"
          >
            <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-lg font-bold text-rose-gold">
          {formatPrice(product.priceCents)}
        </p>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={outOfStock}
          className={`${primaryButton} mt-4 w-full px-3 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {outOfStock ? "Indisponível" : "Adicionar à sacola"}
        </button>
      </div>
    </motion.li>
  );
}


function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-surface mx-auto max-w-xl rounded-3xl px-6 py-16 text-center"
    >
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rosa-claro/50">
        <Heart className="h-10 w-10 text-rose-gold" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">
        Sua lista de favoritos está vazia
      </h2>
      <p className="mt-2 text-sm text-foreground/60">
        Toque no coração de um produto para guardá-lo aqui e acompanhar seus
        preferidos de um jeito só.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/kits" className={`${primaryButton} px-6 py-2.5 text-sm`}>
          Explorar kits
        </Link>
        <Link href="/pecas-avulsas" className={`${outlineButton} px-6 py-2.5 text-sm`}>
          Ver peças avulsas
        </Link>
      </div>
    </motion.div>
  );
}

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading, error, removeFavorite, addFavorite } = useFavorites();
  const { addItem } = useCart();
  const reducedMotion = useReducedMotion();

  const [sort, setSort] = useState<SortKey>("recentes");
  const [toast, setToast] = useState<GlowToastData | null>(null);
  const [copied, setCopied] = useState(false);

  const sortedFavorites = useMemo(() => {
    const list = [...favorites];
    switch (sort) {
      case "menor-preco":
        return list.sort((a, b) => a.priceCents - b.priceCents);
      case "maior-preco":
        return list.sort((a, b) => b.priceCents - a.priceCents);
      case "nome":
        return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      default:
        return list;
    }
  }, [favorites, sort]);

  const recommendations = useMemo<Product[]>(() => {
    const favoriteIds = new Set(favorites.map((favorite) => favorite.id));
    return [...getFeaturedSync("kit"), ...getFeaturedSync("peca")]
      .filter((product) => !favoriteIds.has(product.id))
      .slice(0, 10);
  }, [favorites]);

  const handleRemove = async (product: FavoriteProduct) => {
    await removeFavorite(product.id);
    setToast({
      id: Date.now(),
      message: `“${product.name}” foi removido dos favoritos.`,
      actionLabel: "Desfazer",
      onAction: () => {
        void addFavorite(product);
        setToast({
          id: Date.now(),
          message: `“${product.name}” voltou para os favoritos.`,
        });
      },
    });
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    addItem(product.id, 1, {
      product: {
        id: product.id,
        slug: product.slug,
        kind: product.kind === "kit" ? "kit" : "peca",
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: getPrimaryProductImage(product),
        stock: product.stock,
      },
    });
    setToast({
      id: Date.now(),
      message: `“${product.name}” foi adicionado à sacola.`,
    });
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "/favoritos";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meus favoritos — Esmalt'up", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToast({ id: Date.now(), message: "Link dos favoritos copiado!" });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Compartilhamento nativo cancelado pelo usuário — não é erro.
    }
  };

  const containerVariants = reducedMotion
    ? reducedMotionVariants.stagger
    : staggerContainer;

  if (authLoading || (user && isLoading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-busy="true">
        <GlassSkeleton className="h-8 w-64 rounded-full" />
        <div className="mt-3">
          <GlassSkeleton className="h-4 w-40 rounded-full" />
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <GlassSkeleton className="aspect-square rounded-3xl" count={4} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-rose-gold" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Meus Favoritos</h1>
        <p className="mt-2 text-foreground/60">
          Entre para ver os produtos que você salvou.
        </p>
        <Link
          href="/login?redirect=%2Ffavoritos"
          className={`${primaryButton} mt-6 px-6 py-3 text-sm`}
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <>
      <AmbientBackground />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav
          aria-label="Trilha de navegação"
          className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          <Link href="/perfil" className="hover:text-rose-gold">
            Minha Área
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-rose-gold">Favoritos</span>
        </nav>

        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          className="relative overflow-hidden rounded-3xl border border-rose-gold/20 bg-branco/40 p-6 backdrop-blur-xl sm:p-8"
        >
          <span
            aria-hidden="true"
            className="glow-led-line absolute inset-x-0 top-0 h-0.5 opacity-70"
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-rose-gold">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Esmalt&apos;up Glow
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Meus Favoritos
              </h1>
              <p className="mt-1 text-sm text-foreground/60">
                {favorites.length}{" "}
                {favorites.length === 1 ? "produto salvo" : "produtos salvos"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className={`${outlineButton} gap-2 px-4 py-2 text-sm`}
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Copiado" : "Compartilhar lista"}
            </button>
          </div>

          {favorites.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-cinza-suave/40 pt-5">
            <ArrowUpDown className="h-4 w-4 text-rose-gold" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Ordenar
            </span>
            <div role="group" aria-label="Ordenar favoritos" className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSort(option.key)}
                  aria-pressed={sort === option.key}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold ${
                    sort === option.key
                      ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white shadow-card"
                      : "border border-cinza-suave/60 text-foreground/60 hover:border-rose-gold/60 hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.header>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {error.message}
        </p>
      )}

      {favorites.length === 0 ? (
        <div className="mt-8">
          <EmptyState />
        </div>
      ) : (
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {sortedFavorites.map((product) => (
              <FavoriteCard
                key={product.id}
                product={product}
                onRemove={() => void handleRemove(product)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {recommendations.length > 0 && (
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-14"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-gold" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Você também pode curtir
            </h2>
          </div>
          <ProductCarousel
            products={recommendations.map((product) => ({
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: getPrimaryProductImage(product),
              kind: product.kind,
              category: product.category,
              stock: product.stock,
            }))}
          />
        </motion.section>
      )}
      </section>

      <GlowToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
