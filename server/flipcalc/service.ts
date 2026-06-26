import {
  checkoutMetadata,
  flipCalcEntitlementKey,
  flipCalcProductKey,
  flipCalcSource,
  neutralAccessResponse
} from './constants'
import type { FlipCalcServerConfig } from './config'
import {
  createAccessToken,
  createSignedSession,
  hashAccessToken,
  hashEmail,
  isValidAccessTokenFormat,
  isValidEmail,
  normalizeEmail
} from './security'
import type {
  Entitlement,
  EntitlementStore,
  MailService,
  PurchaseStatusState,
  StripeCheckoutSession,
  StripeGateway,
  StripeLineItem,
  StripeWebhookEvent
} from './types'

export interface FlipCalcServiceDependencies {
  config: FlipCalcServerConfig
  store: EntitlementStore
  stripe: StripeGateway
  mail: MailService
  now: () => Date
}

export interface CheckoutSessionResult {
  id: string
  url: string
}

export interface AccessRequestResult {
  message: string
  devMagicLink?: string
}

export interface VerifyAccessResult {
  ok: boolean
  sessionCookie?: string
  entitlement?: Entitlement
}

export interface EntitlementCheckResult {
  pro: boolean
  productKey?: string
  status?: string
  expiresAt?: string
}

export interface WebhookProcessResult {
  processed: boolean
  ignored: boolean
  reason: string
}

const magicLinkPath = '/api/flipcalc/access/verify'

function nowIso(now: () => Date): string {
  return now().toISOString()
}

function hasExpectedMetadata(metadata: Record<string, string | undefined>): boolean {
  return (
    metadata.product === flipCalcProductKey &&
    metadata.entitlement === flipCalcEntitlementKey &&
    metadata.source === flipCalcSource
  )
}

function hasConfiguredPrice(lineItems: StripeLineItem[], priceId: string): boolean {
  return lineItems.some((lineItem) => lineItem.priceId === priceId)
}

function usableEmail(session: StripeCheckoutSession): string | null {
  return session.customerEmail !== null && isValidEmail(session.customerEmail) ? normalizeEmail(session.customerEmail) : null
}

function extractStringField(object: unknown, key: string): string | null {
  if (typeof object !== 'object' || object === null || !(key in object)) {
    return null
  }

  const value = (object as Record<string, unknown>)[key]

  return typeof value === 'string' ? value : null
}

function extractDisputeStatus(object: unknown): string | null {
  return extractStringField(object, 'status')
}

function isCheckoutSession(object: unknown): object is StripeCheckoutSession {
  return (
    typeof object === 'object' &&
    object !== null &&
    typeof (object as Partial<StripeCheckoutSession>).id === 'string' &&
    'paymentStatus' in object
  )
}

export class FlipCalcService {
  constructor(private readonly dependencies: FlipCalcServiceDependencies) {}

  async constructWebhookEvent(rawBody: string, signature: string): Promise<StripeWebhookEvent> {
    return this.dependencies.stripe.constructWebhookEvent(rawBody, signature)
  }

  async createCheckoutSession(): Promise<CheckoutSessionResult> {
    const { config, stripe } = this.dependencies

    if (config.stripePriceId === null) {
      throw new Error('STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID is required.')
    }

    const session = await stripe.createCheckoutSession({
      priceId: config.stripePriceId,
      successUrl: `${config.appOrigin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.appOrigin}/purchase/cancel`,
      metadata: checkoutMetadata
    })

    return session
  }

  async processWebhookEvent(event: StripeWebhookEvent): Promise<WebhookProcessResult> {
    const { store, now } = this.dependencies

    if (await store.hasProcessedStripeEvent(event.id)) {
      return { processed: false, ignored: true, reason: 'duplicate-event' }
    }

    let result: WebhookProcessResult

    if (event.type === 'checkout.session.completed') {
      result = await this.processCheckoutCompleted(event.dataObject)
    } else if (event.type === 'charge.refunded') {
      result = await this.processPaymentStatusChange(event.dataObject, 'refunded', 'refunded')
    } else if (event.type === 'charge.dispute.created') {
      result = await this.processPaymentStatusChange(event.dataObject, 'disputed', 'disputed')
    } else if (event.type === 'charge.dispute.closed') {
      result = await this.processDisputeClosed(event.dataObject)
    } else {
      result = { processed: false, ignored: true, reason: 'unhandled-event' }
    }

    await store.markStripeEventProcessed({
      id: event.id,
      type: event.type,
      createdAt: nowIso(now)
    })

    return result
  }

  async requestAccess(email: string): Promise<AccessRequestResult> {
    const { config, mail, now, store } = this.dependencies
    const normalizedEmail = normalizeEmail(email)

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('A valid email address is required.')
    }

    await store.cleanupExpiredAccessTokens(nowIso(now))

    const emailHash = hashEmail(normalizedEmail)
    const entitlement = await store.findEntitlementByEmailHash(flipCalcProductKey, emailHash)

    if (entitlement === null || entitlement.status !== 'active') {
      return { message: neutralAccessResponse }
    }

    const accessToken = createAccessToken()
    const createdAt = now()
    const expiresAt = new Date(createdAt.getTime() + config.accessTokenTtlMinutes * 60_000)
    const magicLink = `${config.appOrigin}${magicLinkPath}?token=${encodeURIComponent(accessToken.token)}`

    await store.createAccessToken({
      id: accessToken.tokenHash,
      tokenHash: accessToken.tokenHash,
      entitlementId: entitlement.id,
      emailHash,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usedAt: null
    })

    const mailResult = await mail.sendMagicLink({
      email: normalizedEmail,
      magicLink,
      expiresAt: expiresAt.toISOString()
    })

