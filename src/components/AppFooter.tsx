import { Link } from 'react-router-dom'

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div>
        <strong>FlipCalc</strong>
        <p>Transparent reseller calculators. Your assumptions in, a repeatable buy rule out.</p>
      </div>
      <nav aria-label="Footer links">
        <Link to="/pricing">Pricing</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/refund-policy">Refund Policy</Link>
      </nav>
    </footer>
  )
}
