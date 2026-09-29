"use client";

import { useContext } from "react";
import { FavoritesContext } from "./FavoritesContext";

/**
 * Hook to access favorites context
 */
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

/**
 * Hook to check if a product is favorited and toggle it
 */
export function useFavoriteToggle(productId: string) {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  
  return {
    isFavorite: isFavorite(productId),
    toggleFavorite,
    isLoading,
  };
}

/**
 * Hook to get favorite status for a product
 */
export function useIsFavorite(productId: string): boolean {
  const { isFavorite } = useFavorites();
  return isFavorite(productId);
}

/**
 * Hook to get favorites count
 */
export function useFavoritesCount(): number {
  const { favoritesCount } = useFavorites();
  return favoritesCount;
}
