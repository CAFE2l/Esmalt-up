"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  LEVEL_LABELS,
  formatInstallment,
  formatPrice,
  getInstallments,
  type Product,
} from "@/lib/catalogData";
import { useCart } from "@/lib/CartContext";
import { primaryButton } from "@/components/buttonStyles";
import Stars from "./Stars";
import { cn } from "@/lib/cn";

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
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [cepx, setCep] = useState("");
  const [cepResult, setCepResult] = useState<string | null>(null);

  // Galeria: imagem principal (+ vídeo/flavor quando disponível).
  const gallery = useMemo(() => {
    const items: { type: "image" | "video"; src: string; label: string }[] = [];
    items.push({
      type: "image",
      src: product.imageUrl,
      label: product.name,
    });
    if (product.videoUrl) {
      items.push({ type: "video", src: product.videoUrl, label: "Vídeo" });
    }
    return items;
  }, [product]);

  const active = gallery[activeIndex] ?? gallery[0]!;
  const installments = getInstallments(product.priceCents);
  const outOfStock = product.stockStatus === "out_of_stock";

  useEffect(() => {
    setActiveIndex(0);
    setZoom(false);
    setCepResult(null);
  }, [product.id]);

  const checkCep = () => {
    const digits = cepx.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepResult("CEP inválido. Use 8 dígitos.");
      return;
    }
    setCepResult(
      digits.startsWith("0") || digits.startsWith("1")
        ? "Frete grátis para este CEP"
        : "Frete calculado no checkout por este CEP",
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ---- Galeria ---- */}
        <div className="space-y-3">
          <div
            className={cn(
              "relative aspect-square overflow-hidden rounded-[2rem] border border-cinza-suave/30 bg-rosa-claro",
              zoom && "cursor-zoom-out",
            )}
            onMouseMove={(event) => {
              if (!zoom) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              event.currentTarget.style.backgroundPosition = `${x}% ${y}%`;
            }}
          >
            {active.type === "video" ? (
              <video
                src={active.src}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={active.src}
                alt={active.label}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-300",
                  zoom && "scale-[2.2]",
                )}
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
              />
            )}

            {outOfStock && (
              <span className="absolute right-4 top-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-branco backdrop-blur-sm">
                Esgotado
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3">
              {gallery.map((item, index) => (
                <button
                  key={`${item.type}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
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
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                        <path d="M8 5v14l11-7L8 5z" />
                      </svg>
                    </span>
                  ) : (
                    <Image src={item.src} alt={item.label} fill sizes="80px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Buy box ---- */}
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-xs font-medium text-rose-gold">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </span>
            {product.level && (
              <span className="rounded-full bg-rosa-blush/15 px-3 py-1 text-xs font-medium text-rosa-blush">
                {LEVEL_LABELS[product.level]}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75 sm:text-base">
            {product.description}
          </p>

          {initialAverage ? (
            <div className="mt-4 flex items-center gap-2">
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
            <p className="mt-4 text-sm text-foreground/50">
              Seja o primeiro a avaliar este produto.
            </p>
          )}

          {/* Preço */}
          <div className="mt-6">
            <p className="text-3xl font-bold text-rose-gold sm:text-4xl">
              {formatPrice(product.priceCents)}
            </p>
            {installments.maxInstallments > 1 && (
              <p className="mt-1 text-sm text-foreground/70">
                em até{" "}
                <strong className="text-foreground">
                  {installments.maxInstallments}x de{" "}
                  {formatInstallment(installments.installmentCents)}
                </strong>{" "}
                sem juros
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-cinza-suave/50 bg-branco">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="grid h-12 w-12 place-items-center rounded-full text-xl text-foreground/70 hover:text-rose-gold"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Aumentar quantidade"
                className="grid h-12 w-12 place-items-center rounded-full text-xl text-foreground/70 hover:text-rose-gold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => addItem(product.id, quantity)}
              className={cn(
                primaryButton,
                "flex-1 px-8 py-3 text-sm",
                outOfStock && "pointer-events-none opacity-40",
              )}
            >
              {outOfStock ? "Indisponível" : "Adicionar ao carrinho"}
            </button>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              addItem(product.id, quantity);
              // redireciona após um tick para o carrinho abrir por cima
              requestAnimationFrame(() => {
                window.location.href = "/checkout";
              });
            }}
            className={cn(
              primaryButton,
              "mt-3 w-full py-3 text-sm",
              outOfStock && "pointer-events-none opacity-40",
            )}
            style={{ backgroundImage: "linear-gradient(to right, #d396a0, #e09caa)" }}
          >
            Comprar agora
          </button>

          {/* Frete por CEP */}
          <div className="mt-6 rounded-3xl border border-cinza-suave/40 bg-rosa-claro/30 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-rosa-blush">
                <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Calcule frete e prazo
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={cepx}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                  setCep(
                    digits.length > 5
                      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                      : digits,
                  );
                  setCepResult(null);
                }}
                placeholder="00000-000"
                aria-label="CEP"
                className="w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
              />
              <button
                type="button"
                onClick={checkCep}
                className="shrink-0 rounded-full bg-rosa-claro px-5 text-sm font-semibold text-rose-gold transition-colors hover:bg-rosa-blush hover:text-white"
              >
                OK
              </button>
            </div>
            {cepResult && (
              <p className="mt-2 text-xs text-foreground/70">{cepResult}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}