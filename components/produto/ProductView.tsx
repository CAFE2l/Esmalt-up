"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Share2 } from "lucide-react";
import {
  getCategoryLabel,
  getInstallments as _getInstallments,
  getPrimaryProductImage,
  formatPrice,
  type Product,
} from "@/lib/products";
import ProductGallery from "./ProductGallery";
import ProductBuyBox from "./ProductBuyBox";
import Stars from "./Stars";
import { usePurchaseVerification } from "./PurchaseVerification";
import { useCart } from "@/lib/CartContext";
import { useRecentlyViewed } from "@/lib/wishlist/useRecentlyViewed";

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
  const { addItem } = useCart();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { hasPurchased } = usePurchaseVerification(product.id);
  const primaryImage = getPrimaryProductImage(product);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{
    variantId: string | null;
    variantName: string | null;
    imageUrl: string | null;
    priceCents: number;
    stock: number;
  }>({ variantId: null, variantName: null, imageUrl: null, priceCents: product.priceCents, stock: product.stock });
  const outOfStock = selectedVariant.stock <= 0;

  useEffect(() => {
    addRecentlyViewed(product);
  }, [addRecentlyViewed, product]);

  useEffect(() => {
    setSelectedVariant({
      variantId: null,
      variantName: null,
      imageUrl: null,
      priceCents: product.priceCents,
      stock: product.stock,
    });
  }, [product.id, product.priceCents, product.stock]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const shareProduct = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    setShareMenuOpen((open) => !open);
  };

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareMenuOpen(false);
    } catch {
      setShareMenuOpen(true);
    }
  };

  const handleBuyNow = () => {
    router.push("/checkout");
  };

  const handleMobileBuyNow = () => {
    if (selectedVariant.stock <= 0) return;
    addItem(product.id, 1, {
      variantId: selectedVariant.variantId ?? undefined,
      variantName: selectedVariant.variantName ?? undefined,
      product: {
        id: product.id,
        slug: product.slug,
        kind: product.kind,
        name: product.name,
        priceCents: selectedVariant.priceCents,
        imageUrl: selectedVariant.imageUrl ?? primaryImage,
        stock: selectedVariant.stock,
      },
    });
    handleBuyNow();
  };

  const categoryLabel = getCategoryLabel(product.category);
  const galleryImages = selectedVariant.imageUrl
    ? [selectedVariant.imageUrl, ...product.images.filter((image) => image !== selectedVariant.imageUrl)]
    : primaryImage
      ? [primaryImage, ...product.images.filter((image) => image !== primaryImage)]
    : product.images;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      {/* Breadcrumb */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
        <Link href="/" className="hover:text-rose-gold">
          Início
        </Link>
        <span aria-hidden>/</span>
        <Link href={product.kind === "kit" ? "/kits" : "/pecas-avulsas"} className="hover:text-rose-gold">
          {product.kind === "kit" ? "Kits" : "Peças Avulsas"}
        </Link>
        <span aria-hidden>/</span>
        <span className="max-w-[140px] truncate text-foreground/80">
          {categoryLabel}
        </span>
        <span aria-hidden>/</span>
        <span className="max-w-[140px] truncate text-foreground/80">
          {product.name}
        </span>
      </nav>

      {/* Main content */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,.75fr)] lg:gap-8">
        {/* Left: Gallery */}
        <div className="rounded-3xl border border-rose-gold/15 bg-branco/95 p-3 shadow-card sm:p-5">
          <ProductGallery
            images={galleryImages}
            videoUrl={product.videoUrl}
            productName={product.name}
            outOfStock={outOfStock}
          />
        </div>

        {/* Purchase details */}
        <div className="space-y-5 lg:sticky lg:top-24">
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
            {product.featured && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                Destaque
              </span>
            )}
            {product.soldCount >= 10 && (
              <span className="rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                Mais vendido
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>
          <p className="text-sm leading-6 text-foreground/65">{product.description}</p>

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

          <div className="rounded-3xl border border-rose-gold/20 bg-branco p-4 shadow-[0_16px_45px_rgba(20,10,16,.2)] sm:p-6">
            <ProductBuyBox
              product={product}
              onBuyNow={handleBuyNow}
              reviewCount={initialCount}
              ratingAvg={initialAverage}
              userHasPurchased={hasPurchased}
              onVariantChange={setSelectedVariant}
              compact
            />
          </div>

          <div className="rounded-2xl border border-cinza-suave/30 bg-branco/90 p-4">
            <p className="font-semibold text-foreground">Vendido e enviado por Esmalt&apos;up</p>
            <ul className="mt-3 grid gap-2 text-sm text-foreground/65 sm:grid-cols-2">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Pagamento processado com segurança</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Suporte especializado</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Prazo calculado pelo seu CEP</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Direito de arrependimento conforme a lei</li>
            </ul>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={shareProduct}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-gold/30 px-4 text-sm font-medium text-rose-gold hover:bg-rosa-claro/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
              aria-expanded={shareMenuOpen}
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            {shareMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 grid min-w-48 gap-1 rounded-xl border border-cinza-suave/40 bg-branco p-2 shadow-card">
                <button type="button" onClick={copyProductLink} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-rosa-claro/40">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar link
                </button>
                <Link className="rounded-lg px-3 py-2 text-sm hover:bg-rosa-claro/40" href={`https://wa.me/?text=${encodeURIComponent(`${product.name} ${typeof window === "undefined" ? "" : window.location.href}`)}`} target="_blank" rel="noreferrer">WhatsApp</Link>
                <a className="rounded-lg px-3 py-2 text-sm hover:bg-rosa-claro/40" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}`} target="_blank" rel="noreferrer">Facebook</a>
                <a className="rounded-lg px-3 py-2 text-sm hover:bg-rosa-claro/40" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}&text=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">X / Twitter</a>
                <a className="rounded-lg px-3 py-2 text-sm hover:bg-rosa-claro/40" href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}`}>E-mail</a>
              </div>
            )}
            {copied && <span role="status" className="ml-3 text-xs text-emerald-400">Link copiado!</span>}
          </div>
        </div>
      </div>

      <section className="mt-12 grid gap-8 rounded-3xl border border-rose-gold/15 bg-branco/95 p-5 pt-7 shadow-card sm:p-8 lg:grid-cols-2">
        <div id="descricao" className="space-y-4">
          <h2 className="text-2xl font-bold">Descrição</h2>
          <p className="leading-relaxed text-foreground/75">{product.description}</p>
          {product.highlights.length > 0 && (
            <ul className="space-y-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-foreground/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-gold" /> {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
        {product.specs && product.specs.length > 0 && (
          <div id="especificacoes" className="space-y-3">
            <h2 className="text-2xl font-bold">Especificações</h2>
            <div className="overflow-hidden rounded-2xl border border-cinza-suave/30 bg-branco">
              <table className="w-full text-sm">
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={`${spec.label}-${index}`} className={index % 2 === 0 ? "bg-rosa-claro/30" : ""}>
                      <th scope="row" className="px-4 py-3 text-left font-medium text-foreground/70">{spec.label}</th>
                      <td className="px-4 py-3">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cinza-suave/40 bg-branco p-4 shadow-header lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-foreground/60">A partir de</p>
            <p className="text-lg font-bold text-rose-gold">{formatPrice(selectedVariant.priceCents)}</p>
          </div>
          <button
            type="button"
            onClick={() => addItem(product.id, 1, {
              variantId: selectedVariant.variantId ?? undefined,
              variantName: selectedVariant.variantName ?? undefined,
              product: {
                id: product.id,
                slug: product.slug,
                kind: product.kind,
                name: product.name,
                priceCents: selectedVariant.priceCents,
                imageUrl: selectedVariant.imageUrl ?? primaryImage,
                stock: selectedVariant.stock,
              },
            })}
            disabled={outOfStock}
            className="rounded-full border border-rose-gold px-3 py-3 text-xs font-semibold text-rose-gold disabled:opacity-40"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={handleMobileBuyNow}
            disabled={outOfStock}
            className="flex-1 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            {outOfStock ? "Indisponível" : "Comprar agora"}
          </button>
        </div>
      </div>
    </section>
  );
}
