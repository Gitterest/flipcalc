import { FormEvent, useState } from 'react'
import {
  calculateRepairVsAsIs,
  defaultRepairVsAsIsInput,
  repairVsAsIsFields,
  validateRepairVsAsIsInput,
  type RepairVsAsIsField,
  type RepairVsAsIsInput,
  type RepairVsAsIsOptionResult,
  type RepairVsAsIsOutput,
  type RepairVsAsIsRecommendedMethod,
  type RepairVsAsIsStatus,
  type RepairVsAsIsValidationError
} from '../calculators/repairVsAsIs'

interface FieldDefinition {
  field: RepairVsAsIsField
  label: string
  helper: string
  suffix?: string
}

interface FieldGroup {
  title: string
  fields: FieldDefinition[]
}

const fieldGroups: FieldGroup[] = [
  {
    title: 'Shared Deal Assumptions',
    fields: [
      { field: 'askingPrice', label: 'Asking price', helper: 'Acquisition price.' },
      { field: 'acquisitionTravelCost', label: 'Acquisition travel cost', helper: 'Travel cost to acquire the item.' },
      { field: 'otherSharedCost', label: 'Other shared cost', helper: 'Other cost shared by both options.' },
      { field: 'desiredMinimumProfit', label: 'Desired minimum profit', helper: 'Required profit.' },
      {
        field: 'minimumRoiPercent',
        label: 'Minimum ROI',
        helper: 'Required return on investment percentage.',
        suffix: '%'
      }
    ]
  },
  {
    title: 'Sell As-Is',
    fields: [
      { field: 'asIsSalePrice', label: 'As-is sale price', helper: 'Expected as-is sale price before discount.' },
      {
        field: 'asIsNegotiationDiscountPercent',
        label: 'As-is negotiation discount',
        helper: 'Expected buyer discount.',
        suffix: '%'
      },
      {
        field: 'asIsSellingFeePercent',
        label: 'As-is selling fee',
        helper: 'Percentage fee on item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      { field: 'asIsFixedFees', label: 'As-is fixed fees', helper: 'Fixed transaction or selling fees.' },
      { field: 'asIsShippingCollected', label: 'As-is shipping collected', helper: 'Shipping paid by the buyer.' },
      { field: 'asIsShippingCost', label: 'As-is shipping cost', helper: 'Actual shipping cost.' },
      { field: 'asIsOtherCost', label: 'As-is other cost', helper: 'Other as-is-only cost.' },
      {
        field: 'asIsTimeHours',
        label: 'As-is time hours',
        helper: 'Expected listing, handling, and fulfillment time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Repair Before Sale',
    fields: [
      {
        field: 'repairedSalePrice',
        label: 'Repaired sale price',
        helper: 'Expected repaired sale price before discount.'
      },
      {
        field: 'repairNegotiationDiscountPercent',
        label: 'Repair negotiation discount',
        helper: 'Expected buyer discount after repair.',
        suffix: '%'
      },
      { field: 'repairCost', label: 'Repair cost', helper: 'Parts or service cost required for repair.' },
      { field: 'repairSuppliesCost', label: 'Repair supplies cost', helper: 'Supplies consumed during repair.' },
      {
        field: 'repairFailureRiskPercent',
        label: 'Repair failure risk',
        helper: 'Chance the repair attempt does not produce a saleable repaired item.',
        suffix: '%'
      },
      {
        field: 'repairSellingFeePercent',
        label: 'Repair selling fee',
        helper: 'Percentage fee on repaired item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      { field: 'repairFixedFees', label: 'Repair fixed fees', helper: 'Fixed transaction or selling fees.' },
      { field: 'repairShippingCollected', label: 'Repair shipping collected', helper: 'Shipping paid by the buyer.' },
      { field: 'repairShippingCost', label: 'Repair shipping cost', helper: 'Actual shipping cost.' },
      { field: 'repairOtherCost', label: 'Repair other cost', helper: 'Other repair-only cost.' },
      {
        field: 'repairTimeHours',
        label: 'Repair time hours',
        helper: 'Expected repair, listing, handling, and fulfillment time.',
        suffix: 'hrs'
      }
    ]
  }
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
})

function createInitialFormState(): Record<RepairVsAsIsField, string> {
  return repairVsAsIsFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultRepairVsAsIsInput[field])
    }),
    {} as Record<RepairVsAsIsField, string>
  )
}

