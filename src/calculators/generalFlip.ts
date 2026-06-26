export type GeneralFlipStatus = 'buy-at-ask' | 'negotiate' | 'pass'

export interface GeneralFlipInput {
  askingPrice: number
  expectedSalePrice: number
  negotiationDiscountPercent: number
  sellingFeePercent: number
  fixedSellingFees: number
  shippingPaidByBuyer: number
  actualShippingCost: number
  acquisitionTravelCost: number
  preparationCost: number
  repairCost: number
  packingSuppliesCost: number
  otherCost: number
  timeHours: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
}

export type GeneralFlipField = keyof GeneralFlipInput

export interface GeneralFlipValidationError {
  field: GeneralFlipField
  message: string
}

export interface GeneralFlipOutput {
  discountRate: number
  feeRate: number
  minimumRoiRate: number
  itemRevenue: number
  grossBuyerPayment: number
  percentageSellingFee: number
  sellingFees: number
  nonPurchaseCosts: number
  totalInvestmentAtAsk: number
  profitAtAsk: number
  roiPercent: number | null
  hourlyProfit: number | null
  profitLimitedMaxBuyPrice: number
  roiLimitedMaxBuyPrice: number
  rawMaximumBuyPrice: number
  maximumBuyPrice: number
  amountBelowMaximum: number
  breakEvenBuyPrice: number
  decision: GeneralFlipStatus
}

export const generalFlipFields = [
  'askingPrice',
  'expectedSalePrice',
  'negotiationDiscountPercent',
  'sellingFeePercent',
  'fixedSellingFees',
  'shippingPaidByBuyer',
  'actualShippingCost',
  'acquisitionTravelCost',
  'preparationCost',
  'repairCost',
  'packingSuppliesCost',
  'otherCost',
  'timeHours',
  'desiredMinimumProfit',
  'minimumRoiPercent'
] as const satisfies readonly GeneralFlipField[]

export const defaultGeneralFlipInput: GeneralFlipInput = {
  askingPrice: 0,
  expectedSalePrice: 0,
  negotiationDiscountPercent: 0,
  sellingFeePercent: 0,
  fixedSellingFees: 0,
  shippingPaidByBuyer: 0,
  actualShippingCost: 0,
  acquisitionTravelCost: 0,
  preparationCost: 0,
  repairCost: 0,
  packingSuppliesCost: 0,
  otherCost: 0,
  timeHours: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0
}

const fieldLabels: Record<GeneralFlipField, string> = {
  askingPrice: 'Asking price',
  expectedSalePrice: 'Expected sale price',
  negotiationDiscountPercent: 'Negotiation discount',
  sellingFeePercent: 'Selling fee',
  fixedSellingFees: 'Fixed selling fees',
  shippingPaidByBuyer: 'Shipping paid by buyer',
  actualShippingCost: 'Actual shipping cost',
  acquisitionTravelCost: 'Acquisition travel cost',
  preparationCost: 'Preparation cost',
  repairCost: 'Repair cost',
  packingSuppliesCost: 'Packing supplies cost',
  otherCost: 'Other cost',
  timeHours: 'Time hours',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI'
}

export function validateGeneralFlipInput(
  input: Partial<Record<GeneralFlipField, unknown>>
): GeneralFlipValidationError[] {
  const errors: GeneralFlipValidationError[] = []

  for (const field of generalFlipFields) {
    const value = input[field]

    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push({ field, message: `${fieldLabels[field]} must be a valid number.` })
      continue
    }

    if (value < 0) {
      errors.push({ field, message: `${fieldLabels[field]} cannot be negative.` })
      continue
    }

    if (field === 'negotiationDiscountPercent' && value > 100) {
      errors.push({ field, message: `${fieldLabels[field]} must be between 0 and 100 percent.` })
    }

    if (field === 'sellingFeePercent' && value >= 100) {
      errors.push({ field, message: `${fieldLabels[field]} must be less than 100 percent.` })
    }
  }

  return errors
}

export function calculateGeneralFlip(input: GeneralFlipInput): GeneralFlipOutput {
  const validationErrors = validateGeneralFlipInput(input)

  if (validationErrors.length > 0) {
    throw new Error('General Flip input is invalid.')
  }

  const discountRate = input.negotiationDiscountPercent / 100
  const feeRate = input.sellingFeePercent / 100
  const minimumRoiRate = input.minimumRoiPercent / 100
  const itemRevenue = input.expectedSalePrice * (1 - discountRate)
  const grossBuyerPayment = itemRevenue + input.shippingPaidByBuyer
  const percentageSellingFee = grossBuyerPayment * feeRate
  const sellingFees = percentageSellingFee + input.fixedSellingFees
  const nonPurchaseCosts =
    input.acquisitionTravelCost +
    input.preparationCost +
    input.repairCost +
    input.packingSuppliesCost +
    input.actualShippingCost +
    input.otherCost +
    sellingFees
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const profitAtAsk = grossBuyerPayment - totalInvestmentAtAsk
  const roiPercent = totalInvestmentAtAsk > 0 ? (profitAtAsk / totalInvestmentAtAsk) * 100 : null
  const hourlyProfit = input.timeHours > 0 ? profitAtAsk / input.timeHours : null
  const profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + minimumRoiRate) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const breakEvenBuyPrice = Math.max(0, grossBuyerPayment - nonPurchaseCosts)
  const decision = getGeneralFlipDecision(grossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

  return {
    discountRate,
    feeRate,
    minimumRoiRate,
    itemRevenue,
    grossBuyerPayment,
    percentageSellingFee,
    sellingFees,
    nonPurchaseCosts,
    totalInvestmentAtAsk,
    profitAtAsk,
    roiPercent,
    hourlyProfit,
    profitLimitedMaxBuyPrice,
    roiLimitedMaxBuyPrice,
    rawMaximumBuyPrice,
    maximumBuyPrice,
    amountBelowMaximum,
    breakEvenBuyPrice,
    decision
  }
}

export function getGeneralFlipDecision(
  grossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): GeneralFlipStatus {
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
