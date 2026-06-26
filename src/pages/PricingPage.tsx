import { Link } from 'react-router-dom'
import { calculatorCatalog } from '../calculators/catalog'
import { getCalculatorAccess } from '../calculators/access'

const proCalculators = calculatorCatalog.filter((calculator) => getCalculatorAccess(calculator) === 'pro')

export function PricingPage() {
  return (
    <section className="pricing-page" aria-labelledby="pricing-heading">
      <div className="pricing-hero">
        <p className="eyebrow">FlipCalc Pro</p>
        <h1 id="pricing-heading">The complete reseller deal decision suite.</h1>
        <p>
          Know your ceiling before you spend. General Flip stays free; Pro is the specialized calculator suite for
          phones, tools, chainsaws, repair decisions, and selling-path comparisons.
        </p>
      </div>

      <div className="pricing-grid">
        <section className="pricing-card free-plan" aria-labelledby="free-plan-heading">
          <span className="plan-kicker">Free</span>
          <h2 id="free-plan-heading">General Flip Decision</h2>
          <p>Run the core maximum-buy-price calculator with no signup and no payment.</p>
          <ul>
            <li>Full General Flip result</li>
            <li>User-supplied assumptions</li>
            <li>Transparent formulas</li>
          </ul>
          <Link className="secondary-link" to="/calculators/general-flip">
            Run a Free Deal
          </Link>
        </section>

        <section className="pricing-card pro-plan" aria-labelledby="pro-plan-heading">
          <span className="plan-kicker">Pro Lifetime</span>
          <h2 id="pro-plan-heading">$19.99 one-time launch display price</h2>
          <p>
            The actual charge will be controlled by the configured Stripe Price in Phase 2. This page is the Phase 1
            pricing preview and access destination.
          </p>
          <ul>
            {proCalculators.map((calculator) => (
              <li key={calculator.id}>{calculator.name}</li>
            ))}
            <li>Future premium calculators</li>
            <li>Reseller spreadsheet download when implemented</li>
          </ul>
          <button className="primary-button" type="button" disabled>
            Stripe checkout connects in Phase 2
          </button>
        </section>
      </div>

      <section className="trust-panel" aria-labelledby="pricing-trust-heading">
        <h2 id="pricing-trust-heading">What FlipCalc does and does not do</h2>
        <div className="trust-grid">
          <p>All assumptions are supplied by you.</p>
          <p>Formulas are transparent and documented.</p>
          <p>FlipCalc does not invent market prices.</p>
          <p>Planning estimates are not profit guarantees.</p>
        </div>
      </section>
    </section>
  )
}
