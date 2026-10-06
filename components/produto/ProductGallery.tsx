"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Play, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

interface GalleryItem {
  type: "image" | "video";
  src: string;
  label: string;
}

interface ProductGalleryProps {
  images: string[];
  videoUrl?: string | null;
  productName: string;
  outOfStock?: boolean;
}

export default function ProductGallery({
  images,
  videoUrl,
  productName,
  outOfStock = false,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Build gallery items
  const gallery: GalleryItem[] = [
    ...images.map((src) => ({ type: "image" as const, src, label: productName })),
  ];
  if (videoUrl) {
    gallery.push({ type: "video", src: videoUrl, label: "Vídeo" });
  }

  const active = gallery[activeIndex] ?? gallery[0] ?? {
    type: "image" as const,
    src: "/placeholder-product.jpg",
    label: productName,
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.backgroundPosition = `${x}% ${y}%`;
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Main image/video */}
        <div
          className={cn(
            "relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-cinza-suave/30 bg-rosa-claro",
            zoom && "cursor-zoom-out",
          )}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStartX === null || gallery.length < 2) return;
            const delta = event.changedTouches[0]?.clientX;
            if (delta === undefined || Math.abs(delta - touchStartX) < 40) return;
            setActiveIndex((index) =>
              delta < touchStartX
                ? (index + 1) % gallery.length
                : (index - 1 + gallery.length) % gallery.length,
            );
            setZoom(false);
            setTouchStartX(null);
          }}
          onClick={() => {
            if (active.type === "image") setLightboxOpen(true);
          }}
          role="group"
          aria-label="Galeria de imagens do produto"
        >
          {active.type === "video" ? (
            videoUrl?.includes("youtube") || videoUrl?.includes("youtu.be") ? (
              <iframe
                src={videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                title={productName}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video
                src={active.src}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <>
              <Image
                src={active.src}
                alt={active.label}
                fill
                priority={activeIndex === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-300",
                  zoom && "scale-[2.2]",
                )}
              />
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-foreground shadow-lg transition-transform hover:scale-110"
                  aria-label="Ampliar imagem"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              )}
            </>
          )}

          {outOfStock && (
            <span className="absolute right-4 top-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-branco backdrop-blur-sm">
              Esgotado
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {gallery.length > 1 && (
          <div className="flex shrink-0 gap-3 overflow-x-auto pb-2 lg:max-h-[38rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2">
            {gallery.map((item, index) => (
              <button
                key={`${item.type}-${index}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex(index);
                  setZoom(false);
                }}
                aria-label={`Ver ${item.label}`}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-rosa-claro transition-all",
                  index === activeIndex
                    ? "border-rose-gold ring-2 ring-rose-gold/50"
                    : "border-cinza-suave/30 hover:border-rose-gold/60",
                )}
              >
                {item.type === "video" ? (
                  <span className="grid h-full w-full place-items-center text-rosa-blush">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                ) : (
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem ampliada: ${productName}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={active.src}
              alt={active.label}
              width={1200}
              height={1200}
              className="h-full w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
