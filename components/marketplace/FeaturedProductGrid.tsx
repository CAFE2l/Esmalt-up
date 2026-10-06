"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, ShoppingCart, Star, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS, LEVEL_LABELS, formatPrice, type Product } from "@/lib/catalogData";
import ProductArt from "./ProductArt";
import { trackEvent } from "@/components/showcase/analytics";
import { FavoritesButton } from "@/lib/wishlist";
import { useCart } from "@/lib/CartContext";

// Product Card Component
function ProductCard({
  product,
  index,
  isHero = false,
  onQuickView,
  showRating = true,
  showBadges = true,
}: {
  product: Product;
  index?: number;
  isHero?: boolean;
  onQuickView?: (product: Product) => void;
  showRating?: boolean;
  showBadges?: boolean;
}) {
  const { addItem } = useCart();
  const handleQuickViewClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
    trackEvent("quick_view_open", { item_id: product.id, item_name: product.name });
  }, [product, onQuickView]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    addItem(product.id, 1, {
      product: {
        id: product.id,
        slug: product.slug,
        kind: product.kind,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.images[0] ?? "",
        stock: product.stock,
      },
    });
    trackEvent("add_to_cart", { item_id: product.id, item_name: product.name, price: product.priceCents });
  }, [addItem, product]);

  const stockStatus = product.stock <= 0 ? "out_of_stock" : "in_stock";
  const discountPercentage = product.oldPriceCents 
    ? Math.round(((product.oldPriceCents - product.priceCents) / product.oldPriceCents) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index ? index * 0.1 : 0, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative flex flex-col bg-branco rounded-2xl border border-rose-gold/25 shadow-card transition-all duration-300 hover:shadow-card-lg ${
        isHero ? "lg:col-span-2 lg:row-span-2" : ""
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-rosa-claro via-branco to-rosa-medio/20 rounded-t-2xl">
        {stockStatus === "out_of_stock" && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-10 flex items-center justify-center">
            <span className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold text-foreground/70 backdrop-blur-sm">
              Esgotado
            </span>
          </div>
        )}
        
        {discountPercentage > 0 && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-3 py-1 text-xs font-semibold text-white shadow-card">
            -{discountPercentage}%
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <ProductArt product={product} className="h-full w-full object-contain" />
        </div>

        {/* Badges */}
        {showBadges && (
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {product.level && (
              <span className="rounded-full bg-rose-gold/10 px-2 py-1 text-[10px] font-medium text-rose-gold">
                {LEVEL_LABELS[product.level as keyof typeof LEVEL_LABELS] || product.level}
              </span>
            )}
            {product.featured && (
              <span className="rounded-full bg-rosa-blush/15 px-2 py-1 text-[10px] font-medium text-rosa-blush flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Destaque
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <FavoritesButton product={product} className="h-9 w-9" size="sm" />
          
          <button
            onClick={handleQuickViewClick}
            aria-label="Visualizar rápido"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-rose-gold/30 bg-branco text-rose-gold hover:bg-rosa-claro/50 transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <span className="text-xs font-medium text-rose-gold uppercase tracking-wider">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-foreground tracking-tight mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
            {product.name}
          </h3>
          
          {showRating && product.ratingAvg > 0 && (
            <div className="flex items-center gap-1 text-xs text-foreground/50 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.round(product.ratingAvg) ? "text-rose-gold fill-current" : "text-foreground/20"}`}
                  />
                ))}
              </div>
              <span>({product.ratingCount})</span>
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-2">
            {discountPercentage > 0 && (
              <span className="text-sm text-foreground/50 line-through">
                {formatPrice(product.oldPriceCents || product.priceCents)}
              </span>
            )}
            <span className={`text-lg font-bold ${discountPercentage > 0 ? "text-rose-gold" : "text-foreground"}`}>
              {formatPrice(product.priceCents)}
            </span>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === "out_of_stock"}
            aria-label="Adicionar ao carrinho"
            className="p-2 rounded-full border-2 border-rose-gold/30 text-rose-gold hover:bg-rosa-claro/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Horizontal Scrollable Product Rail
function ProductRail({
  products,
  title,
  showTitle = true,
  onQuickView,
}: {
  products: Product[];
  title?: string;
  showTitle?: boolean;
  onQuickView?: (product: Product) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!railRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
  }, []);

  const scrollLeft = useCallback(() => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ 
      left: -300, 
      behavior: "smooth" 
    });
  }, []);

  const scrollRight = useCallback(() => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ 
      left: 300, 
      behavior: "smooth" 
    });
  }, []);

  useEffect(() => {
    checkScroll();
    const currentRef = railRef.current;
    currentRef?.addEventListener("scroll", checkScroll);
    return () => currentRef?.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(checkScroll);
    if (railRef.current) {
      resizeObserver.observe(railRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [checkScroll]);

  if (products.length === 0) return null;

  return (
    <section className="bg-bege py-8 sm:py-12">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        {showTitle && title && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-rosa-blush via-rosa-medio to-rose-gold bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            <Link
              href={title.includes("Kits") ? "/kits" : "/pecas-avulsas"}
              className="shrink-0 text-sm font-semibold text-rose-gold transition-colors hover:text-rosa-blush"
              onClick={() => trackEvent("cta_click", { cta_id: "view_all_link", location: "featured_products" })}
            >
              Ver todos
            </Link>
          </div>
        )}

        {/* Rail Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              aria-label="Rolar para esquerda"
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-rose-gold/30 bg-branco p-2 shadow-card hover:bg-rosa-claro/50 transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5 text-rose-gold" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              aria-label="Rolar para direita"
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-rose-gold/30 bg-branco p-2 shadow-card hover:bg-rosa-claro/50 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5 text-rose-gold" />
            </button>
          )}

          {/* Products Rail */}
          <div
            ref={railRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 snap-x snap-mandatory scroll-smooth"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="shrink-0 w-64 sm:w-72 snap-start"
              >
                <ProductCard
                  product={product}
                  index={index}
                  onQuickView={onQuickView}
                  showRating={true}
                  showBadges={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Featured Product Grid with Hero + Small Cards
function FeaturedProductGridView({
  products,
  title,
  onQuickView,
  showHero = true,
}: {
  products: Product[];
  title?: string;
  onQuickView?: (product: Product) => void;
  showHero?: boolean;
}) {
  if (products.length === 0) return null;

  // Sort products: featured first, then by rating, then by price
  const sortedProducts = [...products].sort((a, b) => {
    if (b.featured !== a.featured) return b.featured ? 1 : -1;
    if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
    return a.priceCents - b.priceCents;
  });

  const heroProduct = showHero ? sortedProducts[0] : null;
  const remainingProducts = showHero ? sortedProducts.slice(1, 9) : sortedProducts.slice(0, 8);

  return (
    <section className="bg-bege py-8 sm:py-12">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        {title && (
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-rosa-blush via-rosa-medio to-rose-gold bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            <Link
              href={title.includes("Kits") ? "/kits" : "/pecas-avulsas"}
              className="shrink-0 text-sm font-semibold text-rose-gold transition-colors hover:text-rosa-blush"
              onClick={() => trackEvent("cta_click", { cta_id: "view_all_link", location: "featured_products" })}
            >
              Ver todos
            </Link>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Product Card */}
          {heroProduct && showHero && (
            <div className="lg:row-span-2">
              <ProductCard
                product={heroProduct}
                isHero={true}
                onQuickView={onQuickView}
                showRating={true}
                showBadges={true}
              />
            </div>
          )}

          {/* Small Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
            {remainingProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onQuickView={onQuickView}
                showRating={true}
                showBadges={true}
              />
            ))}
          </div>
        </div>

        {/* Mobile View - Stack all products vertically */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sortedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onQuickView={onQuickView}
                showRating={true}
                showBadges={true}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Quick View Modal
function QuickViewModal({
  product,
  onClose,
  relatedProducts = [],
  onQuickView,
}: {
  product: Product | null;
  onClose: () => void;
  relatedProducts?: Product[];
  onQuickView?: (product: Product) => void;
}) {
  const { addItem } = useCart();
  if (!product) return null;

  const stockStatus = product.stock <= 0 ? "out_of_stock" : "in_stock";
  const discountPercentage = product.oldPriceCents 
    ? Math.round(((product.oldPriceCents - product.priceCents) / product.oldPriceCents) * 100)
    : 0;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="quickview-backdrop"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="quickview-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] bg-branco rounded-3xl border border-rose-gold/25 shadow-card-lg overflow-y-auto"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-rose-gold/15">
                <h2 className="text-xl font-bold text-foreground">Visualização Rápida</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full border border-rose-gold/30 hover:bg-rosa-claro/50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-rose-gold transform rotate-90" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex flex-col sm:flex-row gap-6 p-6">
                {/* Product Image */}
                <div className="sm:w-1/2 flex items-center justify-center">
                  <div className="relative aspect-[4/3] max-w-sm w-full">
                    {stockStatus === "out_of_stock" && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-10 flex items-center justify-center rounded-2xl">
                        <span className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold text-foreground/70 backdrop-blur-sm">
                          Esgotado
                        </span>
                      </div>
                    )}
                    
                    {discountPercentage > 0 && (
                      <div className="absolute top-3 right-3 z-20 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-3 py-1 text-xs font-semibold text-white shadow-card">
                        -{discountPercentage}%
                      </div>
                    )}

                    <ProductArt product={product} className="h-full w-full object-contain rounded-2xl" />
                  </div>
                </div>

                {/* Product Details */}
                <div className="sm:w-1/2 space-y-4">
                  <div>
                    {product.category && (
                      <span className="inline-block rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold mb-2">
                        {CATEGORY_LABELS[product.category] ?? product.category}
                      </span>
                    )}
                    
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      {discountPercentage > 0 && (
                        <span className="text-base text-foreground/50 line-through">
                          {formatPrice(product.oldPriceCents || product.priceCents)}
                        </span>
                      )}
                      <span className={`text-2xl font-bold ${discountPercentage > 0 ? "text-rose-gold" : "text-foreground"}`}>
                        {formatPrice(product.priceCents)}
                      </span>
                    </div>

                    {product.ratingAvg > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.round(product.ratingAvg) ? "text-rose-gold fill-current" : "text-foreground/20"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-foreground/50">({product.ratingCount} avaliações)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <FavoritesButton product={product} showText className="flex-1" />
                    </div>

                    <Link
                      href={`/produto/${product.slug}`}
                      onClick={() => {
                        onClose();
                        trackEvent("select_item", {
                          item_id: product.id,
                          item_name: product.name,
                          item_list_name: "quick_view_detail",
                          index: 0,
                        });
                      }}
                      className="block w-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-semibold text-white shadow-card hover:shadow-card-lg transition-shadow duration-200"
                    >
                      Ver detalhes
                    </Link>

                    <button
                      onClick={() => {
                        addItem(product.id, 1, {
                          product: {
                            id: product.id,
                            slug: product.slug,
                            kind: product.kind,
                            name: product.name,
                            priceCents: product.priceCents,
                            imageUrl: product.images[0] ?? "",
                            stock: product.stock,
                          },
                        });
                        trackEvent("add_to_cart", { item_id: product.id, item_name: product.name, price: product.priceCents });
                        onClose();
                      }}
                      disabled={stockStatus === "out_of_stock"}
                      className="w-full rounded-full border-2 border-rose-gold/30 py-3 text-center text-sm font-semibold text-rose-gold hover:bg-rosa-claro/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>

                  {/* Related Products */}
                  {relatedProducts.length > 0 && (
                    <div className="pt-4 border-t border-rose-gold/15">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Produtos Relacionados</h4>
                      <div className="flex gap-3">
                        {relatedProducts.slice(0, 3).map((related) => (
                          <button
                            key={related.id}
                            onClick={() => {
                              onClose();
                              setTimeout(() => onQuickView?.(related), 100);
                            }}
                            className="group relative h-20 w-20 shrink-0 rounded-xl border border-rose-gold/25 bg-rosa-claro/40 overflow-hidden transition-transform hover:scale-105"
                          >
                            <ProductArt product={related} className="h-full w-full object-contain p-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Main Component Interface
export interface FeaturedProductGridProps {
  products: Product[];
  title?: string;
  layout?: "grid" | "rail";
  showHero?: boolean;
}

// Main Component
export default function FeaturedProductGrid({
  products,
  title,
  layout = "grid",
  showHero = true,
}: FeaturedProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    trackEvent("quick_view_open", { item_id: product.id, item_name: product.name });
  }, []);

  const relatedProducts = quickViewProduct
    ? products.filter(
        (p) => p.category === quickViewProduct.category && p.id !== quickViewProduct.id
      ).slice(0, 3)
    : [];

  // Track view_item_list event
  useEffect(() => {
    if (products.length > 0) {
      trackEvent("view_item_list", {
        item_list_name: title || "featured_products",
        items: products.slice(0, 4).map((p, i) => ({
          item_id: p.id,
          item_name: p.name,
          index: i,
          price: p.priceCents,
        })),
      });
    }
  }, [products, title]);

  if (layout === "rail") {
    return (
      <>
        <ProductRail
          products={products}
          title={title}
          onQuickView={handleQuickView}
        />
        
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onQuickView={handleQuickView}
          relatedProducts={relatedProducts}
        />
      </>
    );
  }

  // Default: Grid layout
  return (
    <>
      <FeaturedProductGridView
        products={products}
        title={title}
        onQuickView={handleQuickView}
        showHero={showHero}
      />
      
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onQuickView={handleQuickView}
        relatedProducts={relatedProducts}
      />
    </>
  );
}