"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";
import { type Product } from "@/lib/catalogData";
import { trackAddToWishlist } from "@/lib/analytics";
import { useAuth } from "@/lib/AuthContext";

// ============================================
// TYPES
// ============================================

interface FavoritesContextType {
  favorites: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  addFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  favoritesCount: number;
  isLoading: boolean;
  error: Error | null;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

// Storage keys
const FAVORITES_KEY = 'esmaltup_favorites';
const RECENTLY_VIEWED_KEY = 'esmaltup_recently_viewed';

// ============================================
// FAVORITES PROVIDER
// ============================================

/**
 * Favorites Provider
 * 
 * Manages favorites/wishlist state with:
 * - DB persistence for logged-in users (via Firebase)
 * - localStorage for guests
 * - Sync between localStorage and DB on login
 * - Optimistic updates for instant feedback
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load favorites from storage
  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true);
        
        if (user) {
          // TODO: Load from Firebase
          // For now, fall back to localStorage
          const stored = getLocalFavorites();
          setFavorites(stored);
        } else {
          const stored = getLocalFavorites();
          setFavorites(stored);
        }
      } catch (err) {
        setError(err as Error);
        console.error('[Favorites] Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [user, authLoading]);

  // Sync localStorage favorites to DB on login
  useEffect(() => {
    if (user && !authLoading) {
      const localFavorites = getLocalFavorites();
      if (localFavorites.length > 0) {
        // TODO: Sync to Firebase
        // For now, just merge with any existing DB favorites
        console.log('[Favorites] User logged in, sync local to DB:', localFavorites.length, 'items');
      }
    }
  }, [user, authLoading]);

  // Save favorites to storage
  const saveFavorites = useCallback((newFavorites: Product[]) => {
    if (user) {
      // TODO: Save to Firebase
      // For now, also save to localStorage as backup
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } else {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    }
    setFavorites(newFavorites);
  }, [user]);

  // Check if product is favorite
  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.some((fav) => fav.id === productId);
  }, [favorites]);

  // Add to favorites with optimistic update
  const addFavorite = useCallback(async (product: Product) => {
    if (isFavorite(product.id)) return;

    // Optimistic update
    const newFavorites = [...favorites, product];
    saveFavorites(newFavorites);

    // Track GA4 event
    trackAddToWishlist(product);

    // TODO: If user is logged in, also save to Firebase
    if (user) {
      try {
        // TODO: await saveToFirebase(user.uid, product);
      } catch (err) {
        console.error('[Favorites] Error saving to DB:', err);
        // Revert optimistic update on error
        setFavorites(favorites);
      }
    }
  }, [favorites, isFavorite, saveFavorites, user]);

  // Remove from favorites with optimistic update
  const removeFavorite = useCallback(async (productId: string) => {
    const newFavorites = favorites.filter((fav) => fav.id !== productId);
    saveFavorites(newFavorites);

    // TODO: If user is logged in, also remove from Firebase
    if (user) {
      try {
        // TODO: await removeFromFirebase(user.uid, productId);
      } catch (err) {
        console.error('[Favorites] Error removing from DB:', err);
        // Revert optimistic update on error
        setFavorites(favorites);
      }
    }
  }, [favorites, saveFavorites, user]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (product: Product) => {
    if (isFavorite(product.id)) {
      await removeFavorite(product.id);
    } else {
      await addFavorite(product);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const value: FavoritesContextType = {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    favoritesCount: favorites.length,
    isLoading: loading || authLoading,
    error,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLocalFavorites(): Product[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getLocalRecentlyViewed(): Product[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============================================
// EXPORTS
// ============================================

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export { FAVORITES_KEY, RECENTLY_VIEWED_KEY, getLocalFavorites, getLocalRecentlyViewed };
