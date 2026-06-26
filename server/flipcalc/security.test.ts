import { describe, expect, it } from 'vitest'
import {
  createAccessToken,
  createSignedSession,
  hashAccessToken,
  hashEmail,
  isValidAccessTokenFormat,
  normalizeEmail,
  verifySignedSession
} from './security'

describe('FlipCalc security helpers', () => {
  it('normalizes and hashes email consistently', () => {
    const normalized = normalizeEmail(' Buyer@Example.COM ')

    expect(normalized).toBe('buyer@example.com')
    expect(hashEmail(normalized)).toBe(hashEmail('buyer@example.com'))
  })

  it('creates random access tokens and stores only hashes', () => {
    const first = createAccessToken()
    const second = createAccessToken()

    expect(first.token).not.toBe(second.token)
    expect(first.tokenHash).toBe(hashAccessToken(first.token))
    expect(first.tokenHash).not.toContain(first.token)
    expect(isValidAccessTokenFormat(first.token)).toBe(true)
  })

  it('signs sessions and rejects tampered or expired payloads', () => {
    const session = createSignedSession(
      {
        entitlementId: 'entitlement-1',
        productKey: 'flipcalc_pro_lifetime',
        expiresAt: 2_000
      },
      'session-secret'
    )

    expect(verifySignedSession(session, 'session-secret', 1_000)).toMatchObject({
      entitlementId: 'entitlement-1'
    })
    expect(verifySignedSession(`${session}x`, 'session-secret', 1_000)).toBeNull()
    expect(verifySignedSession(session, 'wrong-secret', 1_000)).toBeNull()
    expect(verifySignedSession(session, 'session-secret', 2_001)).toBeNull()
  })
})
