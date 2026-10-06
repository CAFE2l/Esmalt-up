This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Commerce and authentication setup

1. Copy `.env.example` to `.env.local` and set the Firebase web app values
   (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and
   `NEXT_PUBLIC_FIREBASE_APP_ID`), the Firebase Admin service-account values,
   `DATABASE_URL`, and `NEXT_PUBLIC_APP_URL`.
2. In Firebase Console, enable **Authentication → Sign-in method → Google**.
   Under **Authentication → Settings → Authorized domains**, add `localhost`
   and the production hostname (for example, `www.example.com`).
3. In Google Cloud Console, configure the OAuth web client used by Firebase.
   Add `http://localhost:3000` and the production HTTPS origin as authorized
   JavaScript origins. Add the Firebase handler
   `https://<NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN>/__/auth/handler` as an authorized
   redirect URI. The Firebase SDK uses the provider configured in Firebase;
   this app does not need a separate Google client-ID environment variable.
4. Generate the Prisma client:

   ```bash
   npx prisma generate
   ```

   This database was already populated before Prisma migration history was
   established (`migrate deploy` previously returned P3005). Do not run
   `prisma migrate deploy` against that database until existing migration
   effects have been checked, any missing SQL has been applied, and every
   applied migration has been registered. The favorites and cart tables, and
   the cart-table migration `20261006000000_add_cart_tables`, were already
   applied to the existing DB. Check the older `show_on_wall` migration’s
   column/index in the database before applying or marking it.

   In Neon’s SQL Editor (or `psql`), run these new SQL files in timestamp order:

   - `prisma/migrations/20261007000000_review_ownership_rating/migration.sql`
   - `prisma/migrations/20261008000000_cart_variants/migration.sql`
   - `prisma/migrations/20261009000000_product_sold_count/migration.sql`

   Before applying the unique review index, run:

   ```sql
   SELECT "productId", "userId", COUNT(*)
   FROM "reviews"
   WHERE "userId" IS NOT NULL
   GROUP BY "productId", "userId"
   HAVING COUNT(*) > 1;
   ```

   Check duplicate votes before the vote uniqueness indexes as well:

   ```sql
   SELECT "reviewId", "userId", COUNT(*)
   FROM "review_votes"
   WHERE "userId" IS NOT NULL
   GROUP BY "reviewId", "userId"
   HAVING COUNT(*) > 1;

   SELECT "reviewId", "sessionId", COUNT(*)
   FROM "review_votes"
   WHERE "sessionId" IS NOT NULL
   GROUP BY "reviewId", "sessionId"
   HAVING COUNT(*) > 1;
   ```

   Resolve any returned duplicates without deleting customer data. Register
   the existing favorites migration, whose table is already present:

   ```bash
   npx prisma migrate resolve --applied 20261002010000_add_favorites
   ```

   If the `show_on_wall` column and index are present, also register:

   ```bash
   npx prisma migrate resolve --applied 20261002000000_add_show_on_wall
   ```

   Then register the manually applied migrations with Prisma:

   ```bash
   npx prisma migrate resolve --applied 20261006000000_add_cart_tables
   npx prisma migrate resolve --applied 20261007000000_review_ownership_rating
   npx prisma migrate resolve --applied 20261008000000_cart_variants
   npx prisma migrate resolve --applied 20261009000000_product_sold_count
   ```

   This repository has no initial schema migration. For a fresh database,
   create the current schema first, then register all migration folders as
   already reflected in that schema:

   ```bash
   npx prisma db push
   npx prisma migrate resolve --applied 20261002000000_add_show_on_wall
   npx prisma migrate resolve --applied 20261002010000_add_favorites
   npx prisma migrate resolve --applied 20261006000000_add_cart_tables
   npx prisma migrate resolve --applied 20261007000000_review_ownership_rating
   npx prisma migrate resolve --applied 20261008000000_cart_variants
   npx prisma migrate resolve --applied 20261009000000_product_sold_count
   ```

   Do not use `db push` on production; apply the SQL files and resolve history
   as described above instead.

   Cart/favorites, reviews, questions, and orders are stored in PostgreSQL. The server APIs
   verify Firebase ID tokens and enforce ownership; do not expose
   `DATABASE_URL` to the browser and do not create public database credentials.
5. Seed/update the catalog’s sample specifications and variants:

   ```bash
   npm run seed:products
   ```

   Optional moderation fixtures (explicitly fictitious and hidden with
   `pending` status; never approve/publish as customer testimonials):

   ```bash
   npm run seed:demo-reviews
   ```

   Product images use only assets currently present in `public/produtos`; add
   real alternate photos to that directory and update each product’s `images`
   array before expecting multiple distinct gallery views. Variant prices,
   stock, image, SKU, and option labels are sourced from each product’s
   `variants.optionGroups` JSON.

6. Review photo uploads use the existing Cloudinary integration. Set
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET` in `.env.local`; uploads are limited to three JPG,
   PNG, or WebP photos of up to 5 MB each. Review creation requires a matching
   paid order and records `verifiedPurchase`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
