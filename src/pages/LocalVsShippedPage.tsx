import { FormEvent, useState } from 'react'
import {
  calculateLocalVsShipped,
  defaultLocalVsShippedInput,
  localVsShippedFields,
  validateLocalVsShippedInput,
  type LocalVsShippedField,
  type LocalVsShippedInput,
  type LocalVsShippedOutput,
  type LocalVsShippedRecommendedSaleMethod,
  type LocalVsShippedStatus,
  type LocalVsShippedValidationError,
  type SaleOptionResult
} from '../calculators/localVsShipped'

interface FieldDefinition {
  field: LocalVsShippedField
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
      {
        field: 'acquisitionTravelCost',
        label: 'Acquisition travel cost',
        helper: 'Cost to acquire the item.'
      },
      {
        field: 'preparationCost',
        label: 'Preparation cost',
        helper: 'Cleaning, testing, or preparation cost shared by both sale methods.'
      },
      { field: 'otherSharedCost', label: 'Other shared cost', helper: 'Other cost shared by both sale methods.' },
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
    title: 'Local Sale',
    fields: [
      {
        field: 'expectedLocalSalePrice',
        label: 'Expected local sale price',
        helper: 'Expected local item price before negotiation.'
      },
      {
        field: 'localNegotiationDiscountPercent',
        label: 'Local negotiation discount',
        helper: 'Expected local buyer discount.',
        suffix: '%'
      },
      {
        field: 'localDeliveryCost',
        label: 'Local delivery cost',
        helper: 'Delivery, meetup, fuel, toll, or local transportation expense.'
      },
      { field: 'localOtherCost', label: 'Local other cost', helper: 'Other local-only expense.' },
      {
        field: 'localTimeHours',
        label: 'Local time hours',
        helper: 'Expected local listing, messaging, meetup, and delivery time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Shipped Sale',
    fields: [
      {
        field: 'expectedShippedSalePrice',
        label: 'Expected shipped sale price',
        helper: 'Expected online item price before negotiation.'
      },
      {
        field: 'shippedNegotiationDiscountPercent',
        label: 'Shipped negotiation discount',
        helper: 'Expected online buyer discount.',
        suffix: '%'
      },
      {
        field: 'platformFeePercent',
        label: 'Platform fee',
        helper: 'Percentage fee applied to shipped item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      { field: 'fixedSellingFees', label: 'Fixed selling fees', helper: 'Total fixed transaction or promotion fees.' },
      { field: 'shippingPaidByBuyer', label: 'Shipping paid by buyer', helper: 'Shipping collected from the buyer.' },
      { field: 'actualShippingCost', label: 'Actual shipping cost', helper: 'Actual shipping expense.' },
      {
        field: 'packingSuppliesCost',
        label: 'Packing supplies cost',
        helper: 'Box, tape, padding, label, and packing expense.'
      },
      { field: 'shippedOtherCost', label: 'Shipped other cost', helper: 'Other shipped-sale expense.' },
      {
        field: 'shippedTimeHours',
        label: 'Shipped time hours',
        helper: 'Expected listing, packing, and fulfillment time.',
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

function createInitialFormState(): Record<LocalVsShippedField, string> {
  return localVsShippedFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultLocalVsShippedInput[field])
    }),
    {} as Record<LocalVsShippedField, string>
  )
}

function parseFormState(formState: Record<LocalVsShippedField, string>): LocalVsShippedInput {
  return localVsShippedFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as LocalVsShippedInput
  )
}

function groupErrors(errors: LocalVsShippedValidationError[]): Partial<Record<LocalVsShippedField, string>> {
  return errors.reduce<Partial<Record<LocalVsShippedField, string>>>((groupedErrors, error) => {
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

function getStatusLabel(status: LocalVsShippedStatus): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

function getSaleMethodLabel(method: LocalVsShippedRecommendedSaleMethod): string {
  if (method === 'local') {
    return 'Local'
  }

  if (method === 'shipped') {
    return 'Shipped'
  }

  return 'None'
}

function getDecisionExplanation(result: LocalVsShippedOutput): string {
  if (result.overallDecision === 'buy-at-ask') {
    return `${getSaleMethodLabel(result.recommendedSaleMethod)} has the strongest qualifying profit at the asking price.`
  }

  if (result.overallDecision === 'negotiate') {
    return `${getSaleMethodLabel(result.recommendedSaleMethod)} has the stronger maximum buy price, but the asking price is too high.`
  }

  return 'Both sale methods have no revenue or cannot meet the entered targets even at a zero-dollar purchase price.'
}

interface SaleOptionCardProps {
  title: string
  result: SaleOptionResult
}

function SaleOptionCard({ title, result }: SaleOptionCardProps) {
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

export function LocalVsShippedPage() {
  const [formState, setFormState] = useState<Record<LocalVsShippedField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<LocalVsShippedField, string>>>({})
  const [result, setResult] = useState<LocalVsShippedOutput | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validateLocalVsShippedInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculateLocalVsShipped(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="local-vs-shipped-heading">
      <div className="calculator-intro">
        <p className="eyebrow">Selling</p>
        <h1 id="local-vs-shipped-heading">Local vs Shipped Sale Calculator</h1>
        <p>
          Compare selling the same acquired item locally or online with shipping. Every price, fee, discount, shipping
          amount, and cost is supplied by you.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `local-vs-shipped-${definition.field}`
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
            <p className="empty-results">Enter your assumptions and calculate to compare local and shipped sales.</p>
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
                  <dd>{getSaleMethodLabel(result.recommendedSaleMethod)}</dd>
                </div>
                <div>
                  <dt>Overall maximum buy price</dt>
                  <dd>{formatCurrency(result.overallMaximumBuyPrice)}</dd>
                </div>
                <div>
                  <dt>Profit difference shipped minus local</dt>
                  <dd>{formatCurrency(result.profitDifferenceShippedMinusLocal)}</dd>
                </div>
                <div>
                  <dt>Hourly profit difference shipped minus local</dt>
                  <dd>{formatNullableCurrency(result.hourlyProfitDifferenceShippedMinusLocal)}</dd>
                </div>
              </dl>

              <div className="strategy-results">
                <SaleOptionCard title="Local" result={result.local} />
                <SaleOptionCard title="Shipped" result={result.shipped} />
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
