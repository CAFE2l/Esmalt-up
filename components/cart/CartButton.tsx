"use client";

import { useCart } from "@/lib/CartContext";

export default function CartButton() {
  const { openCart, itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-rosa-claro"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.6L5 3H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>

      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-1 text-[11px] font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}