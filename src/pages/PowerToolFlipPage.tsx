import { FormEvent, useMemo, useState } from 'react'
import {
  calculatePowerToolFlip,
  defaultPowerToolFlipInput,
  powerToolFlipFields,
  validatePowerToolFlipInput,
  type PowerToolFlipField,
  type PowerToolFlipInput,
  type PowerToolFlipOutput,
  type PowerToolFlipValidationError
} from '../calculators/powerToolFlip'

interface FieldDefinition {
  field: PowerToolFlipField
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
        helper: 'Expected labor, listing, pickup, and delivery time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Expected Resale',
    fields: [
      {
        field: 'expectedToolSalePrice',
        label: 'Tool resale value',
        helper: 'Your expected resale contribution for the tool.'
      },
      {
        field: 'expectedBatterySalePrice',
        label: 'Battery resale value',
        helper: 'Your expected resale contribution for included batteries.'
      },
      {
        field: 'expectedChargerSalePrice',
        label: 'Charger resale value',
        helper: 'Your expected resale contribution for chargers.'
      },
      {
        field: 'expectedCaseAccessorySalePrice',
        label: 'Case and accessory resale value',
        helper: 'Your expected resale contribution for cases and accessories.'
      },
      {
        field: 'negotiationDiscountPercent',
        label: 'Negotiation discount',
        helper: 'Expected buyer discount from combined component value.',
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
    title: 'Preparation Costs',
    fields: [
      {
        field: 'repairPartsCost',
        label: 'Repair parts cost',
        helper: 'Parts and outsourced repair expense.'
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
        helper: 'Required dollar profit.'
      },
      {
        field: 'minimumRoiPercent',
        label: 'Minimum ROI',
        helper: 'Required return on investment percentage.',
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

function createInitialFormState(): Record<PowerToolFlipField, string> {
  return powerToolFlipFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultPowerToolFlipInput[field])
    }),
    {} as Record<PowerToolFlipField, string>
  )
}

function parseFormState(formState: Record<PowerToolFlipField, string>): PowerToolFlipInput {
  return powerToolFlipFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as PowerToolFlipInput
  )
}

function groupErrors(errors: PowerToolFlipValidationError[]): Partial<Record<PowerToolFlipField, string>> {
  return errors.reduce<Partial<Record<PowerToolFlipField, string>>>((groupedErrors, error) => {
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

function getDecisionLabel(status: PowerToolFlipOutput['decisionStatus']): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

export function PowerToolFlipPage() {
  const [formState, setFormState] = useState<Record<PowerToolFlipField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<PowerToolFlipField, string>>>({})
  const [result, setResult] = useState<PowerToolFlipOutput | null>(null)

  const amountPositionLabel = useMemo(() => {
    if (result === null) {
      return 'Amount below or above maximum buy price'
    }

    return result.amountBelowMaximum >= 0 ? 'Amount below maximum buy price' : 'Amount above maximum buy price'
  }, [result])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validatePowerToolFlipInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculatePowerToolFlip(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="power-tool-heading">
      <div className="calculator-intro">
        <p className="eyebrow">Power tools</p>
        <h1 id="power-tool-heading">Power Tool Flip Calculator</h1>
        <p>
          Decide whether a tool, kit, battery, charger, case, or accessory bundle meets your profit and ROI targets.
          FlipCalc does not determine market value; you supply every resale assumption.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `power-tool-${definition.field}`
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
                  <dt>Maximum buy price</dt>
                  <dd>{formatCurrency(result.maximumBuyPrice)}</dd>
                </div>
                <div>
                  <dt>Expected profit</dt>
                  <dd>{formatCurrency(result.expectedProfitAtAsk)}</dd>
                </div>
                <div>
                  <dt>ROI</dt>
                  <dd>{formatPercent(result.roiPercent)}</dd>
                </div>
              </dl>

              <dl className="result-list">
                <div>
                  <dt>Combined component value</dt>
                  <dd>{formatCurrency(result.componentValue)}</dd>
                </div>
                <div>
                  <dt>Expected item sale revenue after negotiation</dt>
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
                  <dt>Hourly profit</dt>
                  <dd>{formatNullableCurrency(result.hourlyProfit)}</dd>
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
