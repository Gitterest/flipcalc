import type {
  AccessTokenRecord,
  Entitlement,
  EntitlementPurchase,
  EntitlementStatus,
  EntitlementStore,
  ProcessedStripeEvent
} from './types'

function createEntitlementId(emailHash: string, productKey: string): string {
  return `${productKey}:${emailHash}`
}

export class MemoryEntitlementStore implements EntitlementStore {
  private readonly entitlementsById = new Map<string, Entitlement>()
  private readonly processedEvents = new Map<string, ProcessedStripeEvent>()
  private readonly accessTokensByHash = new Map<string, AccessTokenRecord>()

  async upsertActiveEntitlement(purchase: EntitlementPurchase, nowIso: string): Promise<Entitlement> {
    const id = createEntitlementId(purchase.emailHash, purchase.productKey)
    const existing = this.entitlementsById.get(id)
    const entitlement: Entitlement = {
      id,
      normalizedEmail: purchase.normalizedEmail,
      emailHash: purchase.emailHash,
      productKey: purchase.productKey,
      status: 'active',
      checkoutSessionId: purchase.checkoutSessionId,
      paymentIntentId: purchase.paymentIntentId,
      stripeCustomerId: purchase.stripeCustomerId,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      activatedAt: existing?.activatedAt ?? nowIso,
      revokedAt: null,
      suspensionReason: null
    }

    this.entitlementsById.set(id, entitlement)

    return entitlement
  }

  async findEntitlementById(entitlementId: string): Promise<Entitlement | null> {
    return this.entitlementsById.get(entitlementId) ?? null
  }

  async findEntitlementByEmailHash(productKey: string, emailHash: string): Promise<Entitlement | null> {
    return this.entitlementsById.get(createEntitlementId(emailHash, productKey)) ?? null
  }

  async findEntitlementByCheckoutSessionId(checkoutSessionId: string): Promise<Entitlement | null> {
    return (
      [...this.entitlementsById.values()].find((entitlement) => entitlement.checkoutSessionId === checkoutSessionId) ??
      null
    )
  }

  async findEntitlementByPaymentIntentId(paymentIntentId: string): Promise<Entitlement | null> {
    return (
      [...this.entitlementsById.values()].find((entitlement) => entitlement.paymentIntentId === paymentIntentId) ?? null
    )
  }

  async updateEntitlementStatus(
    entitlementId: string,
    status: EntitlementStatus,
    nowIso: string,
    suspensionReason: string | null
  ): Promise<Entitlement | null> {
    const existing = this.entitlementsById.get(entitlementId)

    if (existing === undefined) {
      return null
    }

    const updated: Entitlement = {
      ...existing,
      status,
      updatedAt: nowIso,
      revokedAt: status === 'active' ? null : nowIso,
      suspensionReason
    }

    this.entitlementsById.set(entitlementId, updated)

    return updated
  }

  async markStripeEventProcessed(event: ProcessedStripeEvent): Promise<void> {
    this.processedEvents.set(event.id, event)
  }

  async hasProcessedStripeEvent(eventId: string): Promise<boolean> {
    return this.processedEvents.has(eventId)
  }

  async createAccessToken(record: AccessTokenRecord): Promise<void> {
    this.accessTokensByHash.set(record.tokenHash, record)
  }

  async consumeAccessToken(tokenHash: string, nowIso: string): Promise<AccessTokenRecord | null> {
    const record = this.accessTokensByHash.get(tokenHash)

    if (record === undefined || record.usedAt !== null || record.expiresAt <= nowIso) {
      return null
    }

    const usedRecord = {
      ...record,
      usedAt: nowIso
    }

    this.accessTokensByHash.set(tokenHash, usedRecord)

    return usedRecord
  }

  async cleanupExpiredAccessTokens(nowIso: string): Promise<void> {
    for (const [tokenHash, record] of this.accessTokensByHash) {
      if (record.expiresAt <= nowIso) {
        this.accessTokensByHash.delete(tokenHash)
      }
    }
  }
}
