ALTER TABLE "cart_items"
  ADD COLUMN IF NOT EXISTS "variantId" TEXT,
  ADD COLUMN IF NOT EXISTS "variantName" TEXT;

ALTER TABLE "cart_items"
  DROP CONSTRAINT IF EXISTS "cart_items_cartId_productId_key";
DROP INDEX IF EXISTS "cart_items_cartId_productId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cartId_productId_variantId_key"
  ON "cart_items" ("cartId", "productId", "variantId");
