import { createContext, useContext } from 'react'

export interface ProAccessContextValue {
  loading: boolean
  pro: boolean
  error: string | null
  expiresAt: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export const ProAccessContext = createContext<ProAccessContextValue | null>(null)

export function useProAccess() {
  const context = useContext(ProAccessContext)

  if (context === null) {
    throw new Error('useProAccess must be used within ProAccessProvider.')
  }

  return context
}
