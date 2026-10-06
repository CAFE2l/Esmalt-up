"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isReady: boolean;
  isOpen: boolean;
  itemCount: number;
  subtotalCents: number;
  error: string | null;
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
const STORAGE_OWNER_KEY = "esmaltup-cart-owner";
const GUEST_OWNER = "guest";
const TOAST_TIMEOUT_MS = 2800;

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
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [accountSyncUserId, setAccountSyncUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  useEffect(() => {
    if (!loaded) return;
    const owner = readStored<string>(STORAGE_OWNER_KEY);
    if (user) {
      if (owner === user.uid) {
        writeStored(STORAGE_KEY, items);
      } else if (!owner || owner === GUEST_OWNER) {
        if (!owner) writeStored(STORAGE_OWNER_KEY, GUEST_OWNER);
        writeStored(STORAGE_KEY, items);
      }
      return;
    }
    if (owner && owner !== GUEST_OWNER) return;
    if (!owner) writeStored(STORAGE_OWNER_KEY, GUEST_OWNER);
    writeStored(STORAGE_KEY, items);
  }, [items, loaded, user]);

  const syncWithAccount = useCallback(async (guestItems?: CartLine[]) => {
    if (!user || !sessionId) return;
    setAccountReady(false);
    setAccountSyncUserId(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          items: (guestItems ?? itemsRef.current).map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível sincronizar seu carrinho.");
      }
      if (Array.isArray(data.items)) {
        itemsRef.current = data.items;
        setItems(data.items);
      }
      writeStored(STORAGE_OWNER_KEY, user.uid);
      setError(null);
      setAccountReady(true);
      setAccountSyncUserId(user.uid);
    } catch (syncError) {
      const message =
        syncError instanceof Error
          ? syncError.message
          : "Não foi possível sincronizar seu carrinho.";
      setError(message);
      setToast(message);
      setAccountSyncUserId(user.uid);
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (authLoading || !sessionId) return;
    const owner = readStored<string>(STORAGE_OWNER_KEY);
    const stored = readStored<CartLine[]>(STORAGE_KEY);
    const isGuestCart = !owner || owner === GUEST_OWNER;
    const belongsToUser = !!user && owner === user.uid;
    const hydrated = (isGuestCart || belongsToUser) && Array.isArray(stored)
      ? stored
          .filter((line) => line && (line.product || getProductSync(line.productId)))
          .map((line) => ({
            ...line,
            product:
              line.product ??
              (getProductSync(line.productId)
                ? asCartProduct(getProductSync(line.productId)!)
                : undefined),
          }))
      : [];

    itemsRef.current = hydrated;
    setItems(hydrated);
    setLoaded(true);
    setAccountReady(false);
    setAccountSyncUserId(null);

    if (user) {
      void syncWithAccount(isGuestCart ? hydrated : []);
    } else if (isGuestCart) {
      writeStored(STORAGE_OWNER_KEY, GUEST_OWNER);
    }
  }, [authLoading, sessionId, syncWithAccount, user]);

  useEffect(() => {
    if (!loaded || !user || !accountReady) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/cart/sync", {
            method: "PUT",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId,
              items: items.map(({ productId, quantity }) => ({ productId, quantity })),
            }),
            signal: controller.signal,
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.error ?? "Não foi possível salvar seu carrinho.");
          }
          setError(null);
        } catch (saveError) {
          if (controller.signal.aborted) return;
          const message =
            saveError instanceof Error
              ? saveError.message
              : "Não foi possível salvar seu carrinho.";
          setError(message);
          setToast(message);
        }
      })();
    }, 400);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [accountReady, items, loaded, sessionId, user]);

  const addItem = useCallback(
    (productId: string, quantity = 1, options?: CartItemOptions) => {
      const staticProduct = getProductSync(productId);
      const product = options?.product ?? (staticProduct ? asCartProduct(staticProduct) : null);
      if (!product || quantity < 1 || product.stock <= 0) {
        const message = "Não foi possível adicionar este produto ao carrinho.";
        setError(message);
        setToast(message);
        return;
      }
      if (!user) writeStored(STORAGE_OWNER_KEY, GUEST_OWNER);
      setItems((current) => {
        const existing = current.find((line) => line.productId === productId);
        if (existing) {
          return current.map((line) =>
            line.productId === productId
              ? { ...line, product, quantity: Math.min(99, product.stock, line.quantity + quantity) }
              : line,
          );
        }
        return [...current, { productId, quantity: Math.min(99, product.stock, quantity), product }];
      });
      setError(null);
      setToast("Produto adicionado ao carrinho");
      setIsOpen(true);
    },
    [user],
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
      current.flatMap((line) => {
        if (line.productId !== productId) return [line];
        const maxQuantity = Math.min(99, line.product?.stock ?? 99);
        return maxQuantity > 0
          ? [{ ...line, quantity: Math.min(maxQuantity, quantity) }]
          : [];
      }),
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
    isReady: loaded && !authLoading && (!user || accountSyncUserId === user.uid),
    isOpen,
    itemCount,
    subtotalCents,
    error,
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

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border border-rose-gold/40 bg-branco/95 px-5 py-3 text-center text-sm font-semibold text-rose-gold shadow-card-lg"
        >
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>");
  }
  return context;
}