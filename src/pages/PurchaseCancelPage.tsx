import { Link } from 'react-router-dom'

export function PurchaseCancelPage() {
  return (
    <section className="purchase-page" aria-labelledby="purchase-cancel-heading">
      <div className="locked-panel">
        <p className="eyebrow">Checkout canceled</p>
        <h1 id="purchase-cancel-heading">No FlipCalc Pro checkout was completed here.</h1>
        <p>
          You returned from Stripe before verified checkout completion. General Flip remains available for free, and Pro
          access can be requested after a completed paid purchase.
        </p>
        <div className="button-row">
          <Link className="primary-button" to="/pricing">
            View Pricing
          </Link>
          <Link className="secondary-link" to="/calculators/general-flip">
            Run a Free Deal
          </Link>
        </div>
      </div>
    </section>
  )
}
