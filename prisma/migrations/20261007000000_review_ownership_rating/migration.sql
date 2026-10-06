ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_productId_userId_key"
  ON "reviews" ("productId", "userId");
