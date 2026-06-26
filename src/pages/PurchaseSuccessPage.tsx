import { Link } from 'react-router-dom'

export function PurchaseSuccessPage() {
  return (
    <section className="purchase-page" aria-labelledby="purchase-success-heading">
      <div className="locked-panel">
        <p className="eyebrow">Purchase return</p>
        <h1 id="purchase-success-heading">Payment verification is not automatic yet.</h1>
        <p>
          FlipCalc is using a Stripe Payment Link MVP. Returning to this page is not payment proof, and query-string
          values are not trusted as entitlement evidence.
        </p>
        <div className="locked-callout" role="note">
          <strong>Pro calculators remain locked in this frontend-only build.</strong>
          <span>
            Automatic Pro access requires a backend checkout session, verified Stripe webhook, and stored entitlement.
            Keep your Stripe receipt for support while that verified entitlement layer is added.
          </span>
        </div>
        <div className="button-row">
          <Link className="primary-button" to="/pricing">
            Return to Pricing
          </Link>
          <Link className="secondary-link" to="/calculators/general-flip">
            Run a Free Deal
          </Link>
        </div>
      </div>
    </section>
  )
}
