import { describe, expect, it } from 'vitest'
import {
  applyThemeToDocument,
  getSystemTheme,
  getThemeColor,
  isThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  themePreferenceStorageKey
} from './theme'

function createStorage(value: string | null): Pick<Storage, 'getItem'> {
  return {
    getItem: (key: string) => (key === themePreferenceStorageKey ? value : null)
  }
}

describe('theme preference helpers', () => {
  it('defaults first-time users to system preference', () => {
    expect(readStoredThemePreference(createStorage(null))).toBe('system')
  })

  it('reads saved light and dark preferences without overwriting them', () => {
    expect(readStoredThemePreference(createStorage('light'))).toBe('light')
    expect(readStoredThemePreference(createStorage('dark'))).toBe('dark')
  })

  it('ignores invalid stored preferences', () => {
    expect(readStoredThemePreference(createStorage('midnight'))).toBe('system')
  })

  it('resolves system mode from media preference', () => {
    expect(getSystemTheme(true)).toBe('dark')
    expect(getSystemTheme(false)).toBe('light')
    expect(resolveThemePreference('system', 'dark')).toBe('dark')
    expect(resolveThemePreference('light', 'dark')).toBe('light')
  })

  it('applies the resolved theme and preference attributes', () => {
    const element = { dataset: {}, style: {} } as HTMLElement
    const resolvedTheme = applyThemeToDocument(element, 'system', 'dark')

    expect(resolvedTheme).toBe('dark')
    expect(element.dataset.theme).toBe('dark')
    expect(element.dataset.themePreference).toBe('system')
    expect(element.style.colorScheme).toBe('dark')
  })

  it('exposes valid preferences and theme colors', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('other')).toBe(false)
    expect(getThemeColor('dark')).toBe('#080b12')
    expect(getThemeColor('light')).toBe('#f5f1e8')
  })
})
