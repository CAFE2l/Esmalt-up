"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ShowcaseProduct } from "./data";

interface ProductPhotoProps {
  product: ShowcaseProduct;
  sizes: string;
  priority?: boolean;
  alt?: string;
  className?: string;
}

/**
 * White-background JPEGs are blended with multiply over a soft radial pedestal,
 * so the rectangle disappears into the stage. Transparent PNGs should set
 * `product.cutout` and skip that blend — multiply would dull the product.
 * Swap the file in `data.ts` (`image` + `cutout: true`).
 */
export default function ProductPhoto({
  product,
  sizes,
  priority = false,
  alt = "",
  className,
}: ProductPhotoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [product.image]);

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {product.cutout ? (
        <div
          aria-hidden
          className="absolute inset-[12%] rounded-full opacity-80 blur-2xl"
          style={{ background: product.tint }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-[6%] rounded-[40%]"
          style={{
            background: `radial-gradient(circle at 50% 46%, rgba(255,247,249,0.96) 0%, color-mix(in srgb, ${product.tint} 22%, #fff) 58%, transparent 78%)`,
          }}
        />
      )}

      {!loaded && !failed && (
        <div className="absolute inset-[18%] animate-pulse rounded-full bg-white/10" />
      )}

      {failed ? (
        <div className="absolute inset-0 grid place-items-center px-3 text-center text-sm font-medium text-white/80">
          {product.category}
        </div>
      ) : (
        <Image
          src={product.image}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-contain p-[12%]",
            !product.cutout && "mix-blend-multiply",
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
