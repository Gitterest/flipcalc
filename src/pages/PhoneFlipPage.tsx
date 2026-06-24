import { FormEvent, useMemo, useState } from 'react'
import {
  calculatePhoneFlip,
  defaultPhoneFlipInput,
  phoneFlipFields,
  validatePhoneFlipInput,
  type PhoneFlipField,
  type PhoneFlipInput,
  type PhoneFlipOutput,
  type PhoneFlipValidationError
} from '../calculators/phoneFlip'

interface FieldDefinition {
  field: PhoneFlipField
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
    title: 'Deal',
    fields: [
      {
        field: 'askingPrice',
        label: 'Asking price',
        helper: "Seller's current asking price."
      },
      {
        field: 'timeHours',
        label: 'Time hours',
        helper: 'Expected repair, listing, travel, and delivery time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Resale Outcomes',
    fields: [
      {
        field: 'expectedWorkingSalePrice',
        label: 'Working sale price',
        helper: 'Your expected final item price if the repair succeeds.'
      },
      {
        field: 'expectedFailureRecoveryValue',
        label: 'Failure recovery value',
        helper: 'Your expected as-is or parts recovery value if the repair fails.'
      },
      {
        field: 'negotiationDiscountPercent',
        label: 'Negotiation discount',
        helper: 'Expected buyer discount from both success and failure resale values.',
        suffix: '%'
      }
    ]
  },
  {
    title: 'Repair Risk',
    fields: [
      {
        field: 'repairSuccessPercent',
        label: 'Repair success chance',
        helper:
          'Expected value blends the success and failure outcomes using the repair success chance that you provide.',
        suffix: '%'
      }
    ]
  },
  {
    title: 'Selling Costs',
    fields: [
      {
        field: 'platformFeePercent',
        label: 'Platform fee',
        helper: 'Percentage fee applied to item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      {
        field: 'fixedSellingFees',
        label: 'Fixed selling fees',
        helper: 'Fixed transaction, promotion, or supply fees.'
      },
      {
        field: 'shippingPaidByBuyer',
        label: 'Shipping paid by buyer',
        helper: 'Shipping amount collected from the buyer.'
      },
      {
        field: 'actualShippingCost',
        label: 'Actual shipping cost',
        helper: 'Your actual shipping expense.'
      }
    ]
  },
  {
    title: 'Repair and Preparation Costs',
    fields: [
      {
        field: 'screenRepairCost',
        label: 'Screen repair cost',
        helper: 'Screen or display repair expense.'
      },
      {
        field: 'batteryRepairCost',
        label: 'Battery repair cost',
        helper: 'Battery repair expense.'
      },
      {
        field: 'backGlassRepairCost',
        label: 'Back glass repair cost',
        helper: 'Back-glass or housing repair expense.'
      },
      {
        field: 'cameraOtherRepairCost',
        label: 'Camera and other repair cost',
        helper: 'Camera, port, button, board, or other repair expense.'
      },
      {
        field: 'diagnosticUnlockCost',
        label: 'Diagnostic or unlock cost',
        helper: 'Diagnostic, carrier-unlock, or service expense.'
      },
      {
        field: 'cleaningSuppliesCost',
        label: 'Cleaning supplies cost',
        helper: 'Cleaning and consumable expense.'
      },
      {
        field: 'travelCost',
        label: 'Travel cost',
        helper: 'Pickup or delivery expense.'
      },
      {
        field: 'otherCost',
        label: 'Other cost',
        helper: 'Other direct expense.'
      }
    ]
  },
  {
    title: 'Targets',
    fields: [
      {
        field: 'desiredMinimumProfit',
        label: 'Desired minimum profit',
        helper: 'Required expected dollar profit.'
      },
      {
        field: 'minimumRoiPercent',
        label: 'Minimum ROI',
        helper: 'Required expected return on investment percentage.',
        suffix: '%'
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

function createInitialFormState(): Record<PhoneFlipField, string> {
  return phoneFlipFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultPhoneFlipInput[field])
    }),
    {} as Record<PhoneFlipField, string>
  )
}

function parseFormState(formState: Record<PhoneFlipField, string>): PhoneFlipInput {
  return phoneFlipFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as PhoneFlipInput
  )
}

