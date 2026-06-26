export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const themePreferenceStorageKey = 'flipcalc-theme-preference'

export const themeOptions: ThemePreference[] = ['system', 'light', 'dark']

const darkThemeColor = '#080b12'
const lightThemeColor = '#f5f1e8'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveThemePreference(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference
}

export function getSystemTheme(matchesDark: boolean): ResolvedTheme {
  return matchesDark ? 'dark' : 'light'
}

export function readStoredThemePreference(storage: Pick<Storage, 'getItem'>): ThemePreference {
  const storedPreference = storage.getItem(themePreferenceStorageKey)

  return isThemePreference(storedPreference) ? storedPreference : 'system'
}

export function getThemeColor(theme: ResolvedTheme): string {
  return theme === 'dark' ? darkThemeColor : lightThemeColor
}

export function applyThemeToDocument(documentElement: HTMLElement, preference: ThemePreference, systemTheme: ResolvedTheme) {
  const resolvedTheme = resolveThemePreference(preference, systemTheme)

  documentElement.dataset.theme = resolvedTheme
  documentElement.dataset.themePreference = preference
  documentElement.style.colorScheme = resolvedTheme

  return resolvedTheme
}
