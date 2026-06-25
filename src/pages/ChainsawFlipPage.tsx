import { FormEvent, useState } from 'react'
import {
  calculateChainsawFlip,
  chainsawFlipFields,
  defaultChainsawFlipInput,
  validateChainsawFlipInput,
  type ChainsawFlipField,
  type ChainsawFlipInput,
  type ChainsawFlipOutput,
  type ChainsawFlipRecommendedStrategy,
  type ChainsawFlipStatus,
  type ChainsawFlipValidationError,
  type ChainsawStrategyResult
} from '../calculators/chainsawFlip'

interface FieldDefinition {
  field: ChainsawFlipField
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
      {
        field: 'askingPrice',
        label: 'Asking price',
        helper: "Seller's current asking price."
      },
      {
        field: 'travelCost',
        label: 'Travel cost',
        helper: 'Acquisition travel expense shared by all strategies.'
      },
      {
        field: 'otherAcquisitionCost',
        label: 'Other acquisition cost',
        helper: 'Other acquisition expense shared by all strategies.'
      },
      {
        field: 'negotiationDiscountPercent',
        label: 'Negotiation discount',
        helper: 'Expected buyer discount applied to all item-revenue assumptions.',
        suffix: '%'
      },
      {
        field: 'platformFeePercent',
        label: 'Platform fee',
        helper: 'Percentage fee applied to item revenue plus buyer-paid shipping.',
        suffix: '%'
      },
      {
        field: 'desiredMinimumProfit',
        label: 'Desired minimum profit',
        helper: 'Required profit for a strategy.'
      },
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
      {
        field: 'expectedAsIsSalePrice',
        label: 'Expected as-is sale price',
        helper: 'Expected item price before negotiation.'
      },
      {
        field: 'asIsShippingPaidByBuyer',
        label: 'Shipping paid by buyer',
        helper: 'Shipping collected from the buyer.'
      },
      {
        field: 'asIsActualShippingCost',
        label: 'Actual shipping cost',
        helper: 'Your actual shipping expense.'
      },
      {
        field: 'asIsPreparationCost',
        label: 'Preparation cost',
        helper: 'Cleaning, minor supplies, or preparation expense.'
      },
      {
        field: 'asIsFixedSellingFees',
        label: 'Fixed selling fees',
        helper: 'Total fixed fees for the as-is sale.'
      },
      {
        field: 'asIsTimeHours',
        label: 'Time hours',
        helper: 'Expected time required.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Repair and Sell',
    fields: [
      {
        field: 'expectedRepairedSalePrice',
        label: 'Expected repaired sale price',
        helper: 'Expected item price if repair succeeds, before negotiation.'
      },
      {
        field: 'expectedFailedRepairRecoveryValue',
        label: 'Failed repair recovery value',
        helper: 'Expected as-is recovery value if repair fails, before negotiation.'
      },
      {
        field: 'repairSuccessPercent',
        label: 'Repair success chance',
        helper: 'User-supplied repair success probability.',
        suffix: '%'
      },
      {
        field: 'topEndPartsCost',
        label: 'Top-end parts cost',
        helper: 'Piston, cylinder, rings, gasket, or top-end expense.'
      },
      {
        field: 'carbFuelSystemCost',
        label: 'Carb and fuel-system cost',
        helper: 'Carburetor, fuel line, filter, intake, or fuel-system expense.'
      },
      {
        field: 'ignitionElectricalCost',
        label: 'Ignition and electrical cost',
        helper: 'Ignition, coil, plug, switch, wiring, or electrical expense.'
      },
      {
        field: 'barChainCost',
        label: 'Bar and chain cost',
        helper: 'Bar, chain, sprocket, clutch, or cutting-equipment expense.'
      },
      {
        field: 'otherRepairCost',
        label: 'Other repair cost',
        helper: 'Other repair expense.'
      },
      {
        field: 'repairPreparationCost',
        label: 'Repair preparation cost',
        helper: 'Cleaning, testing, and consumable expense beyond repair parts.'
      },
      {
        field: 'repairShippingPaidByBuyer',
        label: 'Shipping paid by buyer',
        helper: 'Shipping collected from the buyer.'
      },
      {
        field: 'repairActualShippingCost',
        label: 'Actual shipping cost',
        helper: 'Your actual shipping expense.'
      },
      {
        field: 'repairFixedSellingFees',
        label: 'Fixed selling fees',
        helper: 'Total fixed fees for the repaired sale.'
      },
      {
        field: 'repairTimeHours',
        label: 'Time hours',
        helper: 'Expected repair, testing, listing, and fulfillment time.',
        suffix: 'hrs'
      }
    ]
  },
  {
    title: 'Part Out',
    fields: [
      {
        field: 'expectedPartsGrossRevenue',
        label: 'Expected parts gross revenue',
        helper: 'Total potential item revenue if all entered parts sell.'
      },
      {
        field: 'partsSellThroughPercent',
        label: 'Parts sell-through',
        helper: 'User-supplied percentage of potential parts revenue expected to sell.',
        suffix: '%'
      },
      {
        field: 'partOutShippingPaidByBuyers',
        label: 'Shipping paid by buyers',
        helper: 'Total shipping expected to be collected across parts sales.'
      },
      {
        field: 'partOutActualShippingCost',
        label: 'Actual shipping cost',
        helper: 'Total actual shipping expense across parts sales.'
      },
      {
        field: 'partOutSuppliesCost',
        label: 'Supplies cost',
        helper: 'Teardown, packaging, labeling, cleaning, and storage supplies.'
      },
      {
        field: 'partOutFixedSellingFees',
        label: 'Fixed selling fees',
        helper: 'Total fixed fees across anticipated parts sales.'
      },
      {
        field: 'partOutTimeHours',
        label: 'Time hours',
        helper: 'Expected teardown, listing, storage, and fulfillment time.',
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

function createInitialFormState(): Record<ChainsawFlipField, string> {
  return chainsawFlipFields.reduce(
    (state, field) => ({
      ...state,
      [field]: String(defaultChainsawFlipInput[field])
    }),
    {} as Record<ChainsawFlipField, string>
  )
}

function parseFormState(formState: Record<ChainsawFlipField, string>): ChainsawFlipInput {
  return chainsawFlipFields.reduce(
    (input, field) => ({
      ...input,
      [field]: formState[field].trim() === '' ? 0 : Number(formState[field])
    }),
    {} as ChainsawFlipInput
  )
}

function groupErrors(errors: ChainsawFlipValidationError[]): Partial<Record<ChainsawFlipField, string>> {
  return errors.reduce<Partial<Record<ChainsawFlipField, string>>>((groupedErrors, error) => {
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

function getStatusLabel(status: ChainsawFlipStatus): string {
  if (status === 'buy-at-ask') {
    return 'Buy at ask'
  }

  if (status === 'negotiate') {
    return 'Negotiate'
  }

  return 'Pass'
}

function getStrategyLabel(strategy: ChainsawFlipRecommendedStrategy): string {
  if (strategy === 'as-is') {
    return 'Sell as-is'
  }

  if (strategy === 'repair') {
    return 'Repair and sell'
  }

  if (strategy === 'part-out') {
    return 'Part out'
  }

  return 'None'
}

function getDecisionExplanation(result: ChainsawFlipOutput): string {
  if (result.overallDecision === 'buy-at-ask') {
    return `${getStrategyLabel(result.recommendedStrategy)} meets the entered profit and ROI targets at the asking price.`
  }

  if (result.overallDecision === 'negotiate') {
    return `${getStrategyLabel(result.recommendedStrategy)} has the strongest maximum buy price, but the asking price is too high.`
  }

  return 'Every strategy has no revenue or cannot meet the entered targets even at a zero-dollar purchase price.'
}

interface StrategyCardProps {
  title: string
  result: ChainsawStrategyResult
  extraRows?: Array<{ label: string; value: string }>
}

function StrategyCard({ title, result, extraRows = [] }: StrategyCardProps) {
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
        {extraRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ChainsawFlipPage() {
  const [formState, setFormState] = useState<Record<ChainsawFlipField, string>>(createInitialFormState)
  const [errors, setErrors] = useState<Partial<Record<ChainsawFlipField, string>>>({})
  const [result, setResult] = useState<ChainsawFlipOutput | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInput = parseFormState(formState)
    const validationErrors = validateChainsawFlipInput(parsedInput)
    const groupedErrors = groupErrors(validationErrors)

    setErrors(groupedErrors)

    if (validationErrors.length > 0) {
      setResult(null)
      return
    }

    setResult(calculateChainsawFlip(parsedInput))
  }

  function handleReset() {
    setFormState(createInitialFormState())
    setErrors({})
    setResult(null)
  }

  return (
    <section className="calculator-page" aria-labelledby="chainsaw-flip-heading">
      <div className="calculator-intro">
        <p className="eyebrow">Chainsaws</p>
        <h1 id="chainsaw-flip-heading">Chainsaw Flip Strategy Calculator</h1>
        <p>
          Compare selling as-is, repairing and selling complete, or parting out one chainsaw. You supply every value,
          repair probability, and sell-through estimate; FlipCalc does not provide market prices or compatibility data.
        </p>
      </div>

      <div className="calculator-layout">
        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          {fieldGroups.map((group) => (
            <fieldset className="input-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="input-grid">
                {group.fields.map((definition) => {
                  const inputId = `chainsaw-flip-${definition.field}`
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
            <p className="empty-results">Enter your assumptions and calculate to compare the three strategies.</p>
          ) : (
            <>
              <div className={`decision-banner decision-${result.overallDecision}`}>
                <span>Overall decision</span>
                <strong>{getStatusLabel(result.overallDecision)}</strong>
                <p>{getDecisionExplanation(result)}</p>
              </div>

              <dl className="result-highlights">
                <div>
                  <dt>Recommended strategy</dt>
                  <dd>{getStrategyLabel(result.recommendedStrategy)}</dd>
                </div>
                <div>
                  <dt>Overall maximum buy price</dt>
                  <dd>{formatCurrency(result.overallMaximumBuyPrice)}</dd>
                </div>
              </dl>

              <div className="strategy-results">
                <StrategyCard title="Sell as-is" result={result.asIs} />
                <StrategyCard
                  title="Repair and sell"
                  result={result.repair}
                  extraRows={[
                    { label: 'Repair parts cost', value: formatCurrency(result.repairPartsCost) },
                    { label: 'Discounted repaired revenue', value: formatCurrency(result.discountedRepairedRevenue) },
                    {
                      label: 'Discounted failed-repair revenue',
                      value: formatCurrency(result.discountedFailedRepairRevenue)
                    },
                    { label: 'Success-case profit', value: formatCurrency(result.repairSuccessProfitAtAsk) },
                    { label: 'Failure-case profit', value: formatCurrency(result.repairFailureProfitAtAsk) }
                  ]}
                />
                <StrategyCard
                  title="Part out"
                  result={result.partOut}
                  extraRows={[{ label: 'Sellable parts revenue', value: formatCurrency(result.sellablePartsRevenue) }]}
                />
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
