ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_productId_userId_key"
  ON "reviews" ("productId", "userId");

DROP INDEX IF EXISTS "review_votes_reviewId_userId_sessionId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "review_votes_reviewId_userId_key"
  ON "review_votes" ("reviewId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "review_votes_reviewId_sessionId_key"
  ON "review_votes" ("reviewId", "sessionId");
