"use client";

/**
 * Google Analytics 4 Tracking for Esmalt'up
 * 
 * Implements GA4 with Consent Mode v2, respecting LGPD/CCPA.
 * Only loads after user consent (analytics_storage denied by default).
 */

import Script from 'next/script';
import { useEffect, useState, useCallback, useContext, createContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface GA4EventParams {
  [key: string]: string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>[];
}

export interface ConsentState {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
}

export const DEFAULT_CONSENT: ConsentState = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};

// ============================================
// TRACKING CORE
// ============================================

let gaInitialized = false;
const lastEvent = new Map<string, number>();

function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_GA_DEBUG === 'true';
}

export function getGAID(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_ID;
}

export function isGAConfigured(): boolean {
  return !!getGAID();
}

function getEventKey(eventName: string, params: GA4EventParams): string {
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');
  return `${eventName}:${sortedParams}`;
}

function shouldSendEvent(key: string, minIntervalMs: number = 1000): boolean {
  const lastSent = lastEvent.get(key) || 0;
  const now = Date.now();
  if (now - lastSent < minIntervalMs) {
    if (isDebugMode()) console.log('[GA4 Debug] Duplicate event blocked:', key);
    return false;
  }
  lastEvent.set(key, now);
  return true;
}

export function sendGA4Event(eventName: string, params: GA4EventParams = {}): void {
  if (!gaInitialized || !isGAConfigured()) return;

  const eventKey = getEventKey(eventName, params);
  if (!shouldSendEvent(eventKey)) return;

  const eventParams = { ...params, ...(isDebugMode() ? { debug_mode: true } : {}) };

  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, eventParams);
    if (isDebugMode()) console.log('[GA4 Debug]', { event: eventName, params, timestamp: new Date().toISOString() });
  }
}

export function initializeGA4(consent: ConsentState = DEFAULT_CONSENT): void {
  const gaId = getGAID();
  if (!gaId || gaInitialized) return;

  gaInitialized = true;

  if (typeof window !== 'undefined') {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; gtagQ?: unknown[][] };
    w.gtag = w.gtag || function(...args: unknown[]) {
      (w.gtagQ = w.gtagQ || []).push(args);
    };
    w.gtag('consent', 'default', consent);
    
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.onload = () => {
      w.gtag!('config', gaId, isDebugMode() ? { debug_mode: true } : {});
      console.log('[GA4] Initialized');
    };
    script.onerror = () => console.error('[GA4] Failed to load gtag.js');
    document.head.appendChild(script);
  }
}

export function updateConsent(newConsent: Partial<ConsentState>): void {
  const consent: ConsentState = { ...DEFAULT_CONSENT, ...newConsent };
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('consent', 'update', consent);
  }
  if (consent.analytics_storage === 'granted' && !gaInitialized) {
    initializeGA4(consent);
  }
}

// ============================================
// TRACKING HELPERS
// ============================================

export function trackPageView(path: string, title?: string): void {
  sendGA4Event('page_view', { page_path: path, ...(title && { page_title: title }) });
}

interface TrackableItem {
  id: string;
  name: string;
  category?: string;
  priceCents?: number;
}

export function trackViewItemList(itemListName: string, items: TrackableItem[] = [], params?: GA4EventParams): void {
  sendGA4Event('view_item_list', {
    item_list_name: itemListName,
    item_list_id: itemListName,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      ...(item.category ? { item_category: item.category } : {}),
    })),
    ...params,
  });
}

export function trackSelectItem(item: TrackableItem, itemListName: string, index?: number, params?: GA4EventParams): void {
  sendGA4Event('select_item', {
    item_list_name: itemListName,
    item_id: item.id,
    item_name: item.name,
    ...(index !== undefined && { index }),
    ...(item.category && { item_category: item.category }),
    ...params,
  });
}

export function trackViewItem(item: TrackableItem, params?: GA4EventParams): void {
  sendGA4Event('view_item', {
    item_id: item.id,
    item_name: item.name,
    ...(item.category && { item_category: item.category }),
    ...(item.priceCents && { price: item.priceCents / 100 }),
    ...params,
  });
}

export function trackAddToWishlist(item: TrackableItem, params?: GA4EventParams): void {
  sendGA4Event('add_to_wishlist', {
    item_id: item.id,
    item_name: item.name,
    ...(item.category && { item_category: item.category }),
    ...params,
  });
}

export function trackSearch(searchTerm: string, params?: GA4EventParams): void {
  sendGA4Event('search', { search_term: searchTerm, ...params });
}

export function trackFilterApply(filterType: string, filterValue: string, params?: GA4EventParams): void {
  sendGA4Event('filter_apply', { filter_type: filterType, filter_value: filterValue, ...params });
}

export function trackCarouselInteract(carouselId: string, action: 'next' | 'prev' | 'drag' | 'dot' | 'autoplay_stop', slideIndex?: number, params?: GA4EventParams): void {
  sendGA4Event('carousel_interact', {
    carousel_id: carouselId,
    action,
    ...(slideIndex !== undefined && { slide_index: slideIndex }),
    ...params,
  });
}

