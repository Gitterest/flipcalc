import { useState } from 'react'
import { requestProAccess } from '../entitlementClient'
import { getCheckoutConfiguration } from '../monetization'

function getConfiguration() {
  return getCheckoutConfiguration({
    VITE_FLIPCALC_API_ORIGIN: import.meta.env.VITE_FLIPCALC_API_ORIGIN,
    VITE_FLIPCALC_CHECKOUT_URL: import.meta.env.VITE_FLIPCALC_CHECKOUT_URL,
    VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: import.meta.env.VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK
  })
}

export function ProAccessForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)
    setDevMagicLink(null)

    try {
      const response = await requestProAccess(getConfiguration(), email)
      setMessage(response.message)
      setDevMagicLink(response.devMagicLink ?? null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request access.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="pro-access-form" onSubmit={handleSubmit}>
      <div className="field-control">
        <label htmlFor="pro-access-email">Access FlipCalc Pro</label>
        <div className="input-row">
          <input
            id="pro-access-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="buyer@example.com"
            required
          />
        </div>
        <p className="field-helper">Enter the email used at Stripe checkout. The response is neutral for privacy.</p>
      </div>
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Sending Access Link...' : 'Send Access Link'}
      </button>
      {message !== null ? (
        <p className="checkout-status" role="status">
          {message}
        </p>
      ) : null}
      {devMagicLink !== null ? (
        <p className="checkout-status">
          Development link: <a href={devMagicLink}>{devMagicLink}</a>
        </p>
      ) : null}
      {error !== null ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
