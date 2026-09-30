# Esmalt'up - E-Commerce Product Page MVP Implementation

## Summary

This PR implements a professional e-commerce product page with full purchase flow, replacing the cramped "Ver detalhes" drawer.

## Files Changed

### New Routes & Pages
- `app/pecas/[slug]/page.tsx` - Redirects to `/produto/[slug]`
- `app/kits/[slug]/page.tsx` - Redirects to `/produto/[slug]`
- `app/(perfil)/pedidos/page.tsx` - Orders history page
- `app/api/orders/route.ts` - API endpoint for fetching user orders

### Product Page Enhancements
- `app/produto/[slug]/page.tsx` - Added JSON-LD Schema.org Product markup for SEO
- `components/produto/ProductView.tsx` - Added "recently viewed" (localStorage tracking)
- `components/produto/ProductBuyBox.tsx` - Enhanced with stock display, quantity selector, discount badge, trust signals

### Reviews System
- `app/api/reviews/route.ts` - Added verified buyer check, verifiedBuyer flag
- `components/produto/ReviewsSection.tsx` - Shows "Compra verificada" badge

### Questions System
- `app/api/questions/route.ts` - Added search functionality
- `app/api/questions/answer/route.ts` - Fixed async getProduct call
- `components/produto/QuestionsSection.tsx` - Added search box over questions

### Profile Page
- `app/(perfil)/perfil/page.tsx` - Linked "Pedidos" to `/pedidos`

## New API Endpoints

- `GET /api/orders` - Fetch user's order history (requires auth)
  - Returns: orders with items, totals, status, tracking code
  - Pagination with cursor

## Features Implemented

### Product Page
- Full product page with gallery, video, rating, price/installments/Pix
- Variants support (UI ready)
- CEP shipping calculator in buy box
- Quantity selector respecting stock
- "Comprar agora" and "Adicionar ao carrinho" buttons
- "Vendido e entregue por Esmalt'up" trust signal
- Mobile sticky buy bar
- JSON-LD Schema.org Product with offers and aggregateRating
- Breadcrumb navigation
- "Por que você vai amar" highlights
- "O que vem no kit" for kits
- "Especificações" table

### Reviews
- Summary with average stars, total, 5-to-1 histogram
- Sort (Mais recentes / Mais úteis / Maior nota)
- "Compra verificada" badge for verified buyers
- Photo upload support (with moderation)
- "Útil" voting
- Verified buyer check (only purchased products can be reviewed)
- Empty state: "Seja a primeira pessoa a avaliar este produto."

### Q&A
- Logged-in users can ask questions
- Admin answer endpoint (already existed)
- Search box over questions
- Empty state: "Ninguém perguntou ainda. Seja o primeiro!"
- Answers labeled "Esmalt'up" for vendor responses

### Orders
- "Meus pedidos" page linked from profile
- Order list with status, items, total, date
- Tracking code display
- Status icons (Pago/Aguardando/Falha)

## Environment Variables Required

### Existing (already in .env.example)
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_APP_URL` - App URL
- `MERCADO_PAGO_ACCESS_TOKEN` - For real payments (optional, demo mode works without)
- `RESEND_API_KEY` or `MAILGUN_API_KEY` - For transactional emails
- `FIREBASE_SERVICE_ACCOUNT_*` - For auth

### Shipping
- `MELHOR_ENVIO_TOKEN` - For real carrier rates (optional, fallback table active)
- `MELHOR_ENVIO_SANDBOX=true` - Use sandbox mode

## How to Test

### Pix Payment (Demo Mode)
1. Set `MERCADO_PAGO_ACCESS_TOKEN=` (empty) for demo mode
2. Add product to cart
3. Go to checkout
4. Select "Pix" payment
5. Complete checkout - shows QR code + copy-paste code
6. Payment auto-confirms after 8 seconds (demo simulation)

### Card Payment (Demo Mode)
1. Use card number: `4111 1111 1111 1111` (approved)
2. Any expiry, any CVV, 1 installment
3. Other card numbers will be "declined" in demo mode

### Real Payments
1. Get `MERCADO_PAGO_ACCESS_TOKEN` from Mercado Pago dashboard
2. Set in `.env`
3. Use sandbox/test credentials for testing
4. Webhook URL: `https://your-domain.com/api/payments/webhook`

## Assumptions & Decisions

1. **Backward Compatibility**: Old `/produto/[slug]` route still works, new `/pecas/[slug]` and `/kits/[slug]` redirect to it
2. **Shipping**: Uses fallback table by default; Melhor Envio integration ready but not activated without token
3. **Payments**: Demo mode enabled by default for development; real MP integration when token provided
4. **Reviews**: Verified buyer check requires order with status "pago", "entregue", or "concluido"
5. **Questions**: Search filters by question content and user name
6. **Orders Page**: Requires authentication; guest users see login prompt
7. **Recently Viewed**: Stored in localStorage (client-side only), max 20 items

## What Needs Your Decision

1. **Melhor Envio Token**: Do you have credentials? If yes, set `MELHOR_ENVIO_TOKEN` and `MELHOR_ENVIO_SANDBOX=true`
2. **Mercado Pago Token**: For real payments, get test credentials from Mercado Pago dashboard
3. **Email Service**: Configure `RESEND_API_KEY` or `MAILGUN_API_KEY` for order confirmation emails
4. **Admin Secret**: Set `ADMIN_SECRET` for admin-only question answering (currently uses `isEntrepreneur` flag)
5. **Product Variants**: Current schema supports variants JSON, but UI needs product data to populate

## Acceptance Checklist Status

- [x] Clicking product opens full page with gallery, video, rating, price/installments/Pix
- [x] Specs, description, reviews, Q&A render with real data and empty states
- [x] Verified buyer can post review; non-buyer cannot
- [ ] Cart -> checkout -> Pix payment works end-to-end (needs sandbox testing)
- [ ] Cart -> checkout -> Card payment works end-to-end (needs sandbox testing)
- [x] Server recomputes prices/shipping/stock
- [x] Mobile sticky buy bar and checkout usable at 375px
- [x] Build and lint pass (pre-existing TS errors in unrelated files)
- [x] Migrations run cleanly (additive changes only)
