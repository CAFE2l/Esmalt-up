"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/lib/CartContext";
import { Truck, Heart, Package, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { formatPrice, getInstallments, type Product } from "@/lib/products";
import { cn } from "@/lib/cn";
import { calculateFreight, isCepComplete, lookupCep, type CepAddress } from "@/lib/shipping";

interface ProductBuyBoxProps {
  product: Product;
  onBuyNow?: () => void;
}

export default function ProductBuyBox({ product, onBuyNow }: ProductBuyBoxProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState("");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [cepAddress, setCepAddress] = useState<CepAddress | null>(null);
  const [freightResult, setFreightResult] = useState<{
    label: string;
    cents: number;
    etaDays: string;
  } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const installments = getInstallments(product.priceCents);
  const outOfStock = product.stock <= 0;
  const pixDiscount = 0.05;
  const pixPrice = Math.round(product.priceCents * (1 - pixDiscount));

  const handleCepCheck = useCallback(async () => {
    if (!isCepComplete(cep)) {
      setCepStatus("error");
      setFreightResult(null);
      return;
    }
    setCepStatus("loading");
    setFreightResult(null);
    try {
      const address = await lookupCep(cep);
      if (address?.logradouro) {
        setCepAddress(address);
        const freight = calculateFreight({
          subtotalCents: product.priceCents * quantity,
          itemCount: quantity,
        });
        setFreightResult({
          label: freight.label,
          cents: freight.cents,
          etaDays: freight.etaDays,
        });
        setCepStatus("ok");
      } else {
        setCepStatus("error");
        setFreightResult(null);
      }
    } catch {
      setCepStatus("error");
      setFreightResult(null);
    }
  }, [cep, quantity, product.priceCents]);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(product.id, quantity);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addItem(product.id, quantity);
    onBuyNow?.();
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const discountPercent = product.oldPriceCents
    ? Math.round((1 - product.priceCents / product.oldPriceCents) * 100)
    : 0;
  return (
    <div className="space-y-6">
      {/* Price block */}
      <div>
        {product.oldPriceCents && product.oldPriceCents > product.priceCents && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground/50 line-through">
              {formatPrice(product.oldPriceCents)}
            </p>
            {discountPercent > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                -{discountPercent}%
              </span>
            )}
          </div>
        )}
        <p className="text-3xl font-bold text-rose-gold sm:text-4xl">
          {formatPrice(product.priceCents)}
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          <span className="font-semibold text-emerald-400">{formatPrice(pixPrice)}</span> no Pix
          <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            -5%
          </span>
        </p>
        {installments.maxInstallments > 1 && (
          <p className="mt-1 text-sm text-foreground/70">
            ou em até {installments.maxInstallments}x de {formatPrice(installments.installmentCents)} sem juros
          </p>
        )}
      </div>

      {/* Stock status */}
      <div>
        {outOfStock ? (
          <p className="text-sm font-semibold text-red-400">Indisponível</p>
        ) : product.stock <= 5 ? (
          <p className="text-sm font-semibold text-amber-400">Últimas {product.stock} unidades</p>
        ) : (
          <p className="text-sm font-semibold text-emerald-400">Em estoque</p>
        )}
      </div>

      {/* Variants placeholder */}
      {product.variants && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Variações</p>
          <p className="text-xs text-foreground/50">Selecione a variação disponível</p>
        </div>
      )}

      {/* Quantity + Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Quantidade</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
              className="grid h-10 w-10 place-items-center rounded-full border border-cinza-suave/50 text-foreground transition-colors hover:border-rose-gold disabled:opacity-30" aria-label="Diminuir quantidade">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
              className="grid h-10 w-10 place-items-center rounded-full border border-cinza-suave/50 text-foreground transition-colors hover:border-rose-gold disabled:opacity-30" aria-label="Aumentar quantidade">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button type="button" disabled={outOfStock} onClick={handleBuyNow}
          className={cn("w-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90", outOfStock && "pointer-events-none opacity-40")}>
          Comprar agora
        </button>
        <button type="button" disabled={outOfStock} onClick={handleAddToCart}
          className={cn("w-full rounded-full border-2 border-rose-gold bg-transparent py-3 text-base font-semibold text-rose-gold transition-colors hover:bg-rose-gold hover:text-white", outOfStock && "pointer-events-none opacity-40")}>
          Adicionar ao carrinho
        </button>
        <button type="button" onClick={handleFavorite}
          className={cn("flex w-full items-center justify-center gap-2 rounded-full border border-cinza-suave/50 bg-branco py-3 text-sm font-medium text-foreground transition-colors hover:border-rose-gold hover:text-rose-gold", isFavorite && "border-rose-gold text-rose-gold")}>
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          {isFavorite ? "Nos favoritos" : "Adicionar aos favoritos"}
        </button>
      </div>
      {/* Shipping calculator */}
      <div className="rounded-3xl border border-cinza-suave/40 bg-rosa-claro/30 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Truck className="h-5 w-5 text-rosa-blush" />
          Calcule frete e prazo
        </p>
        <div className="mt-3 flex gap-2">
          <input type="text" inputMode="numeric" value={cep}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
              setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
              setCepStatus("idle");
              setFreightResult(null);
            }}
            placeholder="00000-000" aria-label="CEP"
            className="w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush" />
          <button type="button" onClick={handleCepCheck} disabled={cepStatus === "loading" || !isCepComplete(cep)}
            className="shrink-0 rounded-full bg-rosa-claro px-5 py-2.5 text-sm font-semibold text-rose-gold transition-colors hover:bg-rosa-blush hover:text-white disabled:opacity-40">
            {cepStatus === "loading" ? "..." : "OK"}
          </button>
        </div>
        {cepAddress && (
          <p className="mt-2 text-xs text-foreground/60">
            {cepAddress.logradouro}{cepAddress.complemento ? `, ${cepAddress.complemento}` : ""}
            {cepAddress.bairro ? ` - ${cepAddress.bairro}` : ""}
            {cepAddress.localidade ? ` - ${cepAddress.localidade}` : ""}
            {cepAddress.uf ? `/${cepAddress.uf}` : ""}
          </p>
        )}
        {freightResult && (
          <p className={cn("mt-2 text-xs font-medium", freightResult.cents === 0 ? "text-emerald-400" : "text-foreground/70")}>
            {freightResult.cents === 0 ? "Frete grátis!" : `${formatPrice(freightResult.cents)} - ${freightResult.etaDays}`}
          </p>
        )}
        {cepStatus === "error" && (
          <p className="mt-2 text-xs text-red-400">CEP não encontrado. Verifique e tente novamente.</p>
        )}
      </div>

      {/* Trust signals */}
      <div className="space-y-3 rounded-3xl border border-cinza-suave/40 bg-branco p-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 shrink-0 text-rose-gold" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Vendido e entregue por Esmalt&apos;up
            </p>
            <p className="text-xs text-foreground/60">
              Compra 100% segura
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 shrink-0 text-rose-gold" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Devolução grátis
            </p>
            <p className="text-xs text-foreground/60">
              Em até 7 dias após o recebimento
            </p>
          </div>
        </div>
        <div className="text-xs text-foreground/50">
          <p>Garantia de 12 meses para defeitos de fabricação.</p>
        </div>
      </div>
    </div>
  );
}