function groupErrors(errors: PhoneFlipValidationError[]): Partial<Record<PhoneFlipField, string>> {
  return errors.reduce<Partial<Record<PhoneFlipField, string>>>((groupedErrors, error) => {
    if (groupedErrors[error.field] === undefined) {
      groupedErrors[error.field] = error.message
    }

    return groupedErrors
  }, {})
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function formatPercent(value: number | null): string {
  return value === null ? 'Not available' : `${percentFormatter.format(value)}%`
}

function formatNullableCurrency(value: number | null): string {
  return value === null ? 'Not available' : formatCurrency(value)
}

function getDecisionLabel(status: PhoneFlipOutput['decisionStatus']): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

export function PhoneFlipPage() {
  const [formState, setFormState] = useState<Record<PhoneFlipField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<PhoneFlipField, string>>>({})
  const [result, setResult] = useState<PhoneFlipOutput | null>(null)

  const amountPositionLabel = useMemo(() => {
    if (result === null) {
      return 'Amount below or above maximum buy price'
    }

    return result.amountBelowMaximum >= 0 ? 'Amount below maximum buy price' : 'Amount above maximum buy price'
  }, [result])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validatePhoneFlipInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculatePhoneFlip(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="phone-flip-heading">
      <div className="calculator-intro">
        <p className="eyebrow">Phones</p>
        <h1 id="phone-flip-heading">Phone Flip Calculator</h1>
        <p>
          Evaluate a used, damaged, locked, or repairable phone using your resale values, repair costs, and repair-risk
          assumptions. FlipCalc does not determine phone value or repair probability; you supply both.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `phone-flip-${definition.field}`
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
            <p className="empty-results">Enter your assumptions and calculate to see the deal decision.</p>
          ) : (
            <>
              <div className={`decision-banner decision-${result.decisionStatus}`}>
                <span>Decision</span>
                <strong>{getDecisionLabel(result.decisionStatus)}</strong>
                <p>{result.decisionExplanation}</p>
              </div>

              <dl className="result-highlights">
                <div>
                  <dt>Final maximum buy price</dt>
                  <dd>{formatCurrency(result.maximumBuyPrice)}</dd>
                </div>
                <div>
                  <dt>Expected profit at asking price</dt>
                  <dd>{formatCurrency(result.expectedProfitAtAsk)}</dd>
                </div>
                <div>
                  <dt>Expected ROI</dt>
                  <dd>{formatPercent(result.expectedRoiPercent)}</dd>
                </div>
                <div>
                  <dt>Success-case profit</dt>
                  <dd>{formatCurrency(result.successProfitAtAsk)}</dd>
                </div>
                <div>
                  <dt>Failure-case profit</dt>
                  <dd>{formatCurrency(result.failureProfitAtAsk)}</dd>
                </div>
              </dl>

              <dl className="result-list">
                <div>
                  <dt>Total repair costs</dt>
                  <dd>{formatCurrency(result.repairCosts)}</dd>
                </div>
                <div>
                  <dt>Total preparation costs</dt>
                  <dd>{formatCurrency(result.preparationCosts)}</dd>
                </div>
                <div>
                  <dt>Discounted working revenue</dt>
                  <dd>{formatCurrency(result.discountedWorkingRevenue)}</dd>
                </div>
                <div>
                  <dt>Discounted failure recovery revenue</dt>
                  <dd>{formatCurrency(result.discountedFailureRevenue)}</dd>
                </div>
                <div>
                  <dt>Expected item sale revenue</dt>
                  <dd>{formatCurrency(result.expectedItemSaleRevenue)}</dd>
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
                  <dt>Total investment at asking price</dt>
                  <dd>{formatCurrency(result.totalInvestmentAtAsk)}</dd>
                </div>
                <div>
                  <dt>Expected hourly profit</dt>
                  <dd>{formatNullableCurrency(result.expectedHourlyProfit)}</dd>
                </div>
                <div>
                  <dt>Profit-limited maximum buy price</dt>
                  <dd>{formatCurrency(result.profitLimitedMaxBuyPrice)}</dd>
                </div>
                <div>
                  <dt>ROI-limited maximum buy price</dt>
                  <dd>{formatCurrency(result.roiLimitedMaxBuyPrice)}</dd>
                </div>
                <div>
                  <dt>{amountPositionLabel}</dt>
                  <dd>{formatCurrency(Math.abs(result.amountBelowMaximum))}</dd>
                </div>
                <div>
                  <dt>Break-even gross buyer payment</dt>
                  <dd>{formatCurrency(result.breakEvenGrossBuyerPayment)}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
