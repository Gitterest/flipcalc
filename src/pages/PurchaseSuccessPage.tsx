import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProAccessForm } from '../components/ProAccessForm'
import { useProAccess } from '../components/proAccessContext'
import { fetchPurchaseStatus, type PurchaseStatusState } from '../entitlementClient'
import { getCheckoutConfiguration } from '../monetization'

function getConfiguration() {
  return getCheckoutConfiguration({
    VITE_FLIPCALC_API_ORIGIN: import.meta.env.VITE_FLIPCALC_API_ORIGIN,
    VITE_FLIPCALC_CHECKOUT_URL: import.meta.env.VITE_FLIPCALC_CHECKOUT_URL,
    VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: import.meta.env.VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK
  })
}

export function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams()
  const proAccess = useProAccess()
  const refreshProAccess = proAccess.refresh
  const sessionId = searchParams.get('session_id')
  const verifiedAccess = searchParams.get('access') === 'verified'
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatusState | 'verifying'>(
    sessionId === null ? 'failed' : 'verifying'
  )
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    if (verifiedAccess) {
      void refreshProAccess()
    }
  }, [refreshProAccess, verifiedAccess])

  useEffect(() => {
    if (sessionId === null) {
      return
    }

    let active = true
    const checkoutSessionId = sessionId

    async function verifyPurchase() {
      setPurchaseStatus('verifying')
      setStatusError(null)

      try {
        const result = await fetchPurchaseStatus(getConfiguration(), checkoutSessionId)

        if (active) {
          setPurchaseStatus(result.status)
        }
      } catch (error) {
        if (active) {
          setPurchaseStatus('failed')
          setStatusError(error instanceof Error ? error.message : 'Unable to verify purchase status.')
        }
      }
    }

    void verifyPurchase()

    return () => {
      active = false
    }
  }, [sessionId])

  return (
    <section className="purchase-page" aria-labelledby="purchase-success-heading">
      <div className="locked-panel">
        <p className="eyebrow">Purchase return</p>
        <h1 id="purchase-success-heading">Verifying FlipCalc Pro purchase.</h1>
        <p>
          Returning from Stripe is not payment proof by itself. FlipCalc checks the backend purchase-status endpoint and
          only treats access as active after a verified entitlement session exists.
        </p>
        <div className="locked-callout" role="note">
          <strong>Status: {verifiedAccess && proAccess.pro ? 'Pro access verified' : purchaseStatus}</strong>
          <span>
            {purchaseStatus === 'paid'
              ? 'Payment and webhook fulfillment are confirmed. Use the access form with your checkout email to receive a sign-in link.'
              : 'If checkout completed recently, webhook fulfillment may still be pending. Use the access form after your payment is confirmed.'}
          </span>
        </div>
        {statusError !== null ? (
          <p className="field-error" role="alert">
            {statusError}
          </p>
        ) : null}
        <ProAccessForm />
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
