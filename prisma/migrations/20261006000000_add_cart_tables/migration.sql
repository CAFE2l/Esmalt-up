CREATE TABLE IF NOT EXISTS "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "carts_userId_key" ON "carts"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "carts_sessionId_key" ON "carts"("sessionId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'carts_userId_fkey'
    ) THEN
        ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "user_profiles"("uid")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cartId_productId_key"
    ON "cart_items"("cartId", "productId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cartId_fkey'
    ) THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey"
            FOREIGN KEY ("cartId") REFERENCES "carts"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
