"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites, type FavoriteProduct } from "@/lib/wishlist";
import { useCart } from "@/lib/CartContext";
import { formatPrice, getPrimaryProductImage } from "@/lib/products";
import { primaryButton, outlineButton } from "@/components/buttonStyles";

function WishlistCard({
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

  return (
    <li className="overflow-hidden rounded-3xl border border-cinza-suave/50 bg-branco shadow-card">
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-rosa-claro/40"
      >
        {image && !imageFailed ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-contain p-5"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid h-full place-items-center text-rose-gold/50">
            <Heart className="h-12 w-12" />
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link
          href={`/produto/${product.slug}`}
          className="line-clamp-2 min-h-10 font-semibold text-foreground hover:text-rose-gold"
        >
          {product.name}
        </Link>
        <p className="mt-2 text-lg font-bold text-rose-gold">
          {formatPrice(product.priceCents)}
        </p>
        <p className={`mt-1 text-xs font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {product.stock > 0 ? "Em estoque" : "Indisponível"}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className={`${primaryButton} flex-1 px-3 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${product.name} dos favoritos`}
            title="Remover dos favoritos"
            className={`${outlineButton} grid h-10 w-10 shrink-0 place-items-center p-0 text-rose-gold`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading, error, removeFavorite } = useFavorites();
  const { addItem } = useCart();

  if (authLoading || (user && isLoading)) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-6">
        <div className="h-8 w-64 rounded bg-rosa-claro" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="aspect-square rounded-3xl bg-rosa-claro/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-rose-gold" />
        <h1 className="mt-4 text-2xl font-bold">Minha Lista de Desejos</h1>
        <p className="mt-2 text-foreground/60">Entre para ver seus produtos favoritos.</p>
        <Link href="/login" className={`${primaryButton} mt-6 px-6 py-3 text-sm`}>
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        <Link href="/perfil" className="hover:text-rose-gold">Minha Área</Link>
        <span aria-hidden>/</span>
        <span className="text-rose-gold">Lista de Desejos</span>
      </nav>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Minha Lista de Desejos
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {favorites.length} {favorites.length === 1 ? "produto salvo" : "produtos salvos"}
          </p>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 text-sm text-red-500">{error.message}</p>}
      {favorites.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-cinza-suave/50 bg-branco px-6 py-16 text-center shadow-card">
          <Heart className="mx-auto h-10 w-10 text-rose-gold/60" />
          <h2 className="mt-4 text-lg font-semibold">Sua lista está vazia</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Toque no coração de um produto para guardá-lo aqui.
          </p>
          <Link href="/kits" className={`${outlineButton} mt-6 px-5 py-2.5 text-sm`}>
            Explorar produtos
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((product) => (
            <WishlistCard
              key={product.id}
              product={product}
              onRemove={() => void removeFavorite(product.id)}
              onAddToCart={() =>
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
                })
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
