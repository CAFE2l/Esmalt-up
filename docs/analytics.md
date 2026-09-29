# Esmalt'up - Google Analytics 4 Documentation

## Overview

This document describes the Google Analytics 4 (GA4) implementation for Esmalt'up, including all tracked events, parameters, and configuration requirements.

## Setup Instructions

### 1. Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for Esmalt'up
3. Copy the Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Required - Your GA4 Measurement ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional - Enable debug logging in development
NEXT_PUBLIC_GA_DEBUG=true
```

### 3. Register Custom Dimensions in GA4

In your GA4 Admin panel under "Custom Definitions", create the following **custom dimensions** (Event-scoped):

| Parameter Name | Display Name | Scope | Description |
|----------------|--------------|-------|-------------|
| `carousel_id` | Carousel ID | Event | Identifier for carousel instances |
| `item_list_name` | Item List Name | Event | Name of the item list being viewed |
| `cta_id` | CTA ID | Event | Identifier for call-to-action elements |
| `filter_type` | Filter Type | Event | Type of filter applied |

**Important:** Custom dimensions must be registered **before** they can be used in reports. After creating them, they may take 24-48 hours to appear in reports.

## Consent Mode v2

The implementation uses Google's Consent Mode v2, which is required for LGPD/CCPA compliance in Brazil/EU.

### Default Behavior

- **All tracking is OFF by default** (`analytics_storage: 'denied'`)
- Users see a glass-style consent banner at the bottom of the screen
- When users accept, analytics is enabled (`analytics_storage: 'granted'`)
- Consent preference is saved in `localStorage`

### Consent Banner

The consent banner:
- Appears only when GA4 is configured (`NEXT_PUBLIC_GA_ID` is set)
- Shows on pages where analytics_storage is denied
- Provides "Aceitar Análise" and "Recusar" options
- Matches the Esmalt'up design system (glass/blur effects)

### Manual Consent Management

```typescript
import { 
  grantAnalyticsConsent, 
  denyConsent, 
  getConsentState,
  saveConsentState 
} from '@/lib/analytics';

// Grant analytics consent
grantAnalyticsConsent();

// Deny all consent
denyConsent();

// Get current consent state
const consent = getConsentState();

// Save custom consent state
saveConsentState({ ...consent, analytics_storage: 'granted' });
```

## Tracked Events

### Automatic Tracking

The following events are **automatically tracked** without any additional code:

| Event | When Triggered | Parameters |
|-------|----------------|------------|
| `page_view` | Route change | `page_path`, `page_title` |
| `scroll_depth` | Scroll to 25%, 50%, 75%, 90% | `scroll_depth`, `page_path` |

### Manual Tracking

Use these functions to track user interactions:

```typescript
import {
  trackViewItemList,
  trackSelectItem,
  trackViewItem,
  trackAddToWishlist,
  trackSearch,
  trackFilterApply,
  trackCarouselInteract,
  trackScrollDepth,
  trackCTAClick,
  trackSignUp,
  trackLogin,
  trackQuickViewOpen,
} from '@/lib/analytics';
```

### Event Reference

#### 1. `view_item_list`

**When:** Catalog page loads, filter changes

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `item_list_name` | string | Yes | Name of the list (e.g., "featured_pecas", "all_kits") |
| `item_list_id` | string | No | ID of the list |
| `items` | array | No | Array of items in the list (with `item_id`, `item_name`, `item_category`) |

**Example:**

```typescript
// In MarketplacePage.tsx
trackViewItemList('featured_pecas', featuredProducts);

// In CatalogGrid.tsx
trackViewItemList('all_pecas', filteredProducts);
```

#### 2. `select_item`

**When:** User clicks on a product card or carousel slide

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `item_list_name` | string | Yes | Name of the list the item is in |
| `item_id` | string | Yes | Product ID |
| `item_name` | string | Yes | Product name |
| `index` | number | No | Index of the item in the list |
| `item_category` | string | No | Product category |

**Example:**

```typescript
<button onClick={() => trackSelectItem(product, 'featured_pecas', index)}>
  View Product
</button>
```

#### 3. `view_item`

**When:** User views a product detail page or opens quick view

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `item_id` | string | Yes | Product ID |
| `item_name` | string | Yes | Product name |
| `item_category` | string | No | Product category |
| `price` | number | No | Product price (in BRL) |

**Example:**

```typescript
// In ProductArt.tsx or product detail page
useEffect(() => {
  trackViewItem(product);
}, [product]);
```

#### 4. `add_to_wishlist`

**When:** User adds a product to favorites/wishlist

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `item_id` | string | Yes | Product ID |
| `item_name` | string | Yes | Product name |
| `item_category` | string | No | Product category |

**Example:**

```typescript
<button 
  onClick={() => {
    addToFavorites(product);
    trackAddToWishlist(product);
  }}
