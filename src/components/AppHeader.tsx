import { Link } from 'react-router-dom'
import { ThemeControl } from './ThemeControl'

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" to="/" aria-label="FlipCalc home">
        <span className="brand-mark" aria-hidden="true">FC</span>
        <span>
          FlipCalc
          <small>Signal / Control / Profit</small>
        </span>
      </Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link to="/calculators/general-flip">Free Calculator</Link>
        <Link to="/pricing">Pro</Link>
      </nav>
      <ThemeControl />
    </header>
  )
}
