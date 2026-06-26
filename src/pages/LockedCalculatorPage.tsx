import { Link } from 'react-router-dom'
import { ProAccessForm } from '../components/ProAccessForm'
import type { CalculatorDefinition } from '../types/calculator'

interface LockedCalculatorPageProps {
  calculator: CalculatorDefinition
  accessState?: 'loading' | 'locked'
  accessError?: string | null
}

export function LockedCalculatorPage({ calculator, accessState = 'locked', accessError = null }: LockedCalculatorPageProps) {
  return (
    <section className="locked-page" aria-labelledby="locked-calculator-heading">
      <div className="locked-panel">
        <p className="eyebrow">Pro decision tool</p>
        <div className="locked-title-row">
          <h1 id="locked-calculator-heading">{calculator.name}</h1>
          <span className="pro-badge">Pro</span>
        </div>
        <p className="question-line">{calculator.question}</p>
        <p>
          {calculator.proTeaser ?? calculator.description} The working calculator is not exposed until verified Pro
          access exists.
        </p>
        <div className="locked-callout" role="note">
          <strong>No fake preview results.</strong>
          <span>
            FlipCalc does not blur fabricated calculations or imply a deal was analyzed. General Flip remains fully
            usable for free.
          </span>
        </div>
        {accessState === 'loading' ? (
          <div className="locked-callout" role="status">
            <strong>Checking Pro access.</strong>
            <span>The calculator form stays hidden until verified entitlement is confirmed.</span>
          </div>
        ) : null}
        {accessError !== null ? (
          <div className="locked-callout" role="alert">
            <strong>Unable to verify Pro access.</strong>
            <span>{accessError} Access fails closed until the server confirms entitlement.</span>
          </div>
        ) : null}
        <div className="button-row">
          <Link className="primary-button" to="/pricing">
            View FlipCalc Pro
          </Link>
          <Link className="secondary-link" to="/calculators/general-flip">
            Run a Free Deal
          </Link>
        </div>
        <ProAccessForm />
      </div>
    </section>
  )
}