>
  <HeartIcon />
</button>
```

#### 5. `search`

**When:** User performs a search

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `search_term` | string | Yes | The search query |

**Example:**

```typescript
const handleSearch = (term: string) => {
  setSearchTerm(term);
  trackSearch(term);
};
```

#### 6. `filter_apply`

**When:** User applies a filter

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filter_type` | string | Yes | Type of filter (e.g., "category", "price", "level") |
| `filter_value` | string | Yes | The filter value |

**Example:**

```typescript
<select onChange={(e) => {
  setCategory(e.target.value);
  trackFilterApply('category', e.target.value);
}}>
  {/* options */}
</select>
```

#### 7. `carousel_interact`

**When:** User interacts with a carousel

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `carousel_id` | string | Yes | Identifier for the carousel (e.g., "hero_carousel", "related_items") |
| `action` | string | Yes | Action type: `next`, `prev`, `drag`, `dot`, `autoplay_stop` |
| `slide_index` | number | No | Index of the slide |

**Example:**

```typescript
// In HeroCarousel.tsx
<button onClick={() => {
  go(1);
  trackCarouselInteract('hero_carousel', 'next', newIndex);
}}>
  Next
</button>
```

#### 8. `scroll_depth`

**When:** User scrolls to 25%, 50%, 75%, or 90% of page (automatic)

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `scroll_depth` | number | Yes | Depth percentage (25, 50, 75, or 90) |
| `page_path` | string | Yes | Current page URL path |

#### 9. `cta_click`

**When:** User clicks a call-to-action button

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `cta_id` | string | Yes | Identifier for the CTA (e.g., "view_all", "buy_now") |
| `location` | string | Yes | Location on page (e.g., "hero", "footer", "product_card") |

**Example:**

```typescript
<button 
  onClick={() => trackCTAClick('view_all', 'hero_carousel')}
>
  Ver todos
</button>
```

#### 10. `sign_up`

**When:** User signs up

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `method` | string | No | Signup method (e.g., "email", "google", "facebook") |

**Example:**

```typescript
const handleSignUp = async (method: string) => {
  await signUpUser(method);
  trackSignUp(method);
};
```

#### 11. `login`

**When:** User logs in

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `method` | string | No | Login method |

**Example:**

```typescript
const handleLogin = async (method: string) => {
  await loginUser(method);
  trackLogin(method);
};
```

#### 12. `quick_view_open`

**When:** User opens the quick view modal

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `item_id` | string | Yes | Product ID |
| `item_name` | string | Yes | Product name |
| `item_category` | string | No | Product category |

**Example:**

```typescript
<button onClick={() => {
  setQuickView(product);
  trackQuickViewOpen(product);
}}>
  Quick View
</button>
```

## Event Deduplication

All events are deduplicated to prevent double-firing in React StrictMode:

- Same event with same parameters within 1000ms (1 second) is ignored
- Debug mode logs all events, including duplicates
- Set `NEXT_PUBLIC_GA_DEBUG=true` to see duplicate blocking in console

## Debug Mode

Enable debug mode during development:

```env
NEXT_PUBLIC_GA_DEBUG=true
```

This will:
- Log all events to console with `[GA4 Debug]` prefix
- Show duplicate event blocking
- Add `debug_mode: true` parameter to all events
- Enable gtag debug logging

**Important:** Remove debug mode in production!

## Performance Considerations

- GA4 script loads via `next/script` with `strategy="afterInteractive"`
- Tracking only initializes when consent is granted
- Events are batched and sent asynchronously
- No impact on Lighthouse Performance score when consent is denied

## Verifying Events

### Method 1: GA4 DebugView (Recommended)

1. Enable debug mode (`NEXT_PUBLIC_GA_DEBUG=true`)
2. In GA4 Admin > Debug > DebugView
3. Interact with your site
4. View real-time events

### Method 2: Console Logging

With debug mode enabled, all events are logged to console:

```
[GA4 Debug] { event: 'view_item_list', params: { item_list_name: 'featured_pecas', ... }, timestamp: '...' }
```

### Method 3: Realtime Report

In GA4, go to Reports > Realtime to see events as they happen.

## Custom Reports

### Recommended Explorations

1. **Product Performance**
   - Event: `view_item`
   - Dimensions: `item_id`, `item_name`, `item_category`
   - Metrics: Event count, Users

2. **Carousel Engagement**
   - Event: `carousel_interact`
   - Dimensions: `carousel_id`, `action`
   - Metrics: Event count

3. **Search Behavior**
   - Event: `search`
   - Dimensions: `search_term`
   - Metrics: Event count, Sessions with search

4. **Filter Usage**
   - Event: `filter_apply`
   - Dimensions: `filter_type`, `filter_value`
   - Metrics: Event count

