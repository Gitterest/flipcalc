import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { flipCalcSessionCookieName } from './constants'

export interface CreatedAccessToken {
  token: string
  tokenHash: string
}

export interface SessionPayload {
  entitlementId: string
  productKey: string
  expiresAt: number
}

const base64UrlPattern = /^[A-Za-z0-9_-]+$/

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function hashEmail(normalizedEmail: string): string {
  return createHash('sha256').update(normalizedEmail).digest('hex')
}

export function hashAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createAccessToken(): CreatedAccessToken {
  const token = randomBytes(32).toString('base64url')

  return {
    token,
    tokenHash: hashAccessToken(token)
  }
}

export function isValidAccessTokenFormat(token: string): boolean {
  return token.length >= 32 && token.length <= 256 && base64UrlPattern.test(token)
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createSignedSession(payload: SessionPayload, secret: string): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export function verifySignedSession(session: string, secret: string, nowMs: number): SessionPayload | null {
  const [encodedPayload, signature] = session.split('.')

  if (encodedPayload === undefined || signature === undefined) {
    return null
  }

  const expectedSignature = sign(encodedPayload, secret)
  const expected = Buffer.from(expectedSignature)
  const supplied = Buffer.from(signature)

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>

    if (
      typeof payload.entitlementId !== 'string' ||
      typeof payload.productKey !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= nowMs
    ) {
      return null
    }

    return {
      entitlementId: payload.entitlementId,
      productKey: payload.productKey,
      expiresAt: payload.expiresAt
    }
  } catch {
    return null
  }
}

export function createSessionCookie(sessionValue: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${flipCalcSessionCookieName}=${sessionValue}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

export function createClearedSessionCookie(secure: boolean): string {
  const parts = [
    `${flipCalcSessionCookieName}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (cookieHeader === null) {
    return null
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const prefix = `${name}=`
  const cookie = cookies.find((entry) => entry.startsWith(prefix))

  return cookie === undefined ? null : decodeURIComponent(cookie.slice(prefix.length))
}

export function safeReturnPath(value: string | null): string {
  if (value === null || value.length === 0 || !value.startsWith('/') || value.startsWith('//')) {
    return '/purchase/success?access=verified'
  }

  return value
}
