import { themeOptions } from '../theme'
import { useTheme } from './themeContext'
import type { ThemePreference } from '../theme'

const labels: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark'
}

export function ThemeControl() {
  const { preference, setPreference } = useTheme()

  return (
    <label className="theme-control">
      <span>Theme</span>
      <select
        aria-label="Theme preference"
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
      >
        {themeOptions.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  )
}
