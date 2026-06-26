import type { CheckoutConfiguration } from './monetization'

export type PurchaseStatusState = 'pending' | 'paid' | 'failed'

export interface EntitlementResponse {
  pro: boolean
  productKey?: string
  status?: string
  expiresAt?: string
}

export interface AccessRequestResponse {
  message: string
  devMagicLink?: string
}

export interface CheckoutResponse {
  id: string
  url: string
}

export interface PurchaseStatusResponse {
  status: PurchaseStatusState
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function apiUrl(path: string, configuration: Pick<CheckoutConfiguration, 'apiOrigin'>): string {
  return `${configuration.apiOrigin}${path}`
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Request failed.'

    throw new Error(message)
  }

  return data as T
}

export async function startVerifiedCheckout(
  configuration: Pick<CheckoutConfiguration, 'apiOrigin'>,
  fetcher: Fetcher = fetch
): Promise<CheckoutResponse> {
  const response = await fetcher(apiUrl('/api/flipcalc/checkout', configuration), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })

  return parseJsonResponse<CheckoutResponse>(response)
}

export async function requestProAccess(
  configuration: Pick<CheckoutConfiguration, 'apiOrigin'>,
  email: string,
  fetcher: Fetcher = fetch
): Promise<AccessRequestResponse> {
  const response = await fetcher(apiUrl('/api/flipcalc/access/request', configuration), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  return parseJsonResponse<AccessRequestResponse>(response)
}

export async function fetchEntitlement(
  configuration: Pick<CheckoutConfiguration, 'apiOrigin'>,
  fetcher: Fetcher = fetch
): Promise<EntitlementResponse> {
  const response = await fetcher(apiUrl('/api/flipcalc/entitlement', configuration), {
    method: 'GET',
    credentials: 'include'
  })

  return parseJsonResponse<EntitlementResponse>(response)
}

export async function fetchPurchaseStatus(
  configuration: Pick<CheckoutConfiguration, 'apiOrigin'>,
  sessionId: string,
  fetcher: Fetcher = fetch
): Promise<PurchaseStatusResponse> {
  const searchParams = new URLSearchParams({ session_id: sessionId })
  const response = await fetcher(apiUrl(`/api/flipcalc/purchase-status?${searchParams.toString()}`, configuration), {
    method: 'GET',
    credentials: 'include'
  })

  return parseJsonResponse<PurchaseStatusResponse>(response)
}

export async function logoutProAccess(
  configuration: Pick<CheckoutConfiguration, 'apiOrigin'>,
  fetcher: Fetcher = fetch
): Promise<void> {
  const response = await fetcher(apiUrl('/api/flipcalc/logout', configuration), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })

  await parseJsonResponse<{ ok: boolean }>(response)
}
