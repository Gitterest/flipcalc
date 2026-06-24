export type PowerToolFlipDecisionStatus = 'buy-at-ask' | 'negotiate' | 'pass'

export interface PowerToolFlipInput {
  askingPrice: number
  expectedToolSalePrice: number
  expectedBatterySalePrice: number
  expectedChargerSalePrice: number
  expectedCaseAccessorySalePrice: number
  negotiationDiscountPercent: number
  platformFeePercent: number
  fixedSellingFees: number
  shippingPaidByBuyer: number
  actualShippingCost: number
  repairPartsCost: number
  cleaningSuppliesCost: number
  travelCost: number
  otherCost: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
  timeHours: number
}

export type PowerToolFlipField = keyof PowerToolFlipInput

export interface PowerToolFlipValidationError {
  field: PowerToolFlipField
  message: string
}

export interface PowerToolFlipOutput {
  componentValue: number
  expectedItemSaleRevenue: number
  grossBuyerPayment: number
  percentageSellingFee: number
  sellingFees: number
  nonPurchaseCosts: number
  totalInvestmentAtAsk: number
  expectedProfitAtAsk: number
  roiPercent: number | null
  hourlyProfit: number | null
  profitLimitedMaxBuyPrice: number
  roiLimitedMaxBuyPrice: number
  rawMaximumBuyPrice: number
  maximumBuyPrice: number
  amountBelowMaximum: number
  breakEvenGrossBuyerPayment: number
  decisionStatus: PowerToolFlipDecisionStatus
  decisionExplanation: string
}

export const powerToolFlipFields = [
  'askingPrice',
  'expectedToolSalePrice',
  'expectedBatterySalePrice',
  'expectedChargerSalePrice',
  'expectedCaseAccessorySalePrice',
  'negotiationDiscountPercent',
  'platformFeePercent',
  'fixedSellingFees',
  'shippingPaidByBuyer',
  'actualShippingCost',
  'repairPartsCost',
  'cleaningSuppliesCost',
  'travelCost',
  'otherCost',
  'desiredMinimumProfit',
  'minimumRoiPercent',
  'timeHours'
] as const satisfies readonly PowerToolFlipField[]

export const defaultPowerToolFlipInput: PowerToolFlipInput = {
  askingPrice: 0,
  expectedToolSalePrice: 0,
  expectedBatterySalePrice: 0,
  expectedChargerSalePrice: 0,
  expectedCaseAccessorySalePrice: 0,
  negotiationDiscountPercent: 0,
  platformFeePercent: 0,
  fixedSellingFees: 0,
  shippingPaidByBuyer: 0,
  actualShippingCost: 0,
  repairPartsCost: 0,
  cleaningSuppliesCost: 0,
  travelCost: 0,
  otherCost: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0,
  timeHours: 0
}

const fieldLabels: Record<PowerToolFlipField, string> = {
  askingPrice: 'Asking price',
  expectedToolSalePrice: 'Expected tool sale price',
  expectedBatterySalePrice: 'Expected battery sale price',
  expectedChargerSalePrice: 'Expected charger sale price',
  expectedCaseAccessorySalePrice: 'Expected case and accessory sale price',
  negotiationDiscountPercent: 'Negotiation discount',
  platformFeePercent: 'Platform fee',
  fixedSellingFees: 'Fixed selling fees',
  shippingPaidByBuyer: 'Shipping paid by buyer',
  actualShippingCost: 'Actual shipping cost',
  repairPartsCost: 'Repair parts cost',
  cleaningSuppliesCost: 'Cleaning supplies cost',
  travelCost: 'Travel cost',
  otherCost: 'Other cost',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI',
  timeHours: 'Time hours'
}

