"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Pedestal, LightSweep } from "@/components/ui/LED";
import ProductArt from "@/components/marketplace/ProductArt";
import { getLocalRecentlyViewed, type Product } from "./useRecentlyViewed";
import { formatPrice } from "@/lib/catalogData";
import { trackViewItemList, trackSelectItem } from "@/lib/analytics";

/**
 * RecentlyViewedStrip - Horizontal scrolling strip of recently viewed products
 * 
 * Features:
 * - Shows up to 8 recently viewed products
 * - Glass card styling
 * - Smooth scroll with drag
 * - Responsive design
 * - GA4 tracking
 */

interface RecentlyViewedStripProps {
  className?: string;
  title?: string;
  maxItems?: number;
}

export function RecentlyViewedStrip({
  className = "",
  title = "Vistos recentemente",
  maxItems = 8,
}: RecentlyViewedStripProps) {
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recently viewed from localStorage
  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const stored = getLocalRecentlyViewed();
        setProducts(stored.slice(0, maxItems));
        
        // Track view_item_list event
        if (stored.length > 0) {
          trackViewItemList('recently_viewed', stored.slice(0, maxItems));
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentlyViewed();

    // Listen for storage changes
    window.addEventListener('storage', loadRecentlyViewed);
    window.addEventListener('recently-viewed-updated', loadRecentlyViewed);
    return () => {
      window.removeEventListener('storage', loadRecentlyViewed);
      window.removeEventListener('recently-viewed-updated', loadRecentlyViewed);
    };
  }, [maxItems]);

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="h-4 w-20 animate-pulse rounded bg-rosa-claro/30" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Produtos que você visualizou recentemente
            </p>
          </div>
          <Link
            href="/kits"
            className="shrink-0 text-sm font-medium text-rose-gold transition-colors hover:text-rosa-blush"
          >
            Ver mais →
          </Link>
        </div>

        <m.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {products.map((product, index) => (
              <m.div
                key={product.id}
                className="flex-shrink-0 w-48"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/produto/${product.slug}`}
                  aria-label={`Ver ${product.name}`}
                  className="block"
                  onClick={() => trackSelectItem(product, 'recently_viewed', index)}
                >
                  <GlassCard
                    className="h-full overflow-hidden"
                    hoverable
                    withLed={false}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Pedestal aspectRatio="1 / 1">
                        <ProductArt
                          product={product}
                          className="absolute inset-0 h-full w-full"
                        />
                      </Pedestal>
                      {!reduceMotion && (
                        <LightSweep disabled={false}>
                          <div className="absolute inset-0" />
                        </LightSweep>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="truncate text-sm font-medium">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-rose-gold font-semibold">
                        {formatPrice(product.priceCents)}
                      </p>
                    </div>
                  </GlassCard>
                </Link>
              </m.div>
            ))}
          </div>

          {/* Gradient overlays for scroll indication */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12"
            style={{
              background: 'linear-gradient(to right, rgb(var(--bege-claro)), transparent)',
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12"
            style={{
              background: 'linear-gradient(to left, rgb(var(--bege-claro)), transparent)',
            }}
          />
        </m.div>
      </div>
    </section>
  );
}

// CSS for hiding scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyles;
  style.id = 'scrollbar-hide-styles';
  if (!document.getElementById('scrollbar-hide-styles')) {
    document.head.appendChild(style);
  }
}

// Exports
export {
  RecentlyViewedStrip as default,
};
