# FlipCalc

FlipCalc is a mobile-first PWA containing niche calculators for resellers and item flippers.

## Stack

- React
- TypeScript
- Vite
- React Router
- Vitest
- vite-plugin-pwa

## Setup

```bash
npm install
npm run dev
```

## Payment configuration

FlipCalc uses a verified backend entitlement flow for FlipCalc Pro. The backend creates Stripe Checkout Sessions, verifies Stripe webhooks, stores entitlements, and unlocks premium calculators through a passwordless access session.

Server-only variables:

```bash
STRIPE_SECRET_KEY
STRIPE_FLIPCALC_WEBHOOK_SECRET
STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID
FLIPCALC_APP_ORIGIN
FLIPCALC_SESSION_SECRET
FLIPCALC_ACCESS_TOKEN_TTL_MINUTES
FLIPCALC_SESSION_TTL_DAYS
DATABASE_URL
RESEND_API_KEY
FLIPCALC_ACCESS_EMAIL_FROM
```

Client-safe variables:

```bash
VITE_FLIPCALC_API_ORIGIN
VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK
VITE_FLIPCALC_CHECKOUT_URL
```

Do not commit `.env` files or secret values. Premium routes unlock only after the backend entitlement endpoint verifies an active Pro session.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

The build also typechecks the backend with:

```bash
npm run typecheck:server
```

## Current scope

The app currently includes:

- Responsive app shell with light, dark, and system themes
- Calculator catalog with General Flip as the free calculator
- Locked Pro routes for specialized calculators
- Verified Stripe Checkout, webhook, entitlement, and passwordless access backend
- PWA configuration
- Pure TypeScript calculator implementations and tests
- Monetization and entitlement documentation in `docs/`

Calculator formulas are specified in `docs/calculators/` and must not be invented or changed without a matching source specification.
