/**
 * Compatibility layer - bridges old catalogData API with new database-backed products API
 * This allows gradual migration without breaking existing components
 */

import {
  getProduct,
  getByKind,
  getFeatured,
  getRelatedProducts,
  getProductSync,
  getFeaturedSync,
  getByKindSync,
  formatPrice,
  getInstallments,
  formatInstallment,
  freeShippingThresholdCents,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  type Product,
  type ProductKind,
  type StockStatus,
  type SkillLevel,
} from "./products";

// Re-export everything from the new products API
export {
  getProduct,
  getByKind,
  getFeatured,
  getRelatedProducts,
  formatPrice,
  getInstallments,
  formatInstallment,
  freeShippingThresholdCents,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  type Product,
  type ProductKind,
  type StockStatus,
  type SkillLevel,
};

// Export sync versions for client-side components
export const getProductClient = getProductSync;
export const getFeaturedClient = getFeaturedSync;
export const getByKindClient = getByKindSync;

// Keep the PRODUCTS array for seed script only
export { PRODUCTS } from "./catalogData.static";
