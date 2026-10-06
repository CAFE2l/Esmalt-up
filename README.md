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
4. Generate the Prisma client and apply pending migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   The cart and favorites APIs authenticate Firebase ID tokens and scope
   database writes to the verified user. Cart tables are created by the
   included Prisma migration; favorites and orders use their existing Prisma
   schema and database tables. No Firebase/Firestore security rules are used
   because commerce data is stored in PostgreSQL and accessed through these
   server APIs.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
