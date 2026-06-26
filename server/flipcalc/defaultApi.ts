import { readFlipCalcServerConfig } from './config'
import { createMailService } from './mail'
import { MemoryEntitlementStore } from './memoryStore'
import { PostgresEntitlementStore } from './postgresStore'
import { MemoryRateLimiter } from './rateLimiter'
import { FlipCalcService } from './service'
import { StripeSdkGateway } from './stripeGateway'
import { createFlipCalcApi } from './http'

let cachedApi: ((request: Request) => Promise<Response>) | null = null

export function createDefaultFlipCalcApi(env: Record<string, string | undefined>): (request: Request) => Promise<Response> {
  const config = readFlipCalcServerConfig(env)
  const store =
    config.databaseUrl === null ? new MemoryEntitlementStore() : new PostgresEntitlementStore(config.databaseUrl)

  const stripe =
    config.stripeSecretKey !== null && config.stripeWebhookSecret !== null
      ? new StripeSdkGateway(config.stripeSecretKey, config.stripeWebhookSecret)
      : new StripeSdkGateway('sk_test_missing_configuration', 'whsec_missing_configuration')

  const now = () => new Date()
  const service = new FlipCalcService({
    config,
    store,
    stripe,
    mail: createMailService(config),
    now
  })

  return createFlipCalcApi({
    config,
    service,
    rateLimiter: new MemoryRateLimiter(),
    now
  })
}

export function getDefaultFlipCalcApi(): (request: Request) => Promise<Response> {
  cachedApi ??= createDefaultFlipCalcApi(process.env)

  return cachedApi
}
