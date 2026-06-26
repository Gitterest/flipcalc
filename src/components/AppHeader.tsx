import { Link } from 'react-router-dom'
import { ThemeControl } from './ThemeControl'
import { useProAccess } from './proAccessContext'

export function AppHeader() {
  const proAccess = useProAccess()

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
        {proAccess.pro ? (
          <button className="nav-button" type="button" onClick={() => void proAccess.logout()}>
            Log Out Pro
          </button>
        ) : null}
      </nav>
      <ThemeControl />
    </header>
  )
}
