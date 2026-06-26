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
        <a href="mailto:support@flipcalc.app">Contact</a>
        <a aria-disabled="true">Terms</a>
        <a aria-disabled="true">Privacy</a>
        <a aria-disabled="true">Refund Policy</a>
      </nav>
    </footer>
  )
}
