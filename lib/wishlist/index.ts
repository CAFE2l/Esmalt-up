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

export * from './FavoritesContext';
export * from './useFavorites';
export * from './useRecentlyViewed';
export * from './FavoritesButton';
export * from './RecentlyViewedStrip';
