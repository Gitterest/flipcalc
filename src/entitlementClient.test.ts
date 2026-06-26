import { describe, expect, it } from 'vitest'
import {
  apiUrl,
  fetchEntitlement,
  fetchPurchaseStatus,
  logoutProAccess,
  requestProAccess,
  startVerifiedCheckout,
  type Fetcher
} from './entitlementClient'

const configuration = { apiOrigin: 'https://api.flipcalc.test' }

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('entitlement client', () => {
  it('builds same-origin or configured API URLs', () => {
    expect(apiUrl('/api/flipcalc/entitlement', { apiOrigin: '' })).toBe('/api/flipcalc/entitlement')
    expect(apiUrl('/api/flipcalc/entitlement', configuration)).toBe(
      'https://api.flipcalc.test/api/flipcalc/entitlement'
    )
  })

  it('starts verified checkout through the backend endpoint', async () => {
    const calls: RequestInit[] = []
    const fetcher: Fetcher = async (_input, init) => {
      calls.push(init ?? {})
      return jsonResponse({ id: 'cs_test', url: 'https://checkout.stripe.test/session' })
    }

    await expect(startVerifiedCheckout(configuration, fetcher)).resolves.toEqual({
      id: 'cs_test',
      url: 'https://checkout.stripe.test/session'
    })
    expect(calls[0]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      body: '{}'
    })
  })

  it('requests access without exposing entitlement existence', async () => {
    const fetcher: Fetcher = async (_input, init) => {
      expect(init?.body).toBe(JSON.stringify({ email: 'buyer@example.com' }))
      return jsonResponse({ message: 'If that email has FlipCalc Pro access, a sign-in link will be sent.' })
    }

    await expect(requestProAccess(configuration, 'buyer@example.com', fetcher)).resolves.toMatchObject({
      message: expect.stringContaining('If that email')
    })
  })

  it('fetches entitlement, purchase status, and logout with credentials', async () => {
    const fetcher: Fetcher = async (_input, init) => {
      expect(init?.credentials).toBe('include')
      return jsonResponse(init?.method === 'POST' ? { ok: true } : { pro: false, status: 'pending' })
    }

    await expect(fetchEntitlement(configuration, fetcher)).resolves.toMatchObject({ pro: false })
    await expect(fetchPurchaseStatus(configuration, 'cs_test', fetcher)).resolves.toMatchObject({ status: 'pending' })
    await expect(logoutProAccess(configuration, fetcher)).resolves.toBeUndefined()
  })

  it('surfaces backend errors', async () => {
    const fetcher: Fetcher = async () => jsonResponse({ error: 'Stripe checkout is not configured.' }, 503)

    await expect(startVerifiedCheckout(configuration, fetcher)).rejects.toThrow('Stripe checkout is not configured.')
  })
})
