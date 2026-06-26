export type EntitlementStatus = 'active' | 'refunded' | 'disputed' | 'revoked'
export type PurchaseStatusState = 'pending' | 'paid' | 'failed'

export interface Entitlement {
  id: string
  normalizedEmail: string
  emailHash: string
  productKey: string
  status: EntitlementStatus
  checkoutSessionId: string | null
  paymentIntentId: string | null
  stripeCustomerId: string | null
  createdAt: string
  updatedAt: string
  activatedAt: string | null
  revokedAt: string | null
  suspensionReason: string | null
}

export interface ProcessedStripeEvent {
  id: string
  type: string
  createdAt: string
}

export interface AccessTokenRecord {
  id: string
  tokenHash: string
  entitlementId: string
  emailHash: string
  createdAt: string
  expiresAt: string
  usedAt: string | null
}

export interface EntitlementPurchase {
  normalizedEmail: string
  emailHash: string
  productKey: string
  checkoutSessionId: string
  paymentIntentId: string | null
  stripeCustomerId: string | null
}

export interface StripeCheckoutSession {
  id: string
  mode: string | null
  paymentStatus: string | null
  customerEmail: string | null
  customerId: string | null
  paymentIntentId: string | null
  metadata: Record<string, string | undefined>
}

export interface StripeLineItem {
  priceId: string | null
}

export interface StripeWebhookEvent {
  id: string
  type: string
  dataObject: unknown
}

export interface CreatedCheckoutSession {
  id: string
  url: string
}

export interface CheckoutSessionCreateInput {
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}

export interface StripeGateway {
  createCheckoutSession(input: CheckoutSessionCreateInput): Promise<CreatedCheckoutSession>
  constructWebhookEvent(rawBody: string, signature: string): Promise<StripeWebhookEvent>
  retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null>
  listCheckoutSessionLineItems(sessionId: string): Promise<StripeLineItem[]>
}

export interface EntitlementStore {
  upsertActiveEntitlement(purchase: EntitlementPurchase, nowIso: string): Promise<Entitlement>
  findEntitlementById(entitlementId: string): Promise<Entitlement | null>
  findEntitlementByEmailHash(productKey: string, emailHash: string): Promise<Entitlement | null>
  findEntitlementByCheckoutSessionId(checkoutSessionId: string): Promise<Entitlement | null>
  findEntitlementByPaymentIntentId(paymentIntentId: string): Promise<Entitlement | null>
  updateEntitlementStatus(
    entitlementId: string,
    status: EntitlementStatus,
    nowIso: string,
    suspensionReason: string | null
  ): Promise<Entitlement | null>
  markStripeEventProcessed(event: ProcessedStripeEvent): Promise<void>
  hasProcessedStripeEvent(eventId: string): Promise<boolean>
  createAccessToken(record: AccessTokenRecord): Promise<void>
  consumeAccessToken(tokenHash: string, nowIso: string): Promise<AccessTokenRecord | null>
  cleanupExpiredAccessTokens(nowIso: string): Promise<void>
}

export interface MailSendResult {
  delivered: boolean
  devMagicLink?: string
}

export interface MailService {
  sendMagicLink(input: { email: string; magicLink: string; expiresAt: string }): Promise<MailSendResult>
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number, nowMs: number): RateLimitResult
}
