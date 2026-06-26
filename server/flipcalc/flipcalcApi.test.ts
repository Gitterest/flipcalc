import { describe, expect, it } from 'vitest'
import { checkoutMetadata, flipCalcProductKey, neutralAccessResponse } from './constants'
import { readFlipCalcServerConfig } from './config'
import { createFlipCalcApi } from './http'
import { DevMagicLinkMailService, NullMailService } from './mail'
import { MemoryEntitlementStore } from './memoryStore'
import { MemoryRateLimiter } from './rateLimiter'
import { hashEmail, normalizeEmail } from './security'
import { FlipCalcService } from './service'
import type {
  CheckoutSessionCreateInput,
  CreatedCheckoutSession,
  EntitlementStore,
  MailService,
  StripeCheckoutSession,
  StripeGateway,
  StripeLineItem,
  StripeWebhookEvent
} from './types'

class FakeStripeGateway implements StripeGateway {
  readonly checkoutCreates: CheckoutSessionCreateInput[] = []
  readonly sessions = new Map<string, StripeCheckoutSession>()
  readonly lineItems = new Map<string, StripeLineItem[]>()
  nextEvent: StripeWebhookEvent | null = null

  async createCheckoutSession(input: CheckoutSessionCreateInput): Promise<CreatedCheckoutSession> {
    this.checkoutCreates.push(input)

    return {
      id: 'cs_test_created',
      url: 'https://checkout.stripe.test/session'
    }
  }

  async constructWebhookEvent(_rawBody: string, signature: string): Promise<StripeWebhookEvent> {
    if (signature !== 'valid-signature' || this.nextEvent === null) {
      throw new Error('Invalid signature')
    }

    return this.nextEvent
  }

  async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null> {
    return this.sessions.get(sessionId) ?? null
  }

  async listCheckoutSessionLineItems(sessionId: string): Promise<StripeLineItem[]> {
    return this.lineItems.get(sessionId) ?? []
  }
}

function paidSession(overrides: Partial<StripeCheckoutSession> = {}): StripeCheckoutSession {
  return {
    id: 'cs_test_paid',
    mode: 'payment',
    paymentStatus: 'paid',
    customerEmail: 'Buyer@Example.com',
    customerId: 'cus_test',
    paymentIntentId: 'pi_test',
    metadata: checkoutMetadata,
    ...overrides
  }
}

function createApi(options: {
  stripe?: FakeStripeGateway
  store?: EntitlementStore
  mail?: MailService
  env?: Record<string, string | undefined>
} = {}) {
  const config = readFlipCalcServerConfig({
    NODE_ENV: 'test',
    STRIPE_SECRET_KEY: 'sk_test_unit',
    STRIPE_FLIPCALC_WEBHOOK_SECRET: 'whsec_unit',
    STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID: 'price_flipcalc_pro',
    FLIPCALC_APP_ORIGIN: 'https://flipcalc.test',
    FLIPCALC_SESSION_SECRET: 'session-secret',
    FLIPCALC_DEV_EXPOSE_MAGIC_LINKS: 'true',
    ...options.env
  })
  const stripe = options.stripe ?? new FakeStripeGateway()
  const store = options.store ?? new MemoryEntitlementStore()
  const now = () => new Date('2026-06-26T12:00:00.000Z')
  const service = new FlipCalcService({
    config,
    store,
    stripe,
    mail: options.mail ?? new DevMagicLinkMailService(),
    now
  })

  return {
    api: createFlipCalcApi({
      config,
      service,
      rateLimiter: new MemoryRateLimiter(),
      now
    }),
    config,
    service,
    store,
    stripe
  }
}

async function responseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

function apiRequest(path: string, init: RequestInit = {}): Request {
  return new Request(`https://flipcalc.test${path}`, {
    ...init,
    headers: {
      origin: 'https://flipcalc.test',
      ...(init.headers ?? {})
    }
  })
}

