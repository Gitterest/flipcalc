import {
  accessRequestPath,
  accessVerifyPath,
  entitlementPath,
  forbiddenCheckoutRequestFields,
  logoutPath,
  purchaseStatusPath,
  stripeWebhookPath,
  checkoutPath,
  flipCalcSessionCookieName
} from './constants'
import type { FlipCalcServerConfig } from './config'
import { validateCheckoutConfig, validateSessionConfig, validateWebhookConfig } from './config'
import { createClearedSessionCookie, createSessionCookie, readCookie, safeReturnPath, verifySignedSession } from './security'
import type { RateLimiter, StripeWebhookEvent } from './types'
import type { FlipCalcService } from './service'

export interface FlipCalcApiDependencies {
  config: FlipCalcServerConfig
  service: FlipCalcService
  rateLimiter: RateLimiter
  now: () => Date
}

interface JsonResponseInit {
  status?: number
  headers?: HeadersInit
}

const jsonHeaders = {
  'Content-Type': 'application/json'
}

function json(data: unknown, init: JsonResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      ...jsonHeaders,
      ...(init.headers ?? {})
    }
  })
}

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function mutationOriginIsAllowed(request: Request, config: FlipCalcServerConfig): boolean {
  const origin = request.headers.get('origin')

  if (origin === null) {
    return true
  }

  return origin === config.appOrigin
}

function rateLimit(
  dependencies: FlipCalcApiDependencies,
  key: string,
  limit: number,
  windowMs: number
): Response | null {
  const result = dependencies.rateLimiter.check(key, limit, windowMs, dependencies.now().getTime())

  if (result.allowed) {
    return null
  }

  return json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: result.retryAfterSeconds === undefined ? undefined : { 'Retry-After': String(result.retryAfterSeconds) }
    }
  )
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text()

  if (text.trim().length === 0) {
    return {}
  }

  const parsed = JSON.parse(text) as unknown

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON object body is required.')
  }

  return parsed as Record<string, unknown>
}

function hasForbiddenCheckoutFields(body: Record<string, unknown>): string[] {
  return forbiddenCheckoutRequestFields.filter((field) => field in body)
}

function pathFromRequest(url: URL): string {
  return url.pathname
}

export function createFlipCalcApi(dependencies: FlipCalcApiDependencies): (request: Request) => Promise<Response> {
  return async function handleFlipCalcApiRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = pathFromRequest(url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    try {
      if (path === checkoutPath && request.method === 'POST') {
        return handleCheckout(request, dependencies)
      }

      if (path === stripeWebhookPath && request.method === 'POST') {
        return handleStripeWebhook(request, dependencies)
      }

      if (path === accessRequestPath && request.method === 'POST') {
        return handleAccessRequest(request, dependencies)
      }

      if (path === accessVerifyPath && request.method === 'GET') {
        return handleAccessVerify(url, dependencies)
      }

      if (path === entitlementPath && request.method === 'GET') {
        return handleEntitlement(request, dependencies)
      }

      if (path === logoutPath && request.method === 'POST') {
        return handleLogout(dependencies)
      }

      if (path === purchaseStatusPath && request.method === 'GET') {
        return handlePurchaseStatus(url, dependencies)
      }

      return json({ error: 'Not found.' }, { status: 404 })
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : 'Request failed.' },
        { status: 500 }
      )
    }
  }
}