    return {
      message: neutralAccessResponse,
      devMagicLink: mailResult.devMagicLink
    }
  }

  async verifyAccessToken(token: string): Promise<VerifyAccessResult> {
    const { config, now, store } = this.dependencies

    if (config.sessionSecret === null || !isValidAccessTokenFormat(token)) {
      return { ok: false }
    }

    const tokenHash = hashAccessToken(token)
    const consumedToken = await store.consumeAccessToken(tokenHash, nowIso(now))

    if (consumedToken === null) {
      return { ok: false }
    }

    const entitlement = await store.findEntitlementById(consumedToken.entitlementId)

    if (entitlement === null || entitlement.status !== 'active') {
      return { ok: false }
    }

    const expiresAt = now().getTime() + config.sessionTtlDays * 24 * 60 * 60 * 1000
    const session = createSignedSession(
      {
        entitlementId: entitlement.id,
        productKey: entitlement.productKey,
        expiresAt
      },
      config.sessionSecret
    )

    return {
      ok: true,
      entitlement,
      sessionCookie: session
    }
  }

  async checkSessionEntitlement(entitlementId: string, productKey: string): Promise<EntitlementCheckResult> {
    const entitlement = await this.dependencies.store.findEntitlementById(entitlementId)

    if (entitlement === null || entitlement.productKey !== productKey || entitlement.status !== 'active') {
      return { pro: false }
    }

    return {
      pro: true,
      productKey: entitlement.productKey,
      status: entitlement.status
    }
  }

  async purchaseStatus(sessionId: string): Promise<PurchaseStatusState> {
    const { config, store, stripe } = this.dependencies

    if (config.stripePriceId === null || sessionId.trim().length === 0) {
      return 'failed'
    }

    const session = await stripe.retrieveCheckoutSession(sessionId)

    if (session === null || !this.isValidPaidFlipCalcSession(session)) {
      return 'failed'
    }

    const lineItems = await stripe.listCheckoutSessionLineItems(session.id)

    if (!hasConfiguredPrice(lineItems, config.stripePriceId)) {
      return 'failed'
    }

    const entitlement = await store.findEntitlementByCheckoutSessionId(session.id)

    if (entitlement === null) {
      return 'pending'
    }

    return entitlement.status === 'active' ? 'paid' : 'failed'
  }

  private async processCheckoutCompleted(object: unknown): Promise<WebhookProcessResult> {
    const { config, now, store, stripe } = this.dependencies

    if (config.stripePriceId === null) {
      return { processed: false, ignored: true, reason: 'missing-price-config' }
    }

    const session = isCheckoutSession(object) ? object : await this.retrieveSessionFromObject(object)

    if (session === null || !this.isValidPaidFlipCalcSession(session)) {
      return { processed: false, ignored: true, reason: 'invalid-checkout-session' }
    }

    const lineItems = await stripe.listCheckoutSessionLineItems(session.id)

    if (!hasConfiguredPrice(lineItems, config.stripePriceId)) {
      return { processed: false, ignored: true, reason: 'incorrect-price' }
    }

    const normalizedEmail = usableEmail(session)

    if (normalizedEmail === null) {
      return { processed: false, ignored: true, reason: 'missing-email' }
    }

    await store.upsertActiveEntitlement(
      {
        normalizedEmail,
        emailHash: hashEmail(normalizedEmail),
        productKey: flipCalcProductKey,
        checkoutSessionId: session.id,
        paymentIntentId: session.paymentIntentId,
        stripeCustomerId: session.customerId
      },
      nowIso(now)
    )

    return { processed: true, ignored: false, reason: 'entitlement-active' }
  }

  private async processPaymentStatusChange(
    object: unknown,
    status: 'refunded' | 'disputed',
    reason: string
  ): Promise<WebhookProcessResult> {
    const paymentIntentId = extractStringField(object, 'payment_intent')

    if (paymentIntentId === null) {
      return { processed: false, ignored: true, reason: 'missing-payment-intent' }
    }

    const entitlement = await this.dependencies.store.findEntitlementByPaymentIntentId(paymentIntentId)

    if (entitlement === null) {
      return { processed: false, ignored: true, reason: 'entitlement-not-found' }
    }

    await this.dependencies.store.updateEntitlementStatus(entitlement.id, status, nowIso(this.dependencies.now), reason)

    return { processed: true, ignored: false, reason }
  }

  private async processDisputeClosed(object: unknown): Promise<WebhookProcessResult> {
    const paymentIntentId = extractStringField(object, 'payment_intent')
    const disputeStatus = extractDisputeStatus(object)

    if (paymentIntentId === null) {
      return { processed: false, ignored: true, reason: 'missing-payment-intent' }
    }

    const entitlement = await this.dependencies.store.findEntitlementByPaymentIntentId(paymentIntentId)

    if (entitlement === null) {
      return { processed: false, ignored: true, reason: 'entitlement-not-found' }
    }

    const nextStatus = disputeStatus === 'won' ? 'active' : 'disputed'
    await this.dependencies.store.updateEntitlementStatus(
      entitlement.id,
      nextStatus,
      nowIso(this.dependencies.now),
      nextStatus === 'active' ? null : 'dispute-not-won'
    )

    return { processed: true, ignored: false, reason: nextStatus === 'active' ? 'dispute-won' : 'dispute-not-won' }
  }

  private async retrieveSessionFromObject(object: unknown): Promise<StripeCheckoutSession | null> {
    const sessionId = extractStringField(object, 'id')

    return sessionId === null ? null : this.dependencies.stripe.retrieveCheckoutSession(sessionId)
  }

  private isValidPaidFlipCalcSession(session: StripeCheckoutSession): boolean {
    return (
      session.mode === 'payment' &&
      session.paymentStatus === 'paid' &&
      hasExpectedMetadata(session.metadata)
    )
  }
}