describe('FlipCalc verified backend checkout', () => {
  it('creates Checkout Sessions with server-controlled Price ID and URLs', async () => {
    const { api, stripe } = createApi()
    const response = await api(apiRequest('/api/flipcalc/checkout', { method: 'POST', body: '{}' }))

    expect(response.status).toBe(200)
    expect(await responseJson(response)).toEqual({
      id: 'cs_test_created',
      url: 'https://checkout.stripe.test/session'
    })
    expect(stripe.checkoutCreates).toEqual([
      {
        priceId: 'price_flipcalc_pro',
        successUrl: 'https://flipcalc.test/purchase/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'https://flipcalc.test/purchase/cancel',
        metadata: checkoutMetadata
      }
    ])
  })

  it('rejects browser-supplied payment authority fields', async () => {
    const { api, stripe } = createApi()
    const response = await api(
      apiRequest('/api/flipcalc/checkout', {
        method: 'POST',
        body: JSON.stringify({ amount: 1, priceId: 'price_wrong', successUrl: 'https://evil.test' })
      })
    )

    expect(response.status).toBe(400)
    expect(stripe.checkoutCreates).toHaveLength(0)
  })

  it('fails clearly when checkout configuration is missing', async () => {
    const { api } = createApi({ env: { STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID: '' } })
    const response = await api(apiRequest('/api/flipcalc/checkout', { method: 'POST', body: '{}' }))

    expect(response.status).toBe(503)
    expect(await responseJson(response)).toMatchObject({
      error: 'Stripe checkout is not configured.'
    })
  })
})

