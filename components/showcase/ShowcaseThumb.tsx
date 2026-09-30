"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatBRL, type ShowcaseProduct } from "./data";
import { focusRing } from "./chrome";
import ProductPhoto from "./ProductPhoto";

interface ShowcaseThumbProps {
  product: ShowcaseProduct;
  /** Immediate next item. Wears the LED ring. */
  featured: boolean;
  onSelect: () => void;
}

export default function ShowcaseThumb({ product, featured, onSelect }: ShowcaseThumbProps) {
  return (
    <li className="snap-center">
      <m.button
        type="button"
        onClick={onSelect}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        aria-label={`Ver ${product.name}, ${formatBRL(product.price)}`}
        className={cn(
          "group relative block w-[7.5rem] shrink-0 rounded-3xl p-px text-left sm:w-[8.5rem] lg:w-full",
          focusRing,
        )}
        style={{
          boxShadow: `0 10px 28px rgba(0,0,0,0.35), 0 0 28px color-mix(in srgb, ${product.tint} 22%, transparent)`,
        }}
      >
        {featured && (
          <span aria-hidden className="showcase-led-spin absolute inset-0 rounded-3xl" />
        )}
        <span
          className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-white/10"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${product.tint} 28%, #241c20), #1c1519 78%)`,
          }}
        >
          <ProductPhoto product={product} sizes="140px" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1519] via-[#1c1519]/80 to-transparent px-3 pb-3 pt-8 opacity-100 transition duration-200 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-visible:translate-y-0 lg:group-focus-visible:opacity-100">
            <span className="block truncate text-xs font-medium text-white">{product.name}</span>
            <span className="mt-0.5 block text-xs tabular-nums" style={{ color: product.tint }}>
              {formatBRL(product.price)}
            </span>
          </span>
        </span>
      </m.button>
    </li>
  );
}