function parseFormState(formState: Record<RepairVsAsIsField, string>): RepairVsAsIsInput {
  return repairVsAsIsFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as RepairVsAsIsInput
  )
}

function groupErrors(errors: RepairVsAsIsValidationError[]): Partial<Record<RepairVsAsIsField, string>> {
  return errors.reduce<Partial<Record<RepairVsAsIsField, string>>>((groupedErrors, error) => {
    if (groupedErrors[error.field] === undefined) {
      groupedErrors[error.field] = error.message
    }

    return groupedErrors
  }, {})
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function formatNullableCurrency(value: number | null): string {
  return value === null ? 'Not available' : formatCurrency(value)
}

function formatPercent(value: number | null): string {
  return value === null ? 'Not available' : `${percentFormatter.format(value)}%`
}

function getStatusLabel(status: RepairVsAsIsStatus): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

function getMethodLabel(method: RepairVsAsIsRecommendedMethod): string {
  if (method === 'as-is') {
    return 'Sell as-is'
  }

  if (method === 'repair') {
    return 'Repair'
  }

  return 'None'
}

function getDecisionExplanation(result: RepairVsAsIsOutput): string {
  if (result.overallDecision === 'buy-at-ask') {
    return `${getMethodLabel(result.recommendedMethod)} has the strongest qualifying profit at the asking price.`
  }

  if (result.overallDecision === 'negotiate') {
    return `${getMethodLabel(result.recommendedMethod)} has the stronger maximum buy price, but the asking price is too high.`
  }

  return 'Both options have no expected revenue or cannot meet the entered targets even at a zero-dollar purchase price.'
}

interface OptionCardProps {
  title: string
  result: RepairVsAsIsOptionResult
}

function OptionCard({ title, result }: OptionCardProps) {
  return (
    <section className="strategy-result-card" aria-label={`${title} result`}>
      <div className={`decision-banner decision-${result.status}`}>
        <span>{title}</span>
        <strong>{getStatusLabel(result.status)}</strong>
      </div>

      <dl className="result-highlights">
        <div>
          <dt>Profit at asking price</dt>
          <dd>{formatCurrency(result.profitAtAsk)}</dd>
        </div>
        <div>
          <dt>ROI</dt>
          <dd>{formatPercent(result.roiPercent)}</dd>
        </div>
        <div>
          <dt>Hourly profit</dt>
          <dd>{formatNullableCurrency(result.hourlyProfit)}</dd>
        </div>
        <div>
          <dt>Maximum buy price</dt>
          <dd>{formatCurrency(result.maximumBuyPrice)}</dd>
        </div>
      </dl>

      <dl className="result-list">
        <div>
          <dt>Item revenue</dt>
          <dd>{formatCurrency(result.itemRevenue)}</dd>
        </div>
        <div>
          <dt>Gross buyer payment</dt>
          <dd>{formatCurrency(result.grossBuyerPayment)}</dd>
        </div>
        <div>
          <dt>Expected gross buyer payment</dt>
          <dd>{formatCurrency(result.effectiveGrossBuyerPayment)}</dd>
        </div>
        <div>
          <dt>Percentage selling fee</dt>
          <dd>{formatCurrency(result.percentageSellingFee)}</dd>
        </div>
        <div>
          <dt>Total selling fees</dt>
          <dd>{formatCurrency(result.sellingFees)}</dd>
        </div>
        <div>
          <dt>Non-purchase costs</dt>
          <dd>{formatCurrency(result.nonPurchaseCosts)}</dd>
        </div>
        <div>
          <dt>Total investment at ask</dt>
          <dd>{formatCurrency(result.totalInvestmentAtAsk)}</dd>
        </div>
        <div>
          <dt>Profit-limited max buy price</dt>
          <dd>{formatCurrency(result.profitLimitedMaxBuyPrice)}</dd>
        </div>
        <div>
          <dt>ROI-limited max buy price</dt>
          <dd>{formatCurrency(result.roiLimitedMaxBuyPrice)}</dd>
        </div>
        <div>
          <dt>{result.amountBelowMaximum >= 0 ? 'Amount below maximum' : 'Amount above maximum'}</dt>
          <dd>{formatCurrency(Math.abs(result.amountBelowMaximum))}</dd>
        </div>
      </dl>
    </section>
  )
}

export function RepairVsAsIsPage() {
  const [formState, setFormState] = useState<Record<RepairVsAsIsField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<RepairVsAsIsField, string>>>({})
  const [result, setResult] = useState<RepairVsAsIsOutput | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validateRepairVsAsIsInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculateRepairVsAsIs(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="repair-vs-as-is-heading">
      <div className="calculator-intro">
        <p className="eyebrow">Repair</p>
        <h1 id="repair-vs-as-is-heading">Repair vs Sell As-Is Calculator</h1>
        <p>
          Compare selling an item in current condition against repairing it first. Every price, fee, discount, repair
          risk, and cost is supplied by you.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `repair-vs-as-is-${definition.field}`
                  const helperId = `${inputId}-helper`
                  const errorId = `${inputId}-error`
                  const fieldError = errors[definition.field]

                  return (
                    <div className="field-control" key={definition.field}>
                      <label htmlFor={inputId}>{definition.label}</label>
                      <div className="input-row">
                        <input
                          aria-describedby={fieldError === undefined ? helperId : `${helperId} ${errorId}`}
                          aria-invalid={fieldError === undefined ? undefined : true}
                          id={inputId}
                          inputMode="decimal"
                          min="0"
                          name={definition.field}
                          onChange={(event) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              [definition.field]: event.target.value
                            }))
                          }
                          step="0.01"
                          type="number"
                          value={formState[definition.field]}
                        />
                        {definition.suffix === undefined ? null : <span>{definition.suffix}</span>}
                      </div>
                      <p className="field-helper" id={helperId}>
                        {definition.helper}
                      </p>
                      {fieldError === undefined ? null : (
                        <p className="field-error" id={errorId}>
                          {fieldError}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div className="form-actions">
            <button type="submit">Calculate</button>
            <button type="button" className="secondary-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <aside className="results-panel" aria-live="polite" aria-labelledby="results-heading">
          <h2 id="results-heading">Results</h2>
          {result === null ? (
            <p className="empty-results">Enter your assumptions and calculate to compare repair against as-is sale.</p>
          ) : (
            <>
              <div className={`decision-banner decision-${result.overallDecision}`}>
                <span>Overall decision</span>
                <strong>{getStatusLabel(result.overallDecision)}</strong>
                <p>{getDecisionExplanation(result)}</p>
              </div>

              <dl className="result-highlights">
                <div>
                  <dt>Recommended method</dt>
                  <dd>{getMethodLabel(result.recommendedMethod)}</dd>
                </div>
                <div>
                  <dt>Overall maximum buy price</dt>
                  <dd>{formatCurrency(result.overallMaximumBuyPrice)}</dd>
                </div>
                <div>
                  <dt>Repair success rate</dt>
                  <dd>{formatPercent(result.repairSuccessRate * 100)}</dd>
                </div>
                <div>
                  <dt>Profit difference repair minus as-is</dt>
                  <dd>{formatCurrency(result.profitDifferenceRepairMinusAsIs)}</dd>
                </div>
                <div>
                  <dt>Hourly profit difference repair minus as-is</dt>
                  <dd>{formatNullableCurrency(result.hourlyProfitDifferenceRepairMinusAsIs)}</dd>
                </div>
              </dl>

              <div className="strategy-results">
                <OptionCard title="Sell as-is" result={result.asIs} />
                <OptionCard title="Repair" result={result.repair} />
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
