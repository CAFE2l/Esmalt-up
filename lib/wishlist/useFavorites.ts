"use client";

// Re-export useFavorites from FavoritesContext to avoid duplication
export { useFavorites } from "./FavoritesContext";

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
