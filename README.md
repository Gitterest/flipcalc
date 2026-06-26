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

FlipCalc currently uses a frontend-only Stripe Payment Link MVP for FlipCalc Pro.

Client-safe local variable:

```bash
VITE_FLIPCALC_CHECKOUT_URL=https://buy.stripe.com/your-payment-link
```

Server-only variables reserved for the future verified entitlement backend:

```bash
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID
FLIPCALC_APP_ORIGIN
```

Do not commit `.env` files or secret values. The Payment Link MVP does not automatically unlock Pro calculators; premium routes remain locked until a backend entitlement system verifies purchase server-side.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Current scope

The app currently includes:

- Responsive app shell with light, dark, and system themes
- Calculator catalog with General Flip as the free calculator
- Locked Pro routes for specialized calculators
- Stripe Payment Link MVP pricing and purchase-return pages
- PWA configuration
- Pure TypeScript calculator implementations and tests
- Monetization documentation in `docs/MONETIZATION.md`

Calculator formulas are specified in `docs/calculators/` and must not be invented or changed without a matching source specification.
