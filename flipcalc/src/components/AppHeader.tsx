import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" to="/" aria-label="FlipCalc home">
        <span className="brand-mark" aria-hidden="true">$</span>
        <span>FlipCalc</span>
      </Link>
      <span className="header-label">Reseller decision tools</span>
    </header>
  )
}
