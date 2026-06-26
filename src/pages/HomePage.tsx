import { Link } from 'react-router-dom'
import { calculatorCatalog } from '../calculators/catalog'
import { getCalculatorAccess } from '../calculators/access'
import { CalculatorCard } from '../components/CalculatorCard'

const proCalculatorCount = calculatorCatalog.filter((calculator) => getCalculatorAccess(calculator) === 'pro').length

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Signal / Control / Profit</p>
          <h1>Know your maximum safe buy price before you spend.</h1>
          <p className="hero-copy">
            FlipCalc uses your own resale, fee, shipping, repair, time, profit, and ROI assumptions to calculate profit,
            costs, and the maximum safe purchase price. It does not invent market values.
          </p>
          <div className="button-row">
            <Link className="primary-button" to="/calculators/general-flip">
              Run a Free Deal
            </Link>
            <Link className="secondary-link" to="/pricing">
              View FlipCalc Pro
            </Link>
          </div>
        </div>

        <aside className="hero-result-card" aria-label="Example deal result">
          <span className="example-label">Example values only</span>
          <div className="decision-chip decision-buy-at-ask">Buy at ask</div>
          <dl>
            <div>
              <dt>Maximum Buy Price</dt>
              <dd>$126.50</dd>
            </div>
            <div>
              <dt>Expected Profit</dt>
              <dd>$76.50</dd>
            </div>
            <div>
              <dt>ROI</dt>
              <dd>45.40%</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="content-section" aria-labelledby="guessing-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The cost of guessing</p>
            <h2 id="guessing-heading">Small assumptions can erase the deal.</h2>
          </div>
          <span>Examples only, not visitor-specific results.</span>
        </div>
        <div className="scenario-grid">
          <article>
            <span>Fees</span>
            <strong>Platform fees apply to buyer payment.</strong>
            <p>Example: shipping collected from the buyer can still increase fee basis.</p>
          </article>
          <article>
            <span>Shipping</span>
            <strong>Actual shipping is a real cost.</strong>
            <p>Example: underestimating postage can move a deal from buy to negotiate.</p>
          </article>
          <article>
            <span>Repair</span>
            <strong>Parts and failure risk change the ceiling.</strong>
            <p>Example: a higher resale price may not offset repair cost and time.</p>
          </article>
          <article>
            <span>Travel</span>
            <strong>Pickup cost belongs in the buy rule.</strong>
            <p>Example: fuel, tolls, and meetup time reduce safe purchase price.</p>
          </article>
        </div>
      </section>

      <section className="content-section" aria-labelledby="calculator-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Calculator catalog</p>
            <h2 id="calculator-heading">Choose the deal question.</h2>
          </div>
          <span>General is free. {proCalculatorCount} specialized tools are Pro.</span>
        </div>

        <div className="calculator-grid">
          {calculatorCatalog.map((calculator) => (
            <CalculatorCard calculator={calculator} key={calculator.id} />
          ))}
        </div>
      </section>

      <section className="content-section split-section" aria-labelledby="comparison-heading">
        <div>
          <p className="eyebrow">Free versus Pro</p>
          <h2 id="comparison-heading">Start with the core buy rule. Upgrade for specialized exits.</h2>
        </div>
        <div className="comparison-grid">
          <article>
            <span className="free-badge">Free</span>
            <h3>General Flip Decision</h3>
            <p>Use one complete maximum-buy-price calculator with no signup and no payment.</p>
          </article>
          <article>
            <span className="pro-badge">Pro</span>
            <h3>The complete reseller deal decision suite</h3>
            <p>
              Compare repair, local versus shipped, phone risk, chainsaw strategies, and power-tool bundle assumptions
              before you buy.
            </p>
          </article>
        </div>
      </section>

      <section className="pro-section" aria-labelledby="pro-heading">
        <p className="eyebrow">FlipCalc Pro</p>
        <h2 id="pro-heading">Replace gut feeling with a repeatable buy rule.</h2>
        <p>
          Know your ceiling before you spend. Use the right calculator for the exact type of deal and compare
          specialized exit strategies before buying.
        </p>
        <Link className="primary-button" to="/pricing">
          Get the complete reseller decision suite
        </Link>
      </section>

      <section className="content-section trust-panel" aria-labelledby="trust-heading">
        <h2 id="trust-heading">Trust comes from transparent assumptions.</h2>
        <div className="trust-grid">
          <p>All assumptions are supplied by the user.</p>
          <p>Formulas are transparent and documented.</p>
          <p>FlipCalc does not invent market prices.</p>
          <p>Results are planning estimates, not guarantees.</p>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-heading">
        <h2 id="final-cta-heading">Run the deal before you buy it.</h2>
        <div className="button-row">
          <Link className="primary-button" to="/pricing">
            View FlipCalc Pro
          </Link>
          <Link className="secondary-link" to="/calculators/general-flip">
            Run a Free Deal
          </Link>
        </div>
      </section>
    </>
  )
}
