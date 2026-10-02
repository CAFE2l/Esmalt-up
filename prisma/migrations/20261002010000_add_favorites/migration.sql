CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "favorites"("userId", "productId");
CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");
CREATE INDEX "favorites_productId_idx" ON "favorites"("productId");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user_profiles"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
