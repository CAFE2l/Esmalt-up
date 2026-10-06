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
import { useAuth } from "@/lib/AuthContext";
import { trackAddToWishlist } from "@/lib/analytics";

export interface FavoriteProduct {
  id: string;
  slug: string;
  kind: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  stock: number;
  images: string[];
  featured: boolean;
}

export type FavoriteProductInput = Pick<
  FavoriteProduct,
  "id" | "name" | "kind" | "category" | "priceCents"
> & {
  slug?: string;
  description?: string;
  stock?: number;
  featured?: boolean;
  images?: string[];
  imageUrl?: string;
};

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: FavoriteProductInput) => Promise<void>;
  addFavorite: (product: FavoriteProductInput) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  favoritesCount: number;
  isLoading: boolean;
  pendingIds: Set<string>;
  error: Error | null;
}

export const FavoritesContext = createContext<FavoritesContextType | null>(null);
export const RECENTLY_VIEWED_KEY = "esmaltup_recently_viewed";
const FAVORITES_STORAGE_KEY = "esmaltup-favorites";

interface FavoriteResponse {
  productId: string;
  product: FavoriteProduct;
}

function normalizeFavorite(product: FavoriteProductInput): FavoriteProduct {
  return {
    id: product.id,
    slug: product.slug ?? product.id,
    kind: product.kind,
    name: product.name,
    description: product.description ?? "",
    priceCents: product.priceCents,
    category: product.category,
    stock: product.stock ?? 0,
    images: product.images ?? (product.imageUrl ? [product.imageUrl] : []),
    featured: product.featured ?? false,
  };
}

function readFavorites(): FavoriteProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const value: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(value) ? value as FavoriteProduct[] : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteProduct[]) {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("[Favorites] Não foi possível salvar favoritos neste dispositivo.", error);
  }
}

async function requestFavorites(
  token: string,
  method: "GET" | "POST" | "DELETE",
  productId?: string,
): Promise<{ favorites?: FavoriteResponse[]; favorite?: FavoriteResponse }> {
  const response = await fetch("/api/favorites", {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(method !== "GET" ? { "content-type": "application/json" } : {}),
    },
    ...(method !== "GET" ? { body: JSON.stringify({ productId }) } : {}),
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    favorites?: FavoriteResponse[];
    favorite?: FavoriteResponse;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível atualizar seus favoritos.");
  }
  return data;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<Error | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const favoritesRef = useRef(favorites);
  const pendingRef = useRef(new Set<string>());

  const notify = useCallback((message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
  }, []);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      const guestFavorites = readFavorites();
      if (!user) {
        setFavorites(guestFavorites);
        setLoading(false);
        return;
      }

      setFavorites(guestFavorites);
      try {
        const token = await user.getIdToken();
        const existing = await requestFavorites(token, "GET");
        const merged = new Map(
          (existing.favorites ?? []).map(({ product }) => [product.id, product]),
        );

        for (const guestFavorite of guestFavorites) {
          const identifier = guestFavorite.slug || guestFavorite.id;
          await requestFavorites(token, "POST", identifier);
        }

        const refreshed = guestFavorites.length
          ? await requestFavorites(token, "GET")
          : existing;
        for (const { product } of refreshed.favorites ?? []) merged.set(product.id, product);
        if (!active) return;
        setFavorites(Array.from(merged.values()));
        saveFavorites([]);
      } catch (loadError) {
        if (!active) return;
        const issue = loadError instanceof Error
          ? loadError
          : new Error("Não foi possível carregar seus favoritos.");
        setError(issue);
        notify(issue.message, "error");
        console.error("[Favorites] Erro ao carregar ou sincronizar favoritos.", issue);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [authLoading, notify, user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isFavorite = useCallback(
    (productId: string) =>
      favorites.some((favorite) => favorite.id === productId || favorite.slug === productId),
    [favorites],
  );

  const runFavoriteRequest = useCallback(
    async (input: FavoriteProductInput, shouldAdd: boolean) => {
      const product = normalizeFavorite(input);
      const key = product.id;
      if (pendingRef.current.has(key)) return;
      pendingRef.current.add(key);
      setPendingIds(new Set(pendingRef.current));

      const previous = favoritesRef.current;
      const wasFavorite = previous.some(
        (favorite) => favorite.id === key || favorite.slug === product.slug,
      );
      if (shouldAdd === wasFavorite) {
        pendingRef.current.delete(key);
        setPendingIds(new Set(pendingRef.current));
        return;
      }

      const optimistic = shouldAdd
        ? [product, ...previous.filter((favorite) => favorite.id !== key && favorite.slug !== product.slug)]
        : previous.filter((favorite) => favorite.id !== key && favorite.slug !== product.slug);
      favoritesRef.current = optimistic;
      setFavorites(optimistic);
      setError(null);
      notify(shouldAdd ? "Adicionado aos favoritos" : "Removido dos favoritos");

      try {
        if (user) {
          const token = await user.getIdToken();
          await requestFavorites(token, shouldAdd ? "POST" : "DELETE", product.slug || product.id);
          if (shouldAdd) {
            trackAddToWishlist({ id: product.id, name: product.name });
          }
        } else {
          saveFavorites(optimistic);
          if (shouldAdd) trackAddToWishlist({ id: product.id, name: product.name });
        }
      } catch (requestError) {
        const issue = requestError instanceof Error
          ? requestError
          : new Error("Não foi possível atualizar seus favoritos.");
        const rollback = favoritesRef.current.some(
          (favorite) => favorite.id === key || favorite.slug === product.slug,
        ) === shouldAdd
          ? [
              ...favoritesRef.current.filter(
                (favorite) => favorite.id !== key && favorite.slug !== product.slug,
              ),
              ...(wasFavorite ? previous.filter((favorite) => favorite.id === key || favorite.slug === product.slug) : []),
            ]
          : favoritesRef.current;
        favoritesRef.current = rollback;
        setFavorites(rollback);
        setError(issue);
        notify(issue.message, "error");
        console.error("[Favorites] Erro ao salvar favorito.", issue);
      } finally {
        pendingRef.current.delete(key);
        setPendingIds(new Set(pendingRef.current));
      }
    },
    [notify, user],
  );

  const addFavorite = useCallback(
    (product: FavoriteProductInput) => runFavoriteRequest(product, true),
    [runFavoriteRequest],
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      const product = favoritesRef.current.find(
        (favorite) => favorite.id === productId || favorite.slug === productId,
      );
      return product
        ? runFavoriteRequest(product, false)
        : Promise.resolve();
    },
    [runFavoriteRequest],
  );

  const toggleFavorite = useCallback(
    (product: FavoriteProductInput) => {
      const isSaved = favoritesRef.current.some(
        (favorite) => favorite.id === product.id || favorite.slug === product.slug,
      );
      return runFavoriteRequest(product, !isSaved);
    },
    [runFavoriteRequest],
  );

  const value = useMemo<FavoritesContextType>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      favoritesCount: favorites.length,
      isLoading: loading || authLoading,
      pendingIds,
      error,
    }),
    [addFavorite, authLoading, error, favorites, isFavorite, loading, pendingIds, removeFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role={toast.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border px-5 py-3 text-center text-sm font-medium shadow-card-lg backdrop-blur-xl ${
            toast.kind === "error"
              ? "border-red-400/40 bg-branco/95 text-red-600"
              : "border-rose-gold/40 bg-branco/95 text-rose-gold"
          }`}
        >
          {toast.message}
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
