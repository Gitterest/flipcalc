# FlipCalc Pro Entitlements

## Architecture

The verified entitlement backend is implemented in `server/flipcalc/` with a Fetch-style API handler and a Node/serverless adapter at `api/flipcalc/[...path].ts`.

The current repository does not declare a production hosting provider. The backend is therefore structured for same-origin Node/serverless deployment, but production readiness requires configuring a deployment target that supports Node functions and durable Postgres storage.

## API Routes

- `POST /api/flipcalc/checkout`
- `POST /api/flipcalc/stripe-webhook`
- `POST /api/flipcalc/access/request`
- `GET /api/flipcalc/access/verify`
- `GET /api/flipcalc/entitlement`
- `POST /api/flipcalc/logout`
- `GET /api/flipcalc/purchase-status?session_id=...`

## Entitlement Schema

The entitlement model stores:

- `id`
- `normalizedEmail`
- `emailHash`
- `productKey`
- `status`
- `checkoutSessionId`
- `paymentIntentId`
- `stripeCustomerId`
- `createdAt`
- `updatedAt`
- `activatedAt`
- `revokedAt`
- `suspensionReason`

Statuses:

- `active`: grants Pro
- `refunded`: denies Pro
- `disputed`: denies Pro while suspended
- `revoked`: denies Pro

## Storage

Chosen adapter: Postgres.

Production must configure `DATABASE_URL` and run the SQL schema exported as `postgresSchemaSql` in `server/flipcalc/postgresStore.ts`.

The in-memory store is for tests and local development only. It is not production storage because it is lost across deployments, process restarts, and serverless instance rotation.

## Checkout Flow

1. Frontend calls `POST /api/flipcalc/checkout`.
2. Backend validates origin and rate limits the request.
3. Backend rejects browser-supplied amount, currency, Price ID, Product ID, success URL, cancel URL, or entitlement type.
4. Backend creates a Stripe Checkout Session using `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`.
5. Stripe redirects to `/purchase/success?session_id={CHECKOUT_SESSION_ID}` or `/purchase/cancel`.

## Webhook Flow

`POST /api/flipcalc/stripe-webhook` reads the raw request body and verifies the Stripe signature using `STRIPE_FLIPCALC_WEBHOOK_SECRET`.

Handled events:

- `checkout.session.completed`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Checkout fulfillment requires:

- mode is `payment`
- payment status is `paid`
- metadata is `product=flipcalc_pro_lifetime`, `entitlement=flipcalc_pro`, `source=flipcalc`
- line item contains `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`
- customer email is usable

Webhook events are idempotent through the processed Stripe event store. Duplicate purchases update the same email/product entitlement instead of creating conflicting access.

## Passwordless Access Flow

1. Buyer purchases with Stripe Checkout.
2. Webhook creates an active entitlement for the normalized checkout email.
3. Buyer enters that email in the Access FlipCalc Pro form.
4. Backend always returns the same neutral message.
5. If the email has an active entitlement, backend creates a short-lived single-use token and sends a magic link.
6. Magic link opens `/api/flipcalc/access/verify?token=...`.
7. Backend consumes the token atomically and sets an HTTP-only FlipCalc session cookie.
8. Frontend calls `/api/flipcalc/entitlement`.
9. Premium calculators unlock only when the entitlement endpoint returns `{ "pro": true }`.

## Session Cookie

Cookie name: `flipcalc_pro_session`

Properties:

- HTTP-only
- `SameSite=Lax`
- `Secure` in production
- `Path=/`
- explicit max age from `FLIPCALC_SESSION_TTL_DAYS`

The signed stateless session contains only:

- entitlement ID
- product key
- expiry timestamp

The entitlement endpoint re-checks stored entitlement status on every request. Refunded, disputed, revoked, expired, or malformed sessions fail closed.

## Refunds and Disputes

Refund:

- find entitlement by PaymentIntent ID
- set status to `refunded`
- Pro access is denied

Dispute created:

- find entitlement by PaymentIntent ID
- set status to `disputed`
- Pro access is denied

Dispute closed:

- if Stripe status is `won`, restore `active`
- otherwise keep access inactive as `disputed`

## Rate Limiting

The backend rate limits:

- checkout creation
- access-link requests
- access-token verification

The current limiter is in-memory and bounded. It is acceptable for a single Node process and tests, but multi-instance production should use a shared platform-native limiter.

Stripe webhooks are not rate limited.

## Email Provider

Chosen provider adapter: Resend-compatible HTTP API.

Required variables:

- `RESEND_API_KEY`
- `FLIPCALC_ACCESS_EMAIL_FROM`

If no email provider is configured, production access-link delivery is not complete. Development may expose a usable magic link only when:

- `NODE_ENV` is not `production`
- `FLIPCALC_DEV_EXPOSE_MAGIC_LINKS=true`

Usable magic links must never be logged or returned in production.

## Manual Entitlement Audit

Audit the `flipcalc_entitlements` table by normalized email, email hash, checkout session ID, and PaymentIntent ID. Confirm status, timestamps, and suspension reason before changing access manually.

Manual access changes should use the same status values documented here and should preserve Stripe references.
