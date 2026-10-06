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
  stock?: number;
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

interface FavoriteResponse {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
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
    throw new Error(data.error ?? "Não foi possível atualizar sua lista de desejos.");
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

  const notify = useCallback((message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      setFavorites([]);
      try {
        const token = await user.getIdToken();
        const data = await requestFavorites(token, "GET");
        if (active) setFavorites((data.favorites ?? []).map((favorite) => favorite.product));
      } catch (loadError) {
        if (active) {
          const issue = loadError instanceof Error ? loadError : new Error("Falha ao carregar favoritos.");
          setError(issue);
          notify(issue.message, "error");
          console.error("[Favorites] Error loading favorites:", issue);
        }
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
    (productId: string) => favorites.some((favorite) => favorite.id === productId || favorite.slug === productId),
    [favorites],
  );

  const runFavoriteRequest = useCallback(
    async (productId: string, method: "POST" | "DELETE", input?: FavoriteProductInput) => {
      if (!user) {
        notify("Entre em sua conta para criar sua lista de desejos.", "error");
        return;
      }
      if (pendingIds.has(productId)) return;
      setPendingIds((current) => new Set(current).add(productId));
      setError(null);
      try {
        const token = await user.getIdToken();
        const data = await requestFavorites(token, method, input?.slug ?? productId);
        if (method === "POST" && data.favorite) {
          setFavorites((current) => [
            data.favorite!.product,
            ...current.filter((favorite) => favorite.id !== data.favorite!.productId),
          ]);
          trackAddToWishlist({
            id: data.favorite.product.id,
            name: data.favorite.product.name,
          });
          notify("Produto adicionado aos favoritos");
        } else {
          setFavorites((current) =>
            current.filter((favorite) => favorite.id !== productId && favorite.slug !== productId),
          );
          notify("Produto removido dos favoritos");
        }
      } catch (requestError) {
        const issue = requestError instanceof Error
          ? requestError
          : new Error("Não foi possível atualizar os favoritos.");
        setError(issue);
        notify(issue.message, "error");
        console.error("[Favorites] Error updating favorites:", issue);
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [notify, pendingIds, user],
  );

  const addFavorite = useCallback(
    (product: FavoriteProductInput) => runFavoriteRequest(product.id, "POST", product),
    [runFavoriteRequest],
  );

  const removeFavorite = useCallback(
    (productId: string) => runFavoriteRequest(productId, "DELETE"),
    [runFavoriteRequest],
  );

  const toggleFavorite = useCallback(
    (product: FavoriteProductInput) =>
      isFavorite(product.id) ? removeFavorite(product.id) : addFavorite(product),
    [addFavorite, isFavorite, removeFavorite],
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
