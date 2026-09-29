"use client";

import { useState, useEffect, useCallback } from "react";
import { type Product } from "@/lib/catalogData";
import { trackViewItem } from "@/lib/analytics";

const RECENTLY_VIEWED_KEY = 'esmaltup_recently_viewed';
const MAX_RECENTLY_VIEWED = 8;

/**
 * Hook to manage recently viewed products
 */
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch {
      // Ignore error
    }
  }, []);

  // Add product to recently viewed
  const addRecentlyViewed = useCallback((product: Product) => {
    try {
      const current = getLocalRecentlyViewed();
      
      // Remove if already exists
      const filtered = current.filter((p) => p.id !== product.id);
      
      // Add to beginning
      const newList = [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      
      // Save to localStorage
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newList));
      
      // Update state
      setRecentlyViewed(newList);
      
      // Track GA4 event
      trackViewItem(product);
    } catch {
      console.error('[RecentlyViewed] Error saving to localStorage');
    }
  }, []);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      setRecentlyViewed([]);
    } catch {
      console.error('[RecentlyViewed] Error clearing localStorage');
    }
  }, []);

  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
}

/**
 * Get recently viewed from localStorage
 */
export function getLocalRecentlyViewed(): Product[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Provider for recently viewed (optional - usually per-page)
 */
export function RecentlyViewedProvider({ 
  children, 
  product 
}: { 
  children: React.ReactNode; 
  product?: Product 
}) {
  const { addRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
    }
  }, [product, addRecentlyViewed]);

  return <>{children}</>;
}
