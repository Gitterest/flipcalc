import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  applyThemeToDocument,
  getSystemTheme,
  getThemeColor,
  readStoredThemePreference,
  resolveThemePreference,
  themePreferenceStorageKey,
  type ResolvedTheme,
  type ThemePreference
} from '../theme'
import { ThemeContext, type ThemeContextValue } from './themeContext'

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  return readStoredThemePreference(window.localStorage)
}

function getInitialSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  return getSystemTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function updateThemeColor(theme: ResolvedTheme) {
  const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

  if (themeColorMeta !== null) {
    themeColorMeta.content = getThemeColor(theme)
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialPreference)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getInitialSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleChange(event: MediaQueryListEvent) {
      setSystemTheme(getSystemTheme(event.matches))
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const resolvedTheme = applyThemeToDocument(document.documentElement, preference, systemTheme)

    updateThemeColor(resolvedTheme)
  }, [preference, systemTheme])

  const contextValue = useMemo<ThemeContextValue>(() => {
    return {
      preference,
      resolvedTheme: resolveThemePreference(preference, systemTheme),
      setPreference: (nextPreference) => {
        window.localStorage.setItem(themePreferenceStorageKey, nextPreference)
        setPreferenceState(nextPreference)
      }
    }
  }, [preference, systemTheme])

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
