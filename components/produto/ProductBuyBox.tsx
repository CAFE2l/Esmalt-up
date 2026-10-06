"use client";

import { useState, useCallback, useMemo } from "react";
import { useCart } from "@/lib/CartContext";
import {
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  Clock,
  Check,
  ShoppingCart,
  CreditCard,
  Banknote,
  MessageCircle,
  X,
} from "lucide-react";
import {
  formatPrice,
  getInstallments,
  type Product,
  type ProductOptionGroup,
} from "@/lib/products";
import { calculateFreight, isCepComplete, lookupCep, type CepAddress } from "@/lib/shipping";
import { cn } from "@/lib/cn";
import { getPrimaryProductImage } from "@/lib/products";
import { FavoritesButton } from "@/lib/wishlist";

interface ProductBuyBoxProps {
  product: Product;
  onBuyNow?: () => void;
  onVariantChange?: (variant: {
    variantId: string | null;
    variantName: string | null;
    imageUrl: string | null;
    priceCents: number;
    stock: number;
  }) => void;
  userHasPurchased?: boolean; // For review eligibility
  reviewCount?: number;
  ratingAvg?: number | null;
}

// NEW: Variant Selector Component
function VariantSelector({
  optionGroups,
  selectedOptions,
  onSelectOption,
  currentPrice,
  currentStock,
  currentEstimatedDelivery,
}: {
  optionGroups: ProductOptionGroup[];
  selectedOptions: Record<string, string>;
  onSelectOption: (groupName: string, optionId: string) => void;
  currentPrice: number;
  currentStock: number;
  currentEstimatedDelivery: string;
}) {
  if (!optionGroups || optionGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      {optionGroups.map((group) => (
        <div key={group.name} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
          
          {group.type === "color" && group.options.some(opt => opt.color) ? (
            // Color swatches
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedOptions[group.name] === option.id;
                const outOfStock = option.stock <= 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !outOfStock && onSelectOption(group.name, option.id)}
                    disabled={outOfStock}
                    aria-label={`${option.name}${outOfStock ? ' (Indisponível)' : ''}`}
                    className={cn(
                      "relative h-12 w-12 rounded-full border-2 transition-all duration-200",
                      isSelected 
                        ? "border-rose-gold ring-2 ring-rose-gold/20" 
                        : "border-cinza-suave/50 hover:border-rose-gold/40",
                      outOfStock && "opacity-40 cursor-not-allowed"
                    )}
                    style={option.color ? { backgroundColor: option.color } : {}}
                  >
                    {option.color && !isSelected && (
                      <div className="inset-0 rounded-full border border-foreground/10" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : group.type === "size" || group.type === "voltage" ? (
            // Card selectors for size/voltage
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedOptions[group.name] === option.id;
                const outOfStock = option.stock <= 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !outOfStock && onSelectOption(group.name, option.id)}
                    disabled={outOfStock}
                    className={cn(
                      "flex items-center justify-center rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-200",
                      isSelected 
                        ? "border-rose-gold bg-rosa-claro/40 text-rose-gold" 
                        : "border-cinza-suave/50 text-foreground hover:border-rose-gold/40",
                      outOfStock && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {option.name}
                    {group.type === "voltage" && option.name.includes("V") && (
                      <span className="ml-1 text-xs">{option.name.replace("V", "V ")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : group.type === "version" ? (
            // Version cards (Professional/Beginner)
            <div className="grid grid-cols-2 gap-2">
              {group.options.map((option) => {
                const isSelected = selectedOptions[group.name] === option.id;
                const outOfStock = option.stock <= 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !outOfStock && onSelectOption(group.name, option.id)}
                    disabled={outOfStock}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200",
                      isSelected 
                        ? "border-rose-gold bg-rosa-claro/40" 
                        : "border-cinza-suave/50 hover:border-rose-gold/40",
                      outOfStock && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span className="text-lg font-bold text-foreground">{option.name}</span>
                    {option.description && (
                      <span className="text-xs text-foreground/60">{option.description}</span>
                    )}
                    <span className="text-sm font-semibold text-rose-gold">
                      {formatPrice(option.priceCents)}
                    </span>
                    {outOfStock && (
                      <span className="text-xs text-red-400">Indisponível</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Default dropdown fallback
            <select
              value={selectedOptions[group.name] || ""}
              onChange={(e) => onSelectOption(group.name, e.target.value)}
              className="w-full rounded-xl border border-cinza-suave/50 bg-branco px-3 py-2 text-sm text-foreground focus:border-rose-gold focus:outline-none"
            >
              <option value="" disabled>
                Selecione {group.name}
              </option>
              {group.options.map((option) => (
                <option key={option.id} value={option.id} disabled={option.stock <= 0}>
                  {option.name} - {formatPrice(option.priceCents)}
                </option>
              ))}
            </select>
          )}

          {/* Instant feedback for selection */}
          {selectedOptions[group.name] && (
            <div className="mt-2 p-2 rounded-xl bg-rosa-claro/20 text-xs text-foreground/60">
              {group.options.find(opt => opt.id === selectedOptions[group.name])?.description}
            </div>
          )}
        </div>
      ))}

      {/* Price and availability update based on selection */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-rosa-claro/30 border border-rose-gold/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Preço selecionado:</span>
              <span className="text-xl font-bold text-rose-gold">
                {formatPrice(currentPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Disponibilidade:</span>
              {currentStock <= 0 ? (
                <span className="text-sm font-semibold text-red-400">Indisponível</span>
              ) : currentStock <= 5 ? (
                <span className="text-sm font-semibold text-amber-400">Últimas {currentStock} unidades</span>
              ) : (
                <span className="text-sm font-semibold text-emerald-400">Em estoque</span>
              )}
            </div>
            {currentEstimatedDelivery && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/60">Entrega estimada:</span>
                <span className="text-sm font-medium text-foreground">{currentEstimatedDelivery}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Trust Section Component
function TrustSection() {
  const trustItems = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Compra Segura",
      description: "Plataforma 100% segura com criptografia SSL",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Entrega Rastreada",
      description: "Acompanhe seu pedido em tempo real",
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Devolução Garantida",
      description: "Devolução grátis em até 7 dias",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Garantia de Qualidade",
      description: "Produtos testados e aprovados por profissionais",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Suporte Especializado",
      description: "Atendimento rápido e personalizado",
    },
  ];

  return (
    <div className="rounded-2xl border border-cinza-suave/40 bg-branco p-6">
      <h3 className="text-lg font-bold text-foreground mb-4">
        <span className="bg-gradient-to-r from-rosa-blush to-rose-gold bg-clip-text text-transparent">
          Por que comprar conosco?
        </span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {trustItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="mb-2 p-3 rounded-full bg-rosa-claro/40 text-rose-gold">
              {item.icon}
            </div>
            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
            <p className="text-xs text-foreground/60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// NEW: Social Proof Component
function SocialProof({
  ratingAvg,
  reviewCount,
}: {
  ratingAvg: number | null;
  reviewCount: number;
}) {
  return (
    <div className="space-y-4">
      {/* Rating and Reviews */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-cinza-suave/40 bg-branco">
        <div className="flex items-center gap-2">
          {ratingAvg ? (
            <>
              <span className="text-3xl font-bold text-rose-gold">{ratingAvg.toFixed(1)}</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(ratingAvg) ? "text-rose-gold fill-current" : "text-foreground/20"}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <span className="text-2xl font-bold text-foreground/60">Novo</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
      </div>
    </div>
  );
}

// NEW: Enhanced Quantity Selector
function EnhancedQuantitySelector({
  value,
  onChange,
  max,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground">Quantidade</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => value > 1 && onChange(value - 1)}
          disabled={value <= 1 || disabled}
          aria-label="Diminuir quantidade"
          className="grid h-10 w-10 place-items-center rounded-full border border-cinza-suave/50 text-foreground transition-colors hover:border-rose-gold disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] text-center text-sm font-semibold text-foreground bg-rosa-claro/40 px-3 py-2 rounded-full">
          {value}
        </span>
        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max || disabled}
          aria-label="Aumentar quantidade"
          className="grid h-10 w-10 place-items-center rounded-full border border-cinza-suave/50 text-foreground transition-colors hover:border-rose-gold disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <span className="text-xs text-foreground/50">
        Mín. 1 / Máx. {max}
      </span>
    </div>
  );
}

// Main Component
export default function ProductBuyBox({
  product,
  onBuyNow,
  onVariantChange,
  userHasPurchased = false,
  reviewCount = 0,
  ratingAvg = null,
}: ProductBuyBoxProps) {
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

  // Variant state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  // Track if user can review this product
  const canReview = userHasPurchased;

  // Calculate current variant based on selections
  const currentVariant = useMemo(() => {
    if (!product.optionGroups || Object.keys(selectedOptions).length === 0) {
      return null; // No variants selected or no variants available
    }
    
    // Find the variant that matches all selected options
    for (const group of product.optionGroups) {
      const selectedOptionId = selectedOptions[group.name];
      if (selectedOptionId) {
        const selectedOption = group.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption) {
          return selectedOption;
        }
      }
    }
    return null;
  }, [product.optionGroups, selectedOptions]);

  // Calculate effective price based on variant selection
  const effectivePrice = useMemo(() => {
    if (currentVariant) {
      return currentVariant.priceCents;
    }
    return product.priceCents;
  }, [currentVariant, product.priceCents]);

  // Calculate effective stock based on variant selection
  const effectiveStock = useMemo(() => {
    if (currentVariant) {
      return currentVariant.stock;
    }
    return product.stock;
  }, [currentVariant, product.stock]);

  // Calculate effective estimated delivery
  const effectiveEstimatedDelivery = useMemo(() => {
    if (currentVariant?.estimatedDelivery) {
      return currentVariant.estimatedDelivery;
    }
    return product.specs?.find(spec => spec.label.toLowerCase().includes('entrega'))?.value || "3-5 dias úteis";
  }, [currentVariant, product.specs]);

  const outOfStock = effectiveStock <= 0;
  const installments = getInstallments(effectivePrice);
  const pixDiscount = 0.05;
  const pixPrice = Math.round(effectivePrice * (1 - pixDiscount));
  const discountPercent = product.oldPriceCents
    ? Math.round((1 - effectivePrice / product.oldPriceCents) * 100)
    : 0;

  // Handle variant option selection
  const handleSelectOption = useCallback((groupName: string, optionId: string) => {
    const selected = product.optionGroups
      ?.find((group) => group.name === groupName)
      ?.options.find((option) => option.id === optionId);
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: optionId
    }));
    setQuantity(1); // Reset quantity when variant changes
    onVariantChange?.({
      variantId: selected?.id ?? null,
      variantName: selected?.name ?? null,
      imageUrl: selected?.imageUrl ?? null,
      priceCents: selected?.priceCents ?? product.priceCents,
      stock: selected?.stock ?? product.stock,
    });
  }, [onVariantChange, product.optionGroups, product.priceCents, product.stock]);

  // Handle CEP lookup
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
          subtotalCents: effectivePrice * quantity,
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
  }, [cep, quantity, effectivePrice]);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(Math.max(1, Math.min(effectiveStock, newQuantity)));
  }, [effectiveStock]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(product.id, quantity, {
      variantId: currentVariant?.id,
      variantName: currentVariant?.name,
      product: {
        id: product.id,
        slug: product.slug,
        kind: product.kind,
        name: product.name,
        priceCents: effectivePrice,
        imageUrl: getPrimaryProductImage(product),
        stock: effectiveStock,
      },
    });
  };

  // Handle buy now
  const handleBuyNowClick = () => {
    if (outOfStock) return;
    addItem(product.id, quantity, {
      variantId: currentVariant?.id,
      variantName: currentVariant?.name,
      product: {
        id: product.id,
        slug: product.slug,
        kind: product.kind,
        name: product.name,
        priceCents: effectivePrice,
        imageUrl: getPrimaryProductImage(product),
        stock: effectiveStock,
      },
    });
    onBuyNow?.();
  };

  return (
    <div className="space-y-6">
      {/* PRICE BLOCK - Enhanced with better hierarchy */}
      <div className="rounded-2xl border border-rose-gold/25 bg-rosa-claro/30 p-4">
        <div className="space-y-3">
          {/* Original price and discount */}
          {product.oldPriceCents && product.oldPriceCents > effectivePrice && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground/50 line-through">
                {formatPrice(product.oldPriceCents)}
              </p>
              {discountPercent > 0 && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>
          )}

          {/* Main price */}
          <p className="text-3xl font-bold text-rose-gold sm:text-4xl">
            {formatPrice(effectivePrice)}
          </p>

          {/* PIX discount */}
          <p className="text-sm text-foreground/70">
            <span className="font-semibold text-emerald-400">{formatPrice(pixPrice)}</span> no Pix
            <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              -5% de desconto
            </span>
          </p>

          {/* Installments */}
          {installments.maxInstallments > 1 && (
            <p className="text-sm text-foreground/70">
              ou em até <strong>{installments.maxInstallments}x</strong> de <strong>{formatPrice(installments.installmentCents)}</strong> sem juros
            </p>
          )}

          {/* Credit card info */}
          <p className="text-xs text-foreground/50 flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Parcele no cartão em até {installments.maxInstallments}x
          </p>
        </div>
      </div>

      {/* STOCK STATUS */}
      <div className="p-3 rounded-xl bg-branco border border-cinza-suave/40">
        {outOfStock ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-red-400">
            <X className="h-4 w-4" /> Indisponível
          </p>
        ) : effectiveStock <= 5 ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-400">
            <Clock className="h-4 w-4" /> Últimas {effectiveStock} unidades!
          </p>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <Check className="h-4 w-4" /> Em estoque
          </p>
        )}
      </div>

      {/* VARIANT SELECTORS */}
      {product.optionGroups && product.optionGroups.length > 0 && (
        <VariantSelector
          optionGroups={product.optionGroups}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
          currentPrice={effectivePrice}
          currentStock={effectiveStock}
          currentEstimatedDelivery={effectiveEstimatedDelivery}
        />
      )}

      {/* QUANTITY SELECTOR */}
      <EnhancedQuantitySelector
        value={quantity}
        onChange={handleQuantityChange}
        max={effectiveStock}
        disabled={outOfStock}
      />

      {/* ACTION BUTTONS */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleBuyNowClick}
          className={cn(
            "w-full rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
            outOfStock && "pointer-events-none opacity-40"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Banknote className="h-4 w-4" />
            Comprar agora
          </span>
        </button>

        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAddToCart}
          className={cn(
            "w-full rounded-full border-2 border-rose-gold bg-transparent py-3.5 text-center text-sm font-semibold text-rose-gold transition-all duration-200 hover:bg-rose-gold hover:text-white hover:shadow-lg",
            outOfStock && "pointer-events-none opacity-40"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Adicionar ao carrinho
          </span>
        </button>

        <FavoritesButton
          product={product}
          showText
          className="w-full py-3 text-sm font-medium"
        />
      </div>

      {/* SHIPPING CALCULATOR */}
      <div className="rounded-2xl border border-cinza-suave/40 bg-branco p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Truck className="h-5 w-5 text-rosa-blush" />
          Calcule frete e prazo
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={cep}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
              setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
              setCepStatus("idle");
              setFreightResult(null);
            }}
            placeholder="00000-000"
            aria-label="CEP"
            className="w-full rounded-full border border-cinza-suave/50 bg-rosa-claro/40 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rose-gold"
          />
          <button
            type="button"
            onClick={handleCepCheck}
            disabled={cepStatus === "loading" || !isCepComplete(cep)}
            className="shrink-0 rounded-full bg-rosa-claro px-5 py-2.5 text-sm font-semibold text-rose-gold transition-colors hover:bg-rosa-blush hover:text-white disabled:opacity-40"
          >
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

      {/* TRUST SECTION */}
      <TrustSection />

      {/* SOCIAL PROOF */}
      <SocialProof
        ratingAvg={ratingAvg}
        reviewCount={reviewCount}
      />

      {/* REVIEW ELIGIBILITY NOTICE */}
      <div className="p-4 rounded-2xl border border-rose-gold/25 bg-rosa-claro/30 text-center">
        {canReview ? (
          <p className="text-sm text-foreground">
            <span className="font-semibold">Você comprou este produto!</span>
            <br />
            <button
              onClick={() => document.getElementById("avaliacoes")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-2 inline-flex items-center gap-1 text-rose-gold font-medium hover:text-rosa-blush"
            >
              <Star className="h-4 w-4" />
              Escrever avaliação
            </button>
          </p>
        ) : (
          <p className="text-xs text-foreground/60">
            Somente clientes que compraram este produto podem avaliá-lo.
          </p>
        )}
      </div>
    </div>
  );
}