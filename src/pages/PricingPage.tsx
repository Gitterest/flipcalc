import { Link } from 'react-router-dom'
import { calculatorCatalog } from '../calculators/catalog'
import { getCalculatorAccess } from '../calculators/access'
import {
  checkoutUrlEnvKey,
  flipCalcProLaunchPriceDisplay,
  flipCalcProProductName,
  getCheckoutConfiguration,
  monetizationImplementationMode
} from '../monetization'

const proCalculators = calculatorCatalog.filter((calculator) => getCalculatorAccess(calculator) === 'pro')

export function PricingPage() {
  const checkoutConfiguration = getCheckoutConfiguration({
    VITE_FLIPCALC_CHECKOUT_URL: import.meta.env.VITE_FLIPCALC_CHECKOUT_URL
  })

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
          <h2 id="pro-plan-heading">{flipCalcProLaunchPriceDisplay} one-time launch display price</h2>
          <p>
            The actual charge is controlled by the configured Stripe Payment Link and Stripe Price, not by client display
            text.
          </p>
          <ul>
            <li>{flipCalcProProductName}</li>
            {proCalculators.map((calculator) => (
              <li key={calculator.id}>{calculator.name}</li>
            ))}
            <li>Future premium calculators</li>
            <li>Reseller spreadsheet download when implemented</li>
          </ul>
          {checkoutConfiguration.isConfigured && checkoutConfiguration.checkoutUrl !== null ? (
            <a className="primary-button" href={checkoutConfiguration.checkoutUrl}>
              Get FlipCalc Pro
            </a>
          ) : (
            <button className="primary-button" type="button" disabled>
              Checkout Not Configured
            </button>
          )}
          <p className="checkout-status" role="status">
            {checkoutConfiguration.message}
          </p>
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

      <section className="trust-panel" aria-labelledby="payment-trust-heading">
        <h2 id="payment-trust-heading">Payment implementation</h2>
        <div className="trust-grid">
          <p>Mode: {monetizationImplementationMode}</p>
          <p>Checkout URL variable: {checkoutUrlEnvKey}</p>
          <p>Success returns are not treated as payment proof.</p>
          <p>Donations or support payments do not unlock Pro.</p>
        </div>
      </section>
    </section>
  )
}
