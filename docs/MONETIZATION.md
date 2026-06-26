# Monetization

## Implementation Mode

FlipCalc now uses a verified backend entitlement flow for FlipCalc Pro.

The previous Stripe Payment Link MVP is superseded. A Payment Link fallback remains documented and gated behind explicit client configuration for rollback only; it must not be used to claim automatic Pro unlock.

## Product Model

Product: FlipCalc Pro Lifetime

Launch display price: $19.99 one-time

The displayed price is marketing copy only. `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID` is the payment source of truth.

Free calculator:

- General Flip Decision

Pro calculators:

- Power Tool Flip
- Phone Flip
- Chainsaw Flip
- Local vs Shipped
- Repair vs Sell As-Is
- Every future specialized calculator unless explicitly added to `freeCalculatorIds`

## Backend Architecture

Backend core:

- `server/flipcalc/`

Route adapter:

- `api/flipcalc/[...path].ts`

Storage:

- Postgres adapter in `server/flipcalc/postgresStore.ts`
- in-memory adapter for tests/local only

Email:

- Resend-compatible adapter
- dev magic-link output only when explicitly enabled outside production

The repository does not declare a production hosting target. The backend is Node/serverless compatible, but deployment readiness requires a platform that can serve same-origin API functions and durable Postgres storage.

## API Contracts

### `POST /api/flipcalc/checkout`

Creates a Stripe Checkout Session server-side.

Server-controlled:

- Price ID
- product metadata
- entitlement metadata
- success URL
- cancel URL

Browser-supplied amount, currency, Price ID, Product ID, success URL, cancel URL, and entitlement type are rejected.

### `POST /api/flipcalc/stripe-webhook`

Receives the raw body, verifies the Stripe signature, and processes supported events idempotently.

### `POST /api/flipcalc/access/request`

Accepts `email` and always returns the same neutral response for valid requests.

### `GET /api/flipcalc/access/verify`

Consumes a short-lived single-use token, creates an HTTP-only session cookie, and redirects to a safe FlipCalc path.

### `GET /api/flipcalc/entitlement`

Returns minimal access state:

```json
{ "pro": false }
```

or:

```json
{ "pro": true }
```

### `POST /api/flipcalc/logout`

Clears the FlipCalc Pro session cookie.

### `GET /api/flipcalc/purchase-status?session_id=...`

Returns:

- `pending`
- `paid`
- `failed`

This endpoint never creates entitlement.

## Required Environment Variables

Server-only:

- `STRIPE_SECRET_KEY`
- `STRIPE_FLIPCALC_WEBHOOK_SECRET`
- `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`
- `FLIPCALC_APP_ORIGIN`
- `FLIPCALC_SESSION_SECRET`
- `FLIPCALC_ACCESS_TOKEN_TTL_MINUTES`
- `FLIPCALC_SESSION_TTL_DAYS`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `FLIPCALC_ACCESS_EMAIL_FROM`

Client-safe only when required:

- `VITE_FLIPCALC_API_ORIGIN`
- `VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK`
- `VITE_FLIPCALC_CHECKOUT_URL`

Do not commit `.env`. Do not prefix server secrets with `VITE_`.

## Stripe Setup

Create Stripe Product:

- `FlipCalc Pro Lifetime`

Create one-time Stripe Price and set:

- `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`

Configure Checkout Session success URL:

- `${FLIPCALC_APP_ORIGIN}/purchase/success?session_id={CHECKOUT_SESSION_ID}`

Configure cancel URL:

- `${FLIPCALC_APP_ORIGIN}/purchase/cancel`

## Webhook Setup

Webhook endpoint:

- `/api/flipcalc/stripe-webhook`

Required events:

- `checkout.session.completed`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

The webhook must use the raw request body for signature verification. Query-string success is not payment proof.

## Entitlement Lifecycle

- `active`: grants Pro
- `refunded`: denies Pro
- `disputed`: denies Pro
- `revoked`: denies Pro

Refunds and disputes update stored entitlement state. The entitlement endpoint validates stored status on every request, so a previously valid cookie fails closed after refund, dispute, or revocation.

## Passwordless Access

FlipCalc does not create password accounts.

The buyer enters the checkout email. If an active entitlement exists, a short-lived single-use magic link is sent. The public response does not reveal whether the email owns Pro.

## Why LocalStorage and Query Strings Are Not Proof

Browser storage and URL parameters can be edited by the user. They are never used as payment truth or entitlement proof.

## Donations

Donations and support payments are separate from FlipCalc Pro. They do not unlock Pro automatically and must not be presented as license purchases.

## Payment Link Migration

The old Payment Link MVP is superseded by backend Checkout Sessions.

Fallback can be enabled only with:

- `VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK=true`
- `VITE_FLIPCALC_CHECKOUT_URL`

Fallback does not create verified entitlement by itself.

## Local Development

1. Copy `.env.example` into a local `.env`.
2. Use Stripe test keys.
3. Configure a test Price ID.
4. Configure Postgres and run the schema.
5. Configure Resend or set `FLIPCALC_DEV_EXPOSE_MAGIC_LINKS=true` outside production.
6. Run `npm run dev`.
7. Run `npm test`.
8. Run `npm run build`.

## Known Limitations

- Production hosting is not declared in the repository.
- The in-memory store is not production storage.
- The in-memory rate limiter is not shared across multiple instances.
- Production email delivery requires `RESEND_API_KEY` and `FLIPCALC_ACCESS_EMAIL_FROM`.
- Deployment has not been performed.