5. **Conversion Funnel**
   - Events: `view_item_list` -> `select_item` -> `view_item` -> `add_to_wishlist`
   - Funnel visualization in GA4

## Data Retention

GA4 has the following data retention defaults:
- **Event-level data:** 2 months (can be extended to 14 months in GA4 settings)
- **User-level data:** 14 months (configurable)

To change retention:
1. GA4 Admin > Data Settings > Data Retention
2. Set "Event data retention" to your preferred duration

## Compliance

### LGPD (Brazil)

- Consent Mode v2 is implemented
- Analytics only enabled after explicit user consent
- Consent can be revoked at any time
- Data is not shared with third parties without consent

### CCPA (California)

- Similar to LGPD compliance
- Users can opt-out of tracking
- "Do Not Sell My Personal Information" can be added via consent preferences

### GDPR (EU)

- Consent Mode v2 complies with GDPR requirements
- Users must explicitly consent to analytics
- Consent can be managed and revoked

## Troubleshooting

### Events Not Appearing in GA4

1. Check if `NEXT_PUBLIC_GA_ID` is set correctly
2. Verify consent has been granted
3. Check browser console for errors
4. Ensure no ad blockers are blocking GA
5. Wait 24-48 hours for data to process (realtime should work immediately)

### Duplicate Events

1. Ensure debug mode is not enabled in production
2. Check for multiple GA4 script loads
3. Verify event deduplication is working
4. Ensure you're not calling track functions multiple times for the same action

### Consent Banner Not Showing

1. Check if `NEXT_PUBLIC_GA_ID` is set
2. Verify `localStorage.getItem('ga4_consent')` is not already set to granted
3. Check for JavaScript errors preventing the banner from rendering

## API Reference

### Tracking Functions

All tracking functions are exported from `@/lib/analytics`:

```typescript
import {
  // Core
  sendGA4Event,
  trackEvent,
  initializeGA4,
  updateConsent,
  getGAID,
  isGAConfigured,
  
  // Automatic tracking
  GA4Script,
  TrackRouteChanges,
  useTrackRouteChanges,
  ScrollDepthTracker,
  useTrackScrollDepth,
  
  // Page view
  trackPageView,
  
  // E-commerce
  trackViewItemList,
  trackSelectItem,
  trackViewItem,
  trackAddToWishlist,
  
  // User actions
  trackSearch,
  trackFilterApply,
  trackCarouselInteract,
  trackScrollDepth,
  trackCTAClick,
  trackSignUp,
  trackLogin,
  trackQuickViewOpen,
  
  // Consent
  getConsentState,
  saveConsentState,
  grantAnalyticsConsent,
  denyConsent,
  useConsent,
  ConsentProvider,
  useConsentContext,
  ConsentBanner,
  ConsentBannerWrapper,
  
  // Documentation
  DEFAULT_CONSENT,
  ANALYTICS_EVENTS,
  CUSTOM_DIMENSIONS,
} from '@/lib/analytics';
```

### TypeScript Types

```typescript
export interface GA4EventParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ConsentState {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
}

export type GA4EventNames = 
  | 'page_view'
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'add_to_wishlist'
  | 'search'
  | 'filter_apply'
  | 'carousel_interact'
  | 'scroll_depth'
  | 'cta_click'
  | 'sign_up'
  | 'login'
  | 'quick_view_open';
```

## Changes Made in This Redesign

### Added Features:
1. **Full GA4 implementation** with Consent Mode v2
2. **Automatic page view tracking** on route changes
3. **Scroll depth tracking** at 25%, 50%, 75%, 90%
4. **Comprehensive event tracking** for all user interactions
5. **Consent banner** with glass/blur styling matching design system

### Tracking Coverage:
- ✅ All catalog pages (Kits, Peças Avulsas)
- ✅ Hero carousel interactions
- ✅ Product grid clicks
- ✅ Quick view opens
- ✅ Search and filtering
- ✅ CTA clicks
- ✅ Authentication events

### Not Tracked (Intentionally):
- User personal data (email, name, etc.)
- Sensitive information
- Events without explicit consent
- Page views when consent is denied

## Next Steps

1. **Set up GA4 property** and get Measurement ID
2. **Add environment variables** to `.env.local`
3. **Register custom dimensions** in GA4 Admin
4. **Test events** using DebugView
5. **Create custom reports** in GA4 for key metrics
6. **Set up alerts** for significant changes in traffic
7. **Integrate with BigQuery** (optional) for advanced analysis

## Support

For questions about this GA4 implementation:
- Check the [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- Review the [Consent Mode Guide](https://developers.google.com/tag-manager/templates/consent)
- Consult the [Ecommerce Tracking Guide](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-29 | Initial implementation with full GA4 tracking |
