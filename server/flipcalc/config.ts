export interface FlipCalcServerConfig {
  appOrigin: string
  apiOrigin: string | null
  stripeSecretKey: string | null
  stripeWebhookSecret: string | null
  stripePriceId: string | null
  sessionSecret: string | null
  databaseUrl: string | null
  resendApiKey: string | null
  accessEmailFrom: string | null
  accessTokenTtlMinutes: number
  sessionTtlDays: number
  nodeEnv: string
  exposeDevMagicLinks: boolean
}

export interface ServerConfigValidation {
  valid: boolean
  missing: string[]
}

function missingKeys(entries: Array<readonly [string, string | null]>): string[] {
  return entries.filter(([, value]) => value === null || value === '').map(([key]) => key)
}

function readOptional(env: Record<string, string | undefined>, key: string): string | null {
  const value = env[key]?.trim()

  return value === undefined || value.length === 0 ? null : value
}

function readPositiveInteger(env: Record<string, string | undefined>, key: string, fallback: number): number {
  const rawValue = readOptional(env, key)

  if (rawValue === null) {
    return fallback
  }

  const parsed = Number.parseInt(rawValue, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readFlipCalcServerConfig(env: Record<string, string | undefined>): FlipCalcServerConfig {
  return {
    appOrigin: readOptional(env, 'FLIPCALC_APP_ORIGIN') ?? 'http://localhost:5173',
    apiOrigin: readOptional(env, 'VITE_FLIPCALC_API_ORIGIN'),
    stripeSecretKey: readOptional(env, 'STRIPE_SECRET_KEY'),
    stripeWebhookSecret: readOptional(env, 'STRIPE_FLIPCALC_WEBHOOK_SECRET'),
    stripePriceId: readOptional(env, 'STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID'),
    sessionSecret: readOptional(env, 'FLIPCALC_SESSION_SECRET'),
    databaseUrl: readOptional(env, 'DATABASE_URL'),
    resendApiKey: readOptional(env, 'RESEND_API_KEY'),
    accessEmailFrom: readOptional(env, 'FLIPCALC_ACCESS_EMAIL_FROM'),
    accessTokenTtlMinutes: readPositiveInteger(env, 'FLIPCALC_ACCESS_TOKEN_TTL_MINUTES', 15),
    sessionTtlDays: readPositiveInteger(env, 'FLIPCALC_SESSION_TTL_DAYS', 30),
    nodeEnv: readOptional(env, 'NODE_ENV') ?? 'development',
    exposeDevMagicLinks: readOptional(env, 'FLIPCALC_DEV_EXPOSE_MAGIC_LINKS') === 'true'
  }
}

export function validateCheckoutConfig(config: FlipCalcServerConfig): ServerConfigValidation {
  const missing = missingKeys([
    ['STRIPE_SECRET_KEY', config.stripeSecretKey],
    ['STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID', config.stripePriceId],
    ['FLIPCALC_APP_ORIGIN', config.appOrigin]
  ])

  return { valid: missing.length === 0, missing }
}

export function validateWebhookConfig(config: FlipCalcServerConfig): ServerConfigValidation {
  const missing = missingKeys([
    ['STRIPE_SECRET_KEY', config.stripeSecretKey],
    ['STRIPE_FLIPCALC_WEBHOOK_SECRET', config.stripeWebhookSecret],
    ['STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID', config.stripePriceId]
  ])

  return { valid: missing.length === 0, missing }
}

export function validateSessionConfig(config: FlipCalcServerConfig): ServerConfigValidation {
  const missing = missingKeys([['FLIPCALC_SESSION_SECRET', config.sessionSecret]])

  return { valid: missing.length === 0, missing }
}
