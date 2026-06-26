# Deployment

## Current Hosting Discovery

The repository is a Vite PWA with no committed production hosting configuration such as `vercel.json`, `netlify.toml`, `wrangler.toml`, Dockerfile, or backend deployment manifest.

Selected backend architecture:

- Fetch-style backend core in `server/flipcalc/`
- Node/serverless adapter in `api/flipcalc/[...path].ts`
- Postgres durable storage adapter
- Resend-compatible email adapter

Selected deployment target:

- Not proven by repository configuration.
- The implementation is compatible with same-origin Node/serverless hosting when the platform supports `api/` functions and Node APIs.

Do not claim production deployment is complete until the deployment platform is configured and verified.

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

Development only:

- `FLIPCALC_DEV_EXPOSE_MAGIC_LINKS`

Client-safe:

- `VITE_FLIPCALC_API_ORIGIN` only when API and frontend are cross-origin
- `VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK`
- `VITE_FLIPCALC_CHECKOUT_URL`

Never expose server-only values through `VITE_`.

## Safe Production Deployment Order

1. Provision durable Postgres storage.
2. Run the `postgresSchemaSql` schema from `server/flipcalc/postgresStore.ts`.
3. Provision Resend or another production email provider adapter.
4. Configure server environment variables.
5. Deploy backend routes.
6. Configure Stripe webhook endpoint `/api/flipcalc/stripe-webhook`.
7. Subscribe to required Stripe events:
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
8. Create or confirm Stripe Product `FlipCalc Pro Lifetime`.
9. Create or confirm the one-time Stripe Price.
10. Set `STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID`.
11. Run test-mode Checkout.
12. Confirm webhook fulfillment creates an active entitlement.
13. Confirm magic-link delivery.
14. Confirm `/api/flipcalc/entitlement`.
15. Deploy frontend integration.
16. Confirm General Flip still works without access.
17. Confirm premium routes remain locked without access.
18. Confirm premium routes unlock with a test purchase and magic link.
19. Only then configure live Stripe values.

Do not run live payment testing automatically.

## Stripe CLI Local Workflow

1. Use Stripe test keys.
2. Start the app/backend in a local environment with server variables configured.
3. Forward webhooks to `/api/flipcalc/stripe-webhook`.
4. Trigger `checkout.session.completed` through test checkout.
5. Confirm duplicate webhook delivery is idempotent.
6. Confirm refund and dispute events change entitlement status.

## Rollback

If checkout or entitlement verification fails after deployment:

1. Disable the verified checkout CTA by removing required backend configuration.
2. Optionally enable the documented Payment Link fallback.
3. Keep premium calculators locked unless entitlement verification is working.
4. Do not grant client-side Pro access from localStorage or URL parameters.

## Buyer Access Troubleshooting

Check:

- Stripe Checkout completed and payment is paid.
- Webhook event was received and processed.
- Entitlement exists for the normalized checkout email.
- Entitlement status is `active`.
- Email provider accepted the magic-link email.
- Access token has not expired or already been consumed.
- Session cookie is present and not expired.

Never reveal entitlement existence through the public access-request endpoint.
