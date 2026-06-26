import pg from 'pg'
import type {
  AccessTokenRecord,
  Entitlement,
  EntitlementPurchase,
  EntitlementStatus,
  EntitlementStore,
  ProcessedStripeEvent
} from './types'

const { Pool } = pg

export const postgresSchemaSql = `
create table if not exists flipcalc_entitlements (
  id text primary key,
  normalized_email text not null,
  email_hash text not null,
  product_key text not null,
  status text not null,
  checkout_session_id text,
  payment_intent_id text,
  stripe_customer_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  activated_at timestamptz,
  revoked_at timestamptz,
  suspension_reason text
);

create unique index if not exists flipcalc_entitlements_email_product_idx
  on flipcalc_entitlements(email_hash, product_key);

create index if not exists flipcalc_entitlements_checkout_session_idx
  on flipcalc_entitlements(checkout_session_id);

create index if not exists flipcalc_entitlements_payment_intent_idx
  on flipcalc_entitlements(payment_intent_id);

create table if not exists flipcalc_processed_stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null
);

create table if not exists flipcalc_access_tokens (
  id text primary key,
  token_hash text not null unique,
  entitlement_id text not null references flipcalc_entitlements(id),
  email_hash text not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists flipcalc_access_tokens_expires_idx
  on flipcalc_access_tokens(expires_at);
`

interface EntitlementRow {
  id: string
  normalized_email: string
  email_hash: string
  product_key: string
  status: EntitlementStatus
  checkout_session_id: string | null
  payment_intent_id: string | null
  stripe_customer_id: string | null
  created_at: Date
  updated_at: Date
  activated_at: Date | null
  revoked_at: Date | null
  suspension_reason: string | null
}

interface AccessTokenRow {
  id: string
  token_hash: string
  entitlement_id: string
  email_hash: string
  created_at: Date
  expires_at: Date
  used_at: Date | null
}

function entitlementId(emailHash: string, productKey: string): string {
  return `${productKey}:${emailHash}`
}

function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString()
}

function mapEntitlement(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    normalizedEmail: row.normalized_email,
    emailHash: row.email_hash,
    productKey: row.product_key,
    status: row.status,
    checkoutSessionId: row.checkout_session_id,
    paymentIntentId: row.payment_intent_id,
    stripeCustomerId: row.stripe_customer_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    activatedAt: toIso(row.activated_at),
    revokedAt: toIso(row.revoked_at),
    suspensionReason: row.suspension_reason
  }
}

function mapAccessToken(row: AccessTokenRow): AccessTokenRecord {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    entitlementId: row.entitlement_id,
    emailHash: row.email_hash,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    usedAt: toIso(row.used_at)
  }
}

export class PostgresEntitlementStore implements EntitlementStore {
  private readonly pool: pg.Pool

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl })
  }

  async migrate(): Promise<void> {
    await this.pool.query(postgresSchemaSql)
  }

  async upsertActiveEntitlement(purchase: EntitlementPurchase, nowIso: string): Promise<Entitlement> {
    const id = entitlementId(purchase.emailHash, purchase.productKey)
    const result = await this.pool.query<EntitlementRow>(
      `insert into flipcalc_entitlements (
        id, normalized_email, email_hash, product_key, status, checkout_session_id, payment_intent_id,
        stripe_customer_id, created_at, updated_at, activated_at, revoked_at, suspension_reason
      ) values ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $8, $8, null, null)
      on conflict (email_hash, product_key) do update set
        normalized_email = excluded.normalized_email,
        status = 'active',
        checkout_session_id = excluded.checkout_session_id,
        payment_intent_id = excluded.payment_intent_id,
        stripe_customer_id = excluded.stripe_customer_id,
        updated_at = excluded.updated_at,
        activated_at = coalesce(flipcalc_entitlements.activated_at, excluded.activated_at),
        revoked_at = null,
        suspension_reason = null
      returning *`,
      [
        id,
        purchase.normalizedEmail,
        purchase.emailHash,
        purchase.productKey,
        purchase.checkoutSessionId,
        purchase.paymentIntentId,
        purchase.stripeCustomerId,
        nowIso
      ]
    )

    return mapEntitlement(result.rows[0])
  }

  async findEntitlementById(entitlementIdValue: string): Promise<Entitlement | null> {
    return this.findOne('select * from flipcalc_entitlements where id = $1', [entitlementIdValue])
  }

  async findEntitlementByEmailHash(productKey: string, emailHash: string): Promise<Entitlement | null> {
    return this.findOne('select * from flipcalc_entitlements where product_key = $1 and email_hash = $2', [
      productKey,
      emailHash
    ])
  }

  async findEntitlementByCheckoutSessionId(checkoutSessionId: string): Promise<Entitlement | null> {
    return this.findOne('select * from flipcalc_entitlements where checkout_session_id = $1', [checkoutSessionId])
  }

  async findEntitlementByPaymentIntentId(paymentIntentId: string): Promise<Entitlement | null> {
    return this.findOne('select * from flipcalc_entitlements where payment_intent_id = $1', [paymentIntentId])
  }

  async updateEntitlementStatus(
    entitlementIdValue: string,
    status: EntitlementStatus,
    nowIso: string,
    suspensionReason: string | null
  ): Promise<Entitlement | null> {
    const result = await this.pool.query<EntitlementRow>(
      `update flipcalc_entitlements set
        status = $2,
        updated_at = $3,
        revoked_at = case when $2 = 'active' then null else $3::timestamptz end,
        suspension_reason = $4
      where id = $1
      returning *`,
      [entitlementIdValue, status, nowIso, suspensionReason]
    )

    return result.rows[0] === undefined ? null : mapEntitlement(result.rows[0])
  }

  async markStripeEventProcessed(event: ProcessedStripeEvent): Promise<void> {
    await this.pool.query(
      `insert into flipcalc_processed_stripe_events (id, type, created_at)
       values ($1, $2, $3)
       on conflict (id) do nothing`,
      [event.id, event.type, event.createdAt]
    )
  }

  async hasProcessedStripeEvent(eventId: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      'select exists(select 1 from flipcalc_processed_stripe_events where id = $1)',
      [eventId]
    )

    return result.rows[0]?.exists ?? false
  }

  async createAccessToken(record: AccessTokenRecord): Promise<void> {
    await this.pool.query(
      `insert into flipcalc_access_tokens (id, token_hash, entitlement_id, email_hash, created_at, expires_at, used_at)
       values ($1, $2, $3, $4, $5, $6, null)`,
      [record.id, record.tokenHash, record.entitlementId, record.emailHash, record.createdAt, record.expiresAt]
    )
  }

  async consumeAccessToken(tokenHash: string, nowIso: string): Promise<AccessTokenRecord | null> {
    const result = await this.pool.query<AccessTokenRow>(
      `update flipcalc_access_tokens set used_at = $2
       where token_hash = $1 and used_at is null and expires_at > $2
       returning *`,
      [tokenHash, nowIso]
    )

    return result.rows[0] === undefined ? null : mapAccessToken(result.rows[0])
  }

  async cleanupExpiredAccessTokens(nowIso: string): Promise<void> {
    await this.pool.query('delete from flipcalc_access_tokens where expires_at <= $1', [nowIso])
  }

  private async findOne(query: string, values: unknown[]): Promise<Entitlement | null> {
    const result = await this.pool.query<EntitlementRow>(query, values)

    return result.rows[0] === undefined ? null : mapEntitlement(result.rows[0])
  }
}