export function validatePowerToolFlipInput(input: Partial<Record<PowerToolFlipField, unknown>>): PowerToolFlipValidationError[] {
  const errors: PowerToolFlipValidationError[] = []

  for (const field of powerToolFlipFields) {
    const value = input[field]

    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push({
        field,
        message: `${fieldLabels[field]} must be a valid number.`
      })
      continue
    }

    if (value < 0) {
      errors.push({
        field,
        message: `${fieldLabels[field]} cannot be negative.`
      })
      continue
    }

    if (field === 'negotiationDiscountPercent' && value > 100) {
      errors.push({
        field,
        message: 'Negotiation discount must be between 0 and 100 percent.'
      })
    }

    if (field === 'platformFeePercent' && value >= 100) {
      errors.push({
        field,
        message: 'Platform fee must be less than 100 percent.'
      })
    }
  }

  return errors
}

export function calculatePowerToolFlip(input: PowerToolFlipInput): PowerToolFlipOutput {
  const validationErrors = validatePowerToolFlipInput(input)

  if (validationErrors.length > 0) {
    throw new Error('Power Tool Flip input is invalid.')
  }

  const componentValue =
    input.expectedToolSalePrice +
    input.expectedBatterySalePrice +
    input.expectedChargerSalePrice +
    input.expectedCaseAccessorySalePrice

  const discountRate = input.negotiationDiscountPercent / 100
  const feeRate = input.platformFeePercent / 100
  const minimumRoiRate = input.minimumRoiPercent / 100

  const expectedItemSaleRevenue = componentValue * (1 - discountRate)
  const grossBuyerPayment = expectedItemSaleRevenue + input.shippingPaidByBuyer
  const percentageSellingFee = grossBuyerPayment * feeRate
  const sellingFees = percentageSellingFee + input.fixedSellingFees
  const nonPurchaseCosts =
    sellingFees +
    input.actualShippingCost +
    input.repairPartsCost +
    input.cleaningSuppliesCost +
    input.travelCost +
    input.otherCost
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const expectedProfitAtAsk = grossBuyerPayment - totalInvestmentAtAsk
  const roiPercent = totalInvestmentAtAsk > 0 ? (expectedProfitAtAsk / totalInvestmentAtAsk) * 100 : null
  const hourlyProfit = input.timeHours > 0 ? expectedProfitAtAsk / input.timeHours : null
  const profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + minimumRoiRate) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const breakEvenGrossBuyerPayment =
    (input.askingPrice +
      input.fixedSellingFees +
      input.actualShippingCost +
      input.repairPartsCost +
      input.cleaningSuppliesCost +
      input.travelCost +
      input.otherCost) /
    (1 - feeRate)
  const decisionStatus = getPowerToolFlipDecisionStatus(grossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

  return {
    componentValue,
    expectedItemSaleRevenue,
    grossBuyerPayment,
    percentageSellingFee,
    sellingFees,
    nonPurchaseCosts,
    totalInvestmentAtAsk,
    expectedProfitAtAsk,
    roiPercent,
    hourlyProfit,
    profitLimitedMaxBuyPrice,
    roiLimitedMaxBuyPrice,
    rawMaximumBuyPrice,
    maximumBuyPrice,
    amountBelowMaximum,
    breakEvenGrossBuyerPayment,
    decisionStatus,
    decisionExplanation: getPowerToolFlipDecisionExplanation(decisionStatus)
  }
}

export function getPowerToolFlipDecisionStatus(
  grossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): PowerToolFlipDecisionStatus {
  if (grossBuyerPayment <= 0) {
    return 'pass'
  }

  if (rawMaximumBuyPrice < 0) {
    return 'pass'
  }

  if (askingPrice <= maximumBuyPrice) {
    return 'buy-at-ask'
  }

  return 'negotiate'
}

export function getPowerToolFlipDecisionExplanation(status: PowerToolFlipDecisionStatus): string {
  if (status === 'buy-at-ask') {
    return "The current asking price meets both the user's minimum profit and minimum ROI targets."
  }

  if (status === 'negotiate') {
    return 'The asking price is too high. Use the maximum buy price and the amount above it to negotiate.'
  }

  return "The entered assumptions cannot meet the user's targets even at a zero-dollar purchase price, or there is no expected revenue."
}
