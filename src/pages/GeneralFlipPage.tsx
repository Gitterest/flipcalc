import { FormEvent, useState } from 'react'
import {
  calculateGeneralFlip,
  defaultGeneralFlipInput,
  generalFlipFields,
  validateGeneralFlipInput,
  type GeneralFlipField,
  type GeneralFlipInput,
  type GeneralFlipOutput,
  type GeneralFlipStatus,
  type GeneralFlipValidationError
} from '../calculators/generalFlip'

interface FieldDefinition {
  field: GeneralFlipField
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
    title: 'Deal Assumptions',
    fields: [
      { field: 'askingPrice', label: 'Asking price', helper: 'Acquisition price.' },
      {
        field: 'expectedSalePrice',
        label: 'Expected sale price',
        helper: 'Expected item sale price before negotiation.'
      },
      {
        field: 'negotiationDiscountPercent',
        label: 'Negotiation discount',
        helper: 'Expected buyer discount.',
        suffix: '%'
      },
      { field: 'desiredMinimumProfit', label: 'Desired minimum profit', helper: 'Required profit.' },
      {
        field: 'minimumRoiPercent',
        label: 'Minimum ROI',
        helper: 'Required return on investment percentage.',
        suffix: '%'
      },
      {
        field: 'timeHours',
        label: 'Time hours',
        helper: 'Expected buying, prep, listing, handling, and fulfillment time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Fees and Shipping',
    fields: [
      {
        field: 'sellingFeePercent',
        label: 'Selling fee',
        helper: 'Percentage fee on item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      { field: 'fixedSellingFees', label: 'Fixed selling fees', helper: 'Fixed transaction or selling fees.' },
      { field: 'shippingPaidByBuyer', label: 'Shipping paid by buyer', helper: 'Shipping collected from the buyer.' },
      { field: 'actualShippingCost', label: 'Actual shipping cost', helper: 'Actual shipping expense.' }
    ]
  },
  {
    title: 'Costs',
    fields: [
      {
        field: 'acquisitionTravelCost',
        label: 'Acquisition travel cost',
        helper: 'Travel, fuel, tolls, or pickup cost.'
      },
      { field: 'preparationCost', label: 'Preparation cost', helper: 'Cleaning, testing, or preparation cost.' },
      { field: 'repairCost', label: 'Repair cost', helper: 'Repair parts or service cost.' },
      { field: 'packingSuppliesCost', label: 'Packing supplies cost', helper: 'Boxes, tape, padding, or labels.' },
      { field: 'otherCost', label: 'Other cost', helper: 'Any other user-supplied cost.' }
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

function createInitialFormState(): Record<GeneralFlipField, string> {
  return generalFlipFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultGeneralFlipInput[field])
    }),
    {} as Record<GeneralFlipField, string>
  )
}

function parseFormState(formState: Record<GeneralFlipField, string>): GeneralFlipInput {
  return generalFlipFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as GeneralFlipInput
  )
}

function groupErrors(errors: GeneralFlipValidationError[]): Partial<Record<GeneralFlipField, string>> {
  return errors.reduce<Partial<Record<GeneralFlipField, string>>>((groupedErrors, error) => {
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

function getStatusLabel(status: GeneralFlipStatus): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

function getDecisionExplanation(result: GeneralFlipOutput): string {
  if (result.decision === 'buy-at-ask') {
    return 'The asking price is within the maximum buy price from your profit and ROI targets.'
  }

  if (result.decision === 'negotiate') {
    return 'The deal has revenue, but the asking price is above the maximum buy price from your targets.'
  }

  return 'The deal has no buyer payment or cannot meet the entered targets even at a zero-dollar purchase price.'
}

export function GeneralFlipPage() {
  const [formState, setFormState] = useState<Record<GeneralFlipField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<GeneralFlipField, string>>>({})
  const [result, setResult] = useState<GeneralFlipOutput | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validateGeneralFlipInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculateGeneralFlip(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="general-flip-heading">
      <div className="calculator-intro">
        <p className="eyebrow">General</p>
        <h1 id="general-flip-heading">General Flip Decision Calculator</h1>
        <p>
          Determine whether a flip is a buy, negotiate, or pass from user-supplied sale, fee, shipping, cost, time,
          profit, and ROI assumptions.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `general-flip-${definition.field}`
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
            <p className="empty-results">Enter your assumptions and calculate to evaluate the flip.</p>
          ) : (
            <>
              <div className={`decision-banner decision-${result.decision}`}>
                <span>Decision</span>
                <strong>{getStatusLabel(result.decision)}</strong>
                <p>{getDecisionExplanation(result)}</p>
              </div>

              <dl className="result-highlights">
                <div>
                  <dt>Maximum buy price</dt>
                  <dd>{formatCurrency(result.maximumBuyPrice)}</dd>
                </div>
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
                  <dt>Break-even buy price</dt>
                  <dd>{formatCurrency(result.breakEvenBuyPrice)}</dd>
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
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