async function handleCheckout(request: Request, dependencies: FlipCalcApiDependencies): Promise<Response> {
  const configValidation = validateCheckoutConfig(dependencies.config)

  if (!configValidation.valid) {
    return json({ error: 'Stripe checkout is not configured.', missing: configValidation.missing }, { status: 503 })
  }

  if (!mutationOriginIsAllowed(request, dependencies.config)) {
    return json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const rateLimited = rateLimit(dependencies, `checkout:${getClientIp(request)}`, 5, 60_000)

  if (rateLimited !== null) {
    return rateLimited
  }

  const body = await readJsonObject(request)
  const forbiddenFields = hasForbiddenCheckoutFields(body)

  if (forbiddenFields.length > 0) {
    return json(
      { error: 'Checkout configuration is server controlled.', rejectedFields: forbiddenFields },
      { status: 400 }
    )
  }

  const session = await dependencies.service.createCheckoutSession()

  return json({ url: session.url, id: session.id })
}

async function handleStripeWebhook(request: Request, dependencies: FlipCalcApiDependencies): Promise<Response> {
  const configValidation = validateWebhookConfig(dependencies.config)

  if (!configValidation.valid) {
    return json({ error: 'Stripe webhook is not configured.', missing: configValidation.missing }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')

  if (signature === null || dependencies.config.stripeWebhookSecret === null) {
    return json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  const rawBody = await request.text()
  let event: StripeWebhookEvent

  try {
    event = await dependencies.service.constructWebhookEvent(rawBody, signature)
  } catch {
    return json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  const result = await dependencies.service.processWebhookEvent(event)

  return json({ received: true, ...result })
}

async function handleAccessRequest(request: Request, dependencies: FlipCalcApiDependencies): Promise<Response> {
  if (!mutationOriginIsAllowed(request, dependencies.config)) {
    return json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const body = await readJsonObject(request)
  const email = typeof body.email === 'string' ? body.email : ''
  const rateLimited = rateLimit(dependencies, `access:${getClientIp(request)}:${email.toLowerCase()}`, 4, 15 * 60_000)

  if (rateLimited !== null) {
    return rateLimited
  }

  let result: Awaited<ReturnType<FlipCalcService['requestAccess']>>

  try {
    result = await dependencies.service.requestAccess(email)
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'A valid email address is required.' },
      { status: 400 }
    )
  }

  return json(result)
}

async function handleAccessVerify(url: URL, dependencies: FlipCalcApiDependencies): Promise<Response> {
  const sessionValidation = validateSessionConfig(dependencies.config)

  if (!sessionValidation.valid) {
    return json({ error: 'Session configuration is missing.', missing: sessionValidation.missing }, { status: 503 })
  }

  const token = url.searchParams.get('token') ?? ''
  const rateLimited = rateLimit(dependencies, `verify:${token.slice(0, 12)}`, 8, 15 * 60_000)

  if (rateLimited !== null) {
    return rateLimited
  }

  const result = await dependencies.service.verifyAccessToken(token)

  if (!result.ok || result.sessionCookie === undefined) {
    return json({ error: 'Access link is invalid or expired.' }, { status: 401 })
  }

  const maxAgeSeconds = dependencies.config.sessionTtlDays * 24 * 60 * 60
  const secure = dependencies.config.nodeEnv === 'production'
  const returnTo = safeReturnPath(url.searchParams.get('return_to'))

  return new Response(null, {
    status: 302,
    headers: {
      Location: returnTo,
      'Set-Cookie': createSessionCookie(result.sessionCookie, maxAgeSeconds, secure)
    }
  })
}

async function handleEntitlement(request: Request, dependencies: FlipCalcApiDependencies): Promise<Response> {
  if (dependencies.config.sessionSecret === null) {
    return json({ pro: false })
  }

  const cookie = readCookie(request.headers.get('cookie'), flipCalcSessionCookieName)

  if (cookie === null) {
    return json({ pro: false })
  }

  const payload = verifySignedSession(cookie, dependencies.config.sessionSecret, dependencies.now().getTime())

  if (payload === null) {
    return json({ pro: false })
  }

  const entitlement = await dependencies.service.checkSessionEntitlement(payload.entitlementId, payload.productKey)

  return json({
    ...entitlement,
    expiresAt: entitlement.pro ? new Date(payload.expiresAt).toISOString() : undefined
  })
}

async function handleLogout(dependencies: FlipCalcApiDependencies): Promise<Response> {
  const secure = dependencies.config.nodeEnv === 'production'

  return json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': createClearedSessionCookie(secure)
      }
    }
  )
}

async function handlePurchaseStatus(url: URL, dependencies: FlipCalcApiDependencies): Promise<Response> {
  const sessionId = url.searchParams.get('session_id') ?? ''
  const status = await dependencies.service.purchaseStatus(sessionId)

  return json({ status })
}
