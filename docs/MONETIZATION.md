# Monetization

## Implementation Mode

FlipCalc currently uses the Stripe Payment Link MVP.

The repository is a frontend-only Vite application with no existing SoFlipCo API, backend, database, account, session, or entitlement storage pattern. Because there is no safe server surface in the current architecture, this phase does not create a fake client-only entitlement system.

Automatic Pro unlocking requires a future backend implementation with Checkout Sessions, verified webhooks, idempotent fulfillment, and server-side entitlement verification.

## Product Model

Product: FlipCalc Pro Lifetime

Launch display price: $19.99 one-time

The displayed launch price is marketing copy only. The Stripe-configured Price or hosted Payment Link controls the actual charge.

Free calculator:

- General Flip Decision

Pro calculators:

- Power Tool Flip
- Phone Flip
- Chainsaw Flip
- Local vs Shipped
- Repair vs Sell As-Is
- Every future premium calculator unless explicitly moved to the free calculator configuration

Planned Pro additions:

- Reseller spreadsheet download
- Future deal worksheets and templates
- Future premium calculators

## Required Environment Variables

Server-only variables for the future verified backend:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`
- `FLIPCALC_APP_ORIGIN`

Client-safe variable for the current Payment Link MVP:

- `VITE_FLIPCALC_CHECKOUT_URL`

Do not prefix server secrets with `VITE_`. Do not commit `.env` files. Do not commit secret values.

## Stripe Product and Price Setup

Create a Stripe Product named `FlipCalc Pro Lifetime`.

Create a one-time Stripe Price for the product. The launch display price is $19.99, but Stripe is the source of truth for the amount charged.

For the Payment Link MVP, create a Stripe Payment Link using that Price and set:

- Success URL: `/purchase/success`
- Cancel URL: `/pricing` or `/purchase/cancel`

Set `VITE_FLIPCALC_CHECKOUT_URL` to the hosted Payment Link URL in the deployment environment.

## Payment Link MVP Flow

1. Visitor views `/pricing`.
2. The pricing page reads `VITE_FLIPCALC_CHECKOUT_URL`.
3. If the URL is configured and valid, the primary CTA links to Stripe-hosted checkout.
4. If the URL is missing or invalid, the CTA is disabled with a clear configuration message.
5. Returning to `/purchase/success` does not unlock Pro.
6. Premium calculators remain locked because there is no verified entitlement backend yet.

The success page is intentionally truthful: a URL return is not payment proof.

## Future Verified Checkout Session Flow

When a backend exists, replace the Payment Link MVP with:

1. Server endpoint creates a Stripe Checkout Session.
2. Server uses `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`.
3. Checkout mode is `payment`.
4. Success URL is `/purchase/success?session_id={CHECKOUT_SESSION_ID}`.
5. Cancel URL is `/pricing`.
6. Webhook endpoint verifies `STRIPE_WEBHOOK_SECRET` against the raw request body.
7. Handle `checkout.session.completed`.
8. Fulfillment is idempotent.
9. Store the Pro entitlement using the backend database pattern.
10. Client checks entitlement through the server.
11. Premium routes unlock only after verified entitlement exists.

Never let the client choose an arbitrary Price ID. Never place the payment amount in a client request as payment truth.

## Webhooks and Raw Body Verification

The future webhook endpoint must read the raw request body before parsing JSON. Stripe signature verification must reject invalid signatures before any fulfillment code runs.

Required event:

- `checkout.session.completed`

Future subscription or refund behavior may add more events, but those must be documented with the implementation.

## Idempotent Fulfillment

Fulfillment must record processed Stripe event IDs or checkout session IDs before granting access. Duplicate webhook events must not duplicate entitlement rows or grant conflicting access states.

## Entitlement Storage and Verification

The current app has no account or database layer. Future entitlement storage must use the real backend identity/session model when it exists.

The client must fail safely:

- Loading state must not expose premium forms.
- Error state must not unlock premium calculators.
- Logout or entitlement loss must remove access where applicable.
- Direct premium route navigation must enforce the same access rule as catalog navigation.

## Refund and Chargeback Behavior

Refund and chargeback handling is not automated in the Payment Link MVP.

When a verified backend exists, refund and chargeback events should revoke or suspend Pro entitlement according to the published refund policy. The behavior must be documented before launch.

## Donations and Support Payments

Donations are separate from FlipCalc Pro purchase.

Bitcoin, Monero, PayPal, Cash App, or other support methods must be labeled as support or donations. They must not be presented as a Pro license purchase and must not unlock Pro automatically without a separate verified entitlement workflow.

## Why Success Query Parameters Are Not Payment Proof

Anyone can visit a success URL manually. Query-string values can be copied or fabricated. FlipCalc must never grant Pro access from a URL parameter alone.

## Why Local Storage Is Not Payment Proof

Browser storage is controlled by the user and can be edited. It is acceptable for theme preference or non-sensitive UI settings, but it is not acceptable as proof of purchase.

## Local Test Mode

For the Payment Link MVP:

1. Create a Stripe test-mode Payment Link.
2. Set `VITE_FLIPCALC_CHECKOUT_URL` locally.
3. Run `npm run dev`.
4. Verify the pricing CTA opens the hosted Stripe test checkout.
5. Verify `/purchase/success` does not claim access is active.
6. Verify premium calculator routes remain locked.

For the future backend:

1. Use Stripe test keys.
2. Use Stripe CLI to forward webhooks to the local webhook endpoint.
3. Verify invalid signatures are rejected.
4. Verify duplicate events are idempotent.
5. Verify entitlements are stored and checked server-side.

## Production Deployment Checklist

- Rotate any previously exposed live Stripe secret key, webhook secret, admin password, or admin session secret before production deployment.
- Store secrets only in the deployment provider secret manager.
- Set `VITE_FLIPCALC_CHECKOUT_URL` only to the intended hosted Payment Link for the current MVP.
- Do not expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`, or `FLIPCALC_APP_ORIGIN` in the client bundle.
- Confirm `/pricing`, `/purchase/success`, and premium locked routes work on mobile.
- Confirm General Flip remains fully usable without signup or payment.
- Confirm donations remain visually and functionally separate from Pro purchase.

## Adding Future Premium Calculators

Add the calculator to the catalog and leave it out of `freeCalculatorIds` in `src/calculators/access.ts`. Premium is the default because any calculator not listed as free resolves to Pro.

## Changing the Free Calculator

Update `freeCalculatorIds` in `src/calculators/access.ts` and update the pricing, homepage, and documentation copy to match the new launch access model.

## Adding Future Subscription Pricing

Add subscription-specific environment variables and a server-side Checkout Session flow. Keep lifetime and subscription prices server-controlled. Do not make the client the source of payment truth.

## `.env` Handling

Use local `.env` files only on the developer machine and deployment environment variables in production. Never commit `.env` or copied secret values.

Client-safe values may use the `VITE_` prefix. Server-only secrets must never use the `VITE_` prefix.
