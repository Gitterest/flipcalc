import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PolicyPageProps {
  eyebrow: string
  title: string
  children: ReactNode
}

function PolicyPage({ eyebrow, title, children }: PolicyPageProps) {
  return (
    <section className="policy-page" aria-labelledby="policy-heading">
      <div className="pricing-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="policy-heading">{title}</h1>
      </div>
      <div className="trust-panel">{children}</div>
    </section>
  )
}

export function TermsPage() {
  return (
    <PolicyPage eyebrow="Terms" title="FlipCalc terms preview">
      <p>
        FlipCalc provides planning calculators based on values supplied by the user. Results are estimates, not profit
        guarantees, appraisals, or professional financial advice.
      </p>
      <p>
        The General Flip calculator is free. Specialized calculators are positioned as FlipCalc Pro tools, but automatic
        Pro entitlement requires the backend verification work documented in the monetization guide.
      </p>
      <Link className="secondary-link" to="/pricing">
        View Pricing
      </Link>
    </PolicyPage>
  )
}

export function PrivacyPage() {
  return (
    <PolicyPage eyebrow="Privacy" title="Privacy notes">
      <p>
        This frontend-only build does not create FlipCalc accounts or store calculator entries on a FlipCalc server.
        Calculator inputs stay in the browser session unless the user separately records them.
      </p>
      <p>
        Stripe handles hosted checkout for the Payment Link MVP. Do not put secret keys or private payment credentials
        into the client app.
      </p>
      <Link className="secondary-link" to="/pricing">
        View Pricing
      </Link>
    </PolicyPage>
  )
}

export function RefundPolicyPage() {
  return (
    <PolicyPage eyebrow="Refund Policy" title="Refund and access handling">
      <p>
        Refunds, chargebacks, and Pro access changes must be handled through Stripe and the future verified entitlement
        backend. Donations or support payments do not unlock Pro automatically.
      </p>
      <p>
        Until verified entitlement exists, FlipCalc must not claim that a checkout return has activated Pro access.
      </p>
      <Link className="secondary-link" to="/pricing">
        View Pricing
      </Link>
    </PolicyPage>
  )
}

export function ContactPage() {
  return (
    <PolicyPage eyebrow="Contact" title="Contact FlipCalc">
      <p>
        For purchase support, keep your Stripe receipt and include the email address used at checkout. Do not send secret
        keys, webhook secrets, passwords, or private payment credentials.
      </p>
      <a className="primary-button" href="mailto:support@flipcalc.app">
        Email Support
      </a>
    </PolicyPage>
  )
}
