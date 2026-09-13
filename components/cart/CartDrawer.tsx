"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/CartContext";
import { getProduct, formatPrice } from "@/lib/catalogData";
import { primaryButton } from "@/components/buttonStyles";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    itemCount,
    subtotalCents,
    couponState,
    removeItem,
    setQuantity,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    await applyCoupon(couponInput);
    setCouponInput("");
  };

  const showCheckout = itemCount > 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCart}
      />

      <div
        ref={drawerRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-cinza-suave/60 bg-branco shadow-header"
      >
        <div className="flex items-center justify-between border-b border-cinza-suave/40 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Seu carrinho
            </h2>
            <p className="text-xs text-foreground/60">
              {itemCount === 0
                ? "Nenhum item ainda"
                : `${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-rosa-claro"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-rosa-claro text-rosa-blush">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.6L5 3H2" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
            </div>
            <p className="font-medium text-foreground">Seu carrinho está vazio</p>
            <p className="text-sm text-foreground/60">
              Adicione seus kits e peças favoritas para começar.
            </p>
          </div>
        ) : (
          <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {items.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              return (
                <li
                  key={line.productId}
                  className="flex gap-3 rounded-3xl border border-cinza-suave/40 bg-rosa-claro/30 p-3"
                >
                  <Link
                    href={`/produto/${product.id}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-rosa-claro"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/produto/${product.id}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-medium text-foreground hover:text-rose-gold"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Remover ${product.name}`}
                        className="text-foreground/50 transition-colors hover:text-rose-gold"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                          <path d="M4 7h16M9 7V4h6v3m1 0-1 13H9L8 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <div className="flex items-center rounded-full border border-cinza-suave/50 bg-branco">
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, line.quantity - 1)}
                          aria-label={`Diminuir quantidade de ${product.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-foreground/70 transition-colors hover:text-rose-gold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, line.quantity + 1)}
                          aria-label={`Aumentar quantidade de ${product.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-foreground/70 transition-colors hover:text-rose-gold"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(product.priceCents * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}

            <li>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleApplyCoupon();
                    }
                  }}
                  placeholder="Cupom de desconto"
                  aria-label="Cupom de desconto"
                  className="w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="shrink-0 rounded-full bg-rosa-claro px-4 text-sm font-semibold text-rose-gold transition-colors hover:bg-rosa-blush hover:text-white"
                >
                  Aplicar
                </button>
              </div>

              {couponState.message && (
                <p
                  className={`mt-2 text-xs ${
                    couponState.status === "invalid"
                      ? "text-red-400"
                      : couponState.status === "applied"
                        ? "text-emerald-400"
                        : "text-foreground/60"
                  }`}
                >
                  {couponState.message}
                </p>
              )}
              {couponState.coupon && (
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="mt-1 text-xs font-medium text-rose-gold underline-offset-2 hover:underline"
                >
                  Remover cupom {couponState.coupon.code}
                </button>
              )}
            </li>
          </ul>
        )}

        <div className="border-t border-cinza-suave/40 bg-rosa-claro/20 px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-foreground/70">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            {couponState.discountCents > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Desconto ({couponState.coupon?.code})</span>
                <span>−{formatPrice(couponState.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-foreground/70">
              <span>Frete</span>
              <span>{subtotalCents >= 9900 ? "Grátis" : "Calculado no checkout"}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <span>
                {formatPrice(Math.max(0, subtotalCents - couponState.discountCents))}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            onClick={closeCart}
            className={`${primaryButton} mt-4 w-full py-3 text-sm ${
              showCheckout ? "" : "pointer-events-none opacity-40"
            }`}
          >
            {showCheckout ? "Finalizar compra" : "Carrinho vazio"}
          </Link>
        </div>
      </div>
    </div>
  );
}