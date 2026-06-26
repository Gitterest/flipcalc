import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCheckoutConfiguration } from '../monetization'
import { fetchEntitlement, logoutProAccess } from '../entitlementClient'
import { ProAccessContext, type ProAccessContextValue } from './proAccessContext'

interface ProAccessProviderProps {
  children: ReactNode
}

function getConfiguration() {
  return getCheckoutConfiguration({
    VITE_FLIPCALC_API_ORIGIN: import.meta.env.VITE_FLIPCALC_API_ORIGIN,
    VITE_FLIPCALC_CHECKOUT_URL: import.meta.env.VITE_FLIPCALC_CHECKOUT_URL,
    VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: import.meta.env.VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK
  })
}

export function ProAccessProvider({ children }: ProAccessProviderProps) {
  const [loading, setLoading] = useState(true)
  const [pro, setPro] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const entitlement = await fetchEntitlement(getConfiguration())
      setPro(entitlement.pro)
      setExpiresAt(entitlement.expiresAt ?? null)
    } catch (refreshError) {
      setPro(false)
      setExpiresAt(null)
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to verify Pro access.')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutProAccess(getConfiguration())
    } finally {
      setPro(false)
      setExpiresAt(null)
      setError(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<ProAccessContextValue>(
    () => ({
      loading,
      pro,
      error,
      expiresAt,
      refresh,
      logout
    }),
    [error, expiresAt, loading, logout, pro, refresh]
  )

  return <ProAccessContext.Provider value={value}>{children}</ProAccessContext.Provider>
}
