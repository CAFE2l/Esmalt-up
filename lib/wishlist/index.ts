/**
 * Wishlist/Favorites and Recently Viewed for Esmalt'up
 * 
 * Features:
 * - Favorites/Wishlist with persistence (DB for logged users, localStorage for guests)
 * - Recently viewed products (localStorage only)
 * - Animated heart toggle with spring physics
 * - Optimistic UI updates
 * - Full GA4 tracking integration
 */

// Explicit exports to avoid star-export conflicts
export { FavoritesProvider, FavoritesContext, useFavorites, FAVORITES_KEY, RECENTLY_VIEWED_KEY, getLocalFavorites } from './FavoritesContext';
export { useFavoriteToggle, useIsFavorite, useFavoritesCount } from './useFavorites';
export { useRecentlyViewed, RecentlyViewedProvider } from './useRecentlyViewed';
export { getLocalRecentlyViewed } from './useRecentlyViewed';
export { FavoritesButton, HeartIconButton, FloatingHeartButton } from './FavoritesButton';
export { RecentlyViewedStrip } from './RecentlyViewedStrip';