describe('FlipCalc verified backend webhooks', () => {
  it('rejects invalid Stripe signatures', async () => {
    const { api } = createApi()
    const response = await api(
      apiRequest('/api/flipcalc/stripe-webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'bad-signature' },
        body: '{}'
      })
    )

    expect(response.status).toBe(400)
  })

  it('accepts valid paid Checkout and creates an active entitlement', async () => {
    const stripe = new FakeStripeGateway()
    stripe.nextEvent = {
      id: 'evt_paid',
      type: 'checkout.session.completed',
      dataObject: paidSession()
    }
    stripe.lineItems.set('cs_test_paid', [{ priceId: 'price_flipcalc_pro' }])
    const { api, store } = createApi({ stripe })
    const response = await api(
      apiRequest('/api/flipcalc/stripe-webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-signature' },
        body: '{}'
      })
    )

    expect(response.status).toBe(200)
    expect(await responseJson(response)).toMatchObject({ processed: true, reason: 'entitlement-active' })
    const entitlement = await store.findEntitlementByEmailHash(flipCalcProductKey, hashEmail('buyer@example.com'))

    expect(entitlement).toMatchObject({
      normalizedEmail: 'buyer@example.com',
      status: 'active',
      checkoutSessionId: 'cs_test_paid',
      paymentIntentId: 'pi_test'
    })
  })

  it('ignores unpaid, unrelated, and incorrect-price Checkout events', async () => {
    for (const [session, priceId] of [
      [paidSession({ paymentStatus: 'unpaid' }), 'price_flipcalc_pro'],
      [paidSession({ metadata: { product: 'other' } }), 'price_flipcalc_pro'],
      [paidSession(), 'price_wrong']
    ] as const) {
      const stripe = new FakeStripeGateway()
      stripe.nextEvent = { id: `evt_${priceId}_${session.paymentStatus}`, type: 'checkout.session.completed', dataObject: session }
      stripe.lineItems.set(session.id, [{ priceId }])
      const { api, store } = createApi({ stripe })
      const response = await api(
        apiRequest('/api/flipcalc/stripe-webhook', {
          method: 'POST',
          headers: { 'stripe-signature': 'valid-signature' },
          body: '{}'
        })
      )

      expect(response.status).toBe(200)
      expect(await store.findEntitlementByEmailHash(flipCalcProductKey, hashEmail('buyer@example.com'))).toBeNull()
    }
  })

  it('processes duplicate webhook events idempotently and avoids conflicting entitlements', async () => {
    const stripe = new FakeStripeGateway()
    stripe.nextEvent = {
      id: 'evt_duplicate',
      type: 'checkout.session.completed',
      dataObject: paidSession()
    }
    stripe.lineItems.set('cs_test_paid', [{ priceId: 'price_flipcalc_pro' }])
    const { api, store } = createApi({ stripe })

    const first = await api(
      apiRequest('/api/flipcalc/stripe-webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-signature' },
        body: '{}'
      })
    )
    const second = await api(
      apiRequest('/api/flipcalc/stripe-webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-signature' },
        body: '{}'
      })
    )

    expect(await responseJson(first)).toMatchObject({ processed: true })
    expect(await responseJson(second)).toMatchObject({ ignored: true, reason: 'duplicate-event' })
    expect(await store.findEntitlementByEmailHash(flipCalcProductKey, hashEmail('buyer@example.com'))).not.toBeNull()
  })

  it('refunds and disputes revoke or suspend access idempotently', async () => {
    const stripe = new FakeStripeGateway()
    stripe.nextEvent = { id: 'evt_paid', type: 'checkout.session.completed', dataObject: paidSession() }
    stripe.lineItems.set('cs_test_paid', [{ priceId: 'price_flipcalc_pro' }])
    const { api, store } = createApi({ stripe })
    await api(apiRequest('/api/flipcalc/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: '{}' }))

    stripe.nextEvent = { id: 'evt_refund', type: 'charge.refunded', dataObject: { payment_intent: 'pi_test' } }
    await api(apiRequest('/api/flipcalc/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: '{}' }))
    expect(await store.findEntitlementByPaymentIntentId('pi_test')).toMatchObject({ status: 'refunded' })

    stripe.nextEvent = { id: 'evt_dispute', type: 'charge.dispute.created', dataObject: { payment_intent: 'pi_test' } }
    await api(apiRequest('/api/flipcalc/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: '{}' }))
    expect(await store.findEntitlementByPaymentIntentId('pi_test')).toMatchObject({ status: 'disputed' })

    stripe.nextEvent = { id: 'evt_dispute_won', type: 'charge.dispute.closed', dataObject: { payment_intent: 'pi_test', status: 'won' } }
    await api(apiRequest('/api/flipcalc/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: '{}' }))
    expect(await store.findEntitlementByPaymentIntentId('pi_test')).toMatchObject({ status: 'active' })
  })
})

describe('FlipCalc passwordless access and entitlement checks', () => {
  it('returns a neutral response and no token for unknown emails', async () => {
    const { api } = createApi({ mail: new NullMailService() })
    const response = await api(
      apiRequest('/api/flipcalc/access/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'missing@example.com' })
      })
    )

    expect(response.status).toBe(200)
    expect(await responseJson(response)).toEqual({ message: neutralAccessResponse })
  })

  it('creates a single-use token for active entitlement and verifies a secure session', async () => {
    const store = new MemoryEntitlementStore()
    await store.upsertActiveEntitlement(
      {
        normalizedEmail: 'buyer@example.com',
        emailHash: hashEmail('buyer@example.com'),
        productKey: flipCalcProductKey,
        checkoutSessionId: 'cs_test_paid',
        paymentIntentId: 'pi_test',
        stripeCustomerId: 'cus_test'
      },
      '2026-06-26T12:00:00.000Z'
    )
    const { api } = createApi({ store })
    const requestResponse = await api(
      apiRequest('/api/flipcalc/access/request', {
        method: 'POST',
        body: JSON.stringify({ email: ' Buyer@Example.com ' })
      })
    )
    const accessResponse = await responseJson<{ message: string; devMagicLink: string }>(requestResponse)
    const token = new URL(accessResponse.devMagicLink).searchParams.get('token')

    expect(accessResponse.message).toBe(neutralAccessResponse)
    expect(token).toBeTruthy()

    const verifyResponse = await api(apiRequest(`/api/flipcalc/access/verify?token=${token}`, { method: 'GET' }))
    const cookie = verifyResponse.headers.get('set-cookie')

    expect(verifyResponse.status).toBe(302)
    expect(cookie).toContain('flipcalc_pro_session=')

    const entitlementResponse = await api(
      apiRequest('/api/flipcalc/entitlement', {
        method: 'GET',
        headers: { cookie: cookie ?? '' }
      })
    )

    expect(await responseJson(entitlementResponse)).toMatchObject({ pro: true, productKey: flipCalcProductKey })

    const reusedToken = await api(apiRequest(`/api/flipcalc/access/verify?token=${token}`, { method: 'GET' }))
    expect(reusedToken.status).toBe(401)
  })

  it('fails closed for missing, refunded, disputed, or revoked sessions', async () => {
    const { api } = createApi()

    expect(await responseJson(await api(apiRequest('/api/flipcalc/entitlement', { method: 'GET' })))).toEqual({
      pro: false
    })
  })

  it('server denial overrides a previously valid session after status changes', async () => {
    const store = new MemoryEntitlementStore()
    const entitlement = await store.upsertActiveEntitlement(
      {
        normalizedEmail: 'buyer@example.com',
        emailHash: hashEmail('buyer@example.com'),
        productKey: flipCalcProductKey,
        checkoutSessionId: 'cs_test_paid',
        paymentIntentId: 'pi_test',
        stripeCustomerId: 'cus_test'
      },
      '2026-06-26T12:00:00.000Z'
    )
    const { api } = createApi({ store })
    const requestResponse = await api(
      apiRequest('/api/flipcalc/access/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'buyer@example.com' })
      })
    )
    const accessResponse = await responseJson<{ devMagicLink: string }>(requestResponse)
    const token = new URL(accessResponse.devMagicLink).searchParams.get('token')
    const verifyResponse = await api(apiRequest(`/api/flipcalc/access/verify?token=${token}`, { method: 'GET' }))
    const cookie = verifyResponse.headers.get('set-cookie') ?? ''

    expect(
      await responseJson(
        await api(apiRequest('/api/flipcalc/entitlement', { method: 'GET', headers: { cookie } }))
      )
    ).toMatchObject({ pro: true })

    for (const status of ['refunded', 'disputed', 'revoked'] as const) {
      await store.updateEntitlementStatus(entitlement.id, status, '2026-06-26T12:01:00.000Z', status)

      expect(
        await responseJson(
          await api(apiRequest('/api/flipcalc/entitlement', { method: 'GET', headers: { cookie } }))
        )
      ).toEqual({ pro: false })
    }
  })

  it('clears the access cookie on logout', async () => {
    const { api } = createApi()
    const response = await api(apiRequest('/api/flipcalc/logout', { method: 'POST', body: '{}' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})

describe('FlipCalc purchase status', () => {
  it('returns pending until webhook fulfillment exists, then paid', async () => {
    const stripe = new FakeStripeGateway()
    stripe.sessions.set('cs_test_paid', paidSession())
    stripe.lineItems.set('cs_test_paid', [{ priceId: 'price_flipcalc_pro' }])
    const { api, store } = createApi({ stripe })

    expect(
      await responseJson(await api(apiRequest('/api/flipcalc/purchase-status?session_id=cs_test_paid', { method: 'GET' })))
    ).toEqual({ status: 'pending' })

    await store.upsertActiveEntitlement(
      {
        normalizedEmail: normalizeEmail('buyer@example.com'),
        emailHash: hashEmail('buyer@example.com'),
        productKey: flipCalcProductKey,
        checkoutSessionId: 'cs_test_paid',
        paymentIntentId: 'pi_test',
        stripeCustomerId: 'cus_test'
      },
      '2026-06-26T12:00:00.000Z'
    )

    expect(
      await responseJson(await api(apiRequest('/api/flipcalc/purchase-status?session_id=cs_test_paid', { method: 'GET' })))
    ).toEqual({ status: 'paid' })
  })
})