export function trackScrollDepth(depth: 25 | 50 | 75 | 90, path: string, params?: GA4EventParams): void {
  sendGA4Event('scroll_depth', { scroll_depth: depth, page_path: path, ...params });
}

export function trackCTAClick(ctaId: string, location: string, params?: GA4EventParams): void {
  sendGA4Event('cta_click', { cta_id: ctaId, location, ...params });
}

export function trackSignUp(method?: string, params?: GA4EventParams): void {
  sendGA4Event('sign_up', { ...(method && { method }), ...params });
}

export function trackLogin(method?: string, params?: GA4EventParams): void {
  sendGA4Event('login', { ...(method && { method }), ...params });
}

export function trackQuickViewOpen(item: TrackableItem, params?: GA4EventParams): void {
  sendGA4Event('quick_view_open', {
    item_id: item.id,
    item_name: item.name,
    ...(item.category && { item_category: item.category }),
    ...params,
  });
}

export function trackEvent<T extends string>(name: T, params: GA4EventParams = {}): void {
  sendGA4Event(name, params);
}

// ============================================
// NEXT.JS COMPONENTS
// ============================================

export function GA4Script() {
  const gaId = getGAID();
  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}'` + (isDebugMode() ? `, { debug_mode: true }` : ``) + `);
        `}
      </Script>
    </>
  );
}

export function useTrackRouteChanges() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isGAConfigured()) {
      const path = pathname + searchParams.toString();
      trackPageView(path);
    }
  }, [pathname, searchParams]);
}

export function TrackRouteChanges() {
  useTrackRouteChanges();
  return null;
}

// ============================================
// SCROLL DEPTH TRACKING
// ============================================

export function useTrackScrollDepth() {
  const pathname = usePathname();
  const [trackedDepths, setTrackedDepths] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isGAConfigured() || typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollY / totalHeight) * 100);

      [25, 50, 75, 90].forEach((depth) => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackScrollDepth(depth as 25 | 50 | 75 | 90, pathname);
          setTrackedDepths((prev) => new Set(prev).add(depth));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, trackedDepths]);
}

export function ScrollDepthTracker() {
  useTrackScrollDepth();
  return null;
}

// ============================================
// CONSENT MANAGEMENT
// ============================================

export function getConsentState(): ConsentState {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ga4_consent');
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_CONSENT; }
    }
  }
  return DEFAULT_CONSENT;
}

export function saveConsentState(consent: ConsentState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ga4_consent', JSON.stringify(consent));
    updateConsent(consent);
  }
}

export function grantAnalyticsConsent(): void {
  const consent: ConsentState = { ...DEFAULT_CONSENT, analytics_storage: 'granted' };
  saveConsentState(consent);
  initializeGA4(consent);
}

export function denyConsent(): void {
  saveConsentState(DEFAULT_CONSENT);
}

// ============================================
// CONSENT HOOK
// ============================================

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setConsent(getConsentState());
      const handleStorageChange = () => setConsent(getConsentState());
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  return {
    consent,
    hasAnalytics: consent.analytics_storage === 'granted',
    grant: grantAnalyticsConsent,
    deny: denyConsent,
  };
}

// ============================================
// CONSENT CONTEXT
// ============================================

type ConsentContextType = {
  consent: ConsentState;
  hasAnalytics: boolean;
  grant: () => void;
  deny: () => void;
};

const ConsentContext = createContext<ConsentContextType | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const consentHook = useConsent();
  return (
    <ConsentContext.Provider value={consentHook}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsentContext() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsentContext must be used within a ConsentProvider');
  return context;
}

// ============================================
// CONSENT BANNER
// ============================================

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = getConsentState();
      if (saved.analytics_storage === 'denied' && isGAConfigured()) {
        setVisible(true);
      }
    }
  }, []);

  const handleAccept = useCallback(() => {
    grantAnalyticsConsent();
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    denyConsent();
    setVisible(false);
  }, []);

  if (!visible || !isGAConfigured() || !mounted) return null;

  return (
    <m.div
      className="fixed bottom-6 left-6 right-6 z-[1000] mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-rose-gold/20 bg-branco/90 p-6 shadow-card backdrop-blur-xl">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Cookies e Análise</h3>
            <p className="mt-1 text-sm text-foreground/80">
              Usamos cookies e análise para melhorar sua experiência no Esmalt&apos;up.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="inline-flex items-center justify-center rounded-full border-2 border-rose-gold bg-transparent px-5 py-2.5 text-sm font-semibold text-rose-gold transition-all duration-200 hover:bg-rosa-claro/40"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:shadow-card-lg"
            >
              Aceitar Análise
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
}

export function ConsentBannerWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <AnimatePresence mode="wait">
      <ConsentBanner />
    </AnimatePresence>
  );
}

// ============================================
// ANALYTICS DOCUMENTATION
// ============================================

export const ANALYTICS_EVENTS = [
  { name: 'page_view', description: 'Page view event for SPA navigation', when: 'Route change',
    parameters: [
      { name: 'page_path', type: 'string', description: 'Page URL path', required: true },
      { name: 'page_title', type: 'string', description: 'Page title', required: false },
    ]},
  { name: 'view_item_list', description: 'View of a list of items', when: 'Catalog page load, filter change',
    parameters: [
      { name: 'item_list_name', type: 'string', description: 'Name of the list (e.g., "featured_pecas")', required: true },
      { name: 'item_list_id', type: 'string', description: 'ID of the list', required: false },
      { name: 'items', type: 'array', description: 'Array of items in the list', required: false },
    ]},
  { name: 'select_item', description: 'User selects an item (click on card/slide)', when: 'Card/slide click',
    parameters: [
      { name: 'item_list_name', type: 'string', description: 'Name of the list the item is in', required: true },
      { name: 'item_id', type: 'string', description: 'Item ID', required: true },
      { name: 'item_name', type: 'string', description: 'Item name', required: true },
      { name: 'index', type: 'number', description: 'Index of the item in the list', required: false },
      { name: 'item_category', type: 'string', description: 'Item category', required: false },
    ]},
  { name: 'view_item', description: 'View of a single item (detail page or quick view)', when: 'Detail page load, quick view open',
    parameters: [
      { name: 'item_id', type: 'string', description: 'Item ID', required: true },
      { name: 'item_name', type: 'string', description: 'Item name', required: true },
      { name: 'item_category', type: 'string', description: 'Item category', required: false },
      { name: 'price', type: 'number', description: 'Item price', required: false },
    ]},
  { name: 'add_to_wishlist', description: 'Item added to wishlist/favorites', when: 'Heart icon click',
    parameters: [
      { name: 'item_id', type: 'string', description: 'Item ID', required: true },
      { name: 'item_name', type: 'string', description: 'Item name', required: true },
      { name: 'item_category', type: 'string', description: 'Item category', required: false },
    ]},
  { name: 'search', description: 'Search performed', when: 'Search form submit',
    parameters: [
      { name: 'search_term', type: 'string', description: 'Search query', required: true },
    ]},
  { name: 'filter_apply', description: 'Filter applied', when: 'Filter change',
    parameters: [
      { name: 'filter_type', type: 'string', description: 'Type of filter (e.g., "category", "price")', required: true },
      { name: 'filter_value', type: 'string', description: 'Filter value', required: true },
    ]},
  { name: 'carousel_interact', description: 'Interaction with carousel', when: 'Arrow click, drag, dot click, autoplay stop',
    parameters: [
      { name: 'carousel_id', type: 'string', description: 'Carousel identifier', required: true },
      { name: 'action', type: 'string', description: 'Action type (next/prev/drag/dot/autoplay_stop)', required: true },
      { name: 'slide_index', type: 'number', description: 'Index of the slide', required: false },
    ]},
  { name: 'scroll_depth', description: 'Scroll depth reached', when: 'Scroll to 25/50/75/90% of page',
    parameters: [
      { name: 'scroll_depth', type: 'number', description: 'Depth percentage (25, 50, 75, 90)', required: true },
      { name: 'page_path', type: 'string', description: 'Page URL path', required: true },
    ]},
  { name: 'cta_click', description: 'Call-to-action click', when: 'CTA button click',
    parameters: [
      { name: 'cta_id', type: 'string', description: 'CTA identifier', required: true },
      { name: 'location', type: 'string', description: 'Location of the CTA (e.g., "hero", "footer")', required: true },
    ]},
  { name: 'sign_up', description: 'User signs up', when: 'Registration form submit',
    parameters: [
      { name: 'method', type: 'string', description: 'Signup method (e.g., "email", "google")', required: false },
    ]},
  { name: 'login', description: 'User logs in', when: 'Login form submit',
    parameters: [
      { name: 'method', type: 'string', description: 'Login method', required: false },
    ]},
];

export const CUSTOM_DIMENSIONS = [
  { parameter: 'carousel_id', displayName: 'Carousel ID', scope: 'event', description: 'Identifier for carousel instances' },
  { parameter: 'item_list_name', displayName: 'Item List Name', scope: 'event', description: 'Name of the item list being viewed' },
  { parameter: 'cta_id', displayName: 'CTA ID', scope: 'event', description: 'Identifier for call-to-action elements' },
  { parameter: 'filter_type', displayName: 'Filter Type', scope: 'event', description: 'Type of filter applied' },
];

export { sendGA4Event as default };

// Initialize on module load if consent already granted
if (typeof window !== 'undefined') {
  const savedConsent = localStorage.getItem('ga4_consent');
  if (savedConsent) {
    try {
      const consent: ConsentState = JSON.parse(savedConsent);
      if (consent.analytics_storage === 'granted') {
        initializeGA4(consent);
      }
    } catch { /* Invalid consent data */ }
  }
}
