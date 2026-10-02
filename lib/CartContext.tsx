"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { formatPrice, getProductSync, type Product } from "./products";
import {
  couponDiscountCents,
  type AppliedCoupon,
} from "./coupons";

export interface CartLine {
  productId: string;
  quantity: number;
  product?: CartProductSummary;
}

export interface CartProductSummary {
  id: string;
  slug: string;
  kind: "kit" | "peca";
  name: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

export interface CartItemOptions {
  variantId?: string;
  variantName?: string;
  product?: CartProductSummary;
}

export interface CouponState {
  coupon: AppliedCoupon | null;
  discountCents: number;
  status: "idle" | "applying" | "applied" | "invalid" | "error";
  message: string;
}

interface CartContextValue {
  items: CartLine[];
  sessionId: string | null;
  isOpen: boolean;
  itemCount: number;
  subtotalCents: number;
  couponState: CouponState;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity?: number, options?: CartItemOptions) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  syncWithAccount: () => Promise<void>;
  linePrice: (productId: string) => string;
}

const STORAGE_KEY = "esmaltup-cart";
const SESSION_KEY = "esmaltup-session";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function asCartProduct(product: Product): CartProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    kind: product.kind,
    name: product.name,
    priceCents: product.priceCents,
    imageUrl: product.images[0] ?? "",
    stock: product.stock,
  };
}

function readStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage indisponível (ex.: modo privado) */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [couponState, setCouponState] = useState<CouponState>({
    coupon: null,
    discountCents: 0,
    status: "idle",
    message: "",
  });

  useEffect(() => {
    let session = readStored<string>(SESSION_KEY);
    if (!session) {
      session =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    setSessionId(session);
    writeStored(SESSION_KEY, session);

    const stored = readStored<CartLine[]>(STORAGE_KEY);
    if (Array.isArray(stored)) {
      setItems(
        stored
          .filter((line) => line && (line.product || getProductSync(line.productId)))
          .map((line) => ({
            ...line,
            product:
              line.product ??
              (getProductSync(line.productId)
                ? asCartProduct(getProductSync(line.productId)!)
                : undefined),
          })),
      );
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStored(STORAGE_KEY, items);
  }, [items, loaded]);

  const syncWithAccount = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, items }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      }
    } catch {
      /* o carrinho local continua valendo em caso de falha de rede */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId]);

  useEffect(() => {
    if (loaded) void syncWithAccount();
  }, [loaded, user, syncWithAccount]);

  const addItem = useCallback(
    (productId: string, quantity = 1, options?: CartItemOptions) => {
      const staticProduct = getProductSync(productId);
      const product = options?.product ?? (staticProduct ? asCartProduct(staticProduct) : null);
      if (!product || quantity < 1) return;
      setItems((current) => {
        const existing = current.find((line) => line.productId === productId);
        if (existing) {
          return current.map((line) =>
            line.productId === productId
              ? { ...line, product, quantity: Math.min(99, line.quantity + quantity) }
              : line,
          );
        }
        return [...current, { productId, quantity, product }];
      });
      setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((current) => current.filter((line) => line.productId !== productId));
      return;
    }
    setItems((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(99, quantity) }
          : line,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponState({ coupon: null, discountCents: 0, status: "idle", message: "" });
  }, []);

  const { itemCount, subtotalCents } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const line of items) {
      const product = line.product ?? (getProductSync(line.productId) ? asCartProduct(getProductSync(line.productId)!) : null);
      if (!product) continue;
      count += line.quantity;
      subtotal += product.priceCents * line.quantity;
    }
    return { itemCount: count, subtotalCents: subtotal };
  }, [items]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setCouponState((current) => ({
        ...current,
        status: "applying",
        message: "Validando cupom...",
      }));

      let coupon: AppliedCoupon | null = null;
      let error = "";
      try {
        const response = await fetch("/api/coupons/apply", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });
        const data = await response.json();
        if (response.ok && data.coupon) {
          coupon = data.coupon as AppliedCoupon;
        } else {
          error = data.error ?? "Cupom inválido ou expirado.";
        }
      } catch {
        error = "Não foi possível validar o cupom agora.";
      }

      if (!coupon) {
        setCouponState({
          coupon: null,
          discountCents: 0,
          status: "invalid",
          message: error || "Cupom inválido.",
        });
        return;
      }

      setCouponState({
        coupon,
        discountCents: couponDiscountCents(coupon, subtotalCents),
        status: "applied",
        message: `Cupom ${coupon.code} aplicado (${coupon.label}).`,
      });
    },
    [subtotalCents],
  );

  const removeCoupon = useCallback(() => {
    setCouponState({ coupon: null, discountCents: 0, status: "idle", message: "" });
  }, []);

  const linePrice = useCallback((productId: string) => {
    const product =
      items.find((line) => line.productId === productId)?.product ??
      (getProductSync(productId) ? asCartProduct(getProductSync(productId)!) : null);
    return product ? formatPrice(product.priceCents) : "";
  }, [items]);

  const value: CartContextValue = {
    items,
    sessionId,
    isOpen,
    itemCount,
    subtotalCents,
    couponState,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    syncWithAccount,
    linePrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>");
  }
  return context;
}