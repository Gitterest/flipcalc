export type LocalVsShippedStatus = 'buy-at-ask' | 'negotiate' | 'pass'
export type LocalVsShippedRecommendedSaleMethod = 'local' | 'shipped' | null

type SaleMethod = Exclude<LocalVsShippedRecommendedSaleMethod, null>

export interface LocalVsShippedInput {
  askingPrice: number
  acquisitionTravelCost: number
  preparationCost: number
  otherSharedCost: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
  expectedLocalSalePrice: number
  localNegotiationDiscountPercent: number
  localDeliveryCost: number
  localOtherCost: number
  localTimeHours: number
  expectedShippedSalePrice: number
  shippedNegotiationDiscountPercent: number
  platformFeePercent: number
  fixedSellingFees: number
  shippingPaidByBuyer: number
  actualShippingCost: number
  packingSuppliesCost: number
  shippedOtherCost: number
  shippedTimeHours: number
}

export type LocalVsShippedField = keyof LocalVsShippedInput

export interface LocalVsShippedValidationError {
  field: LocalVsShippedField
  message: string
}

export interface SaleOptionResult {
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
  status: LocalVsShippedStatus
}

export interface LocalVsShippedOutput {
  sharedCosts: number
  local: SaleOptionResult
  shipped: SaleOptionResult
  overallDecision: LocalVsShippedStatus
  recommendedSaleMethod: LocalVsShippedRecommendedSaleMethod
  overallMaximumBuyPrice: number
  profitDifferenceShippedMinusLocal: number
  hourlyProfitDifferenceShippedMinusLocal: number | null
}

export const localVsShippedFields = [
  'askingPrice',
  'acquisitionTravelCost',
  'preparationCost',
  'otherSharedCost',
  'desiredMinimumProfit',
  'minimumRoiPercent',
  'expectedLocalSalePrice',
  'localNegotiationDiscountPercent',
  'localDeliveryCost',
  'localOtherCost',
  'localTimeHours',
  'expectedShippedSalePrice',
  'shippedNegotiationDiscountPercent',
  'platformFeePercent',
  'fixedSellingFees',
  'shippingPaidByBuyer',
  'actualShippingCost',
  'packingSuppliesCost',
  'shippedOtherCost',
  'shippedTimeHours'
] as const satisfies readonly LocalVsShippedField[]

export const defaultLocalVsShippedInput: LocalVsShippedInput = {
  askingPrice: 0,
  acquisitionTravelCost: 0,
  preparationCost: 0,
  otherSharedCost: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0,
  expectedLocalSalePrice: 0,
  localNegotiationDiscountPercent: 0,
  localDeliveryCost: 0,
  localOtherCost: 0,
  localTimeHours: 0,
  expectedShippedSalePrice: 0,
  shippedNegotiationDiscountPercent: 0,
  platformFeePercent: 0,
  fixedSellingFees: 0,
  shippingPaidByBuyer: 0,
  actualShippingCost: 0,
  packingSuppliesCost: 0,
  shippedOtherCost: 0,
  shippedTimeHours: 0
}

const fieldLabels: Record<LocalVsShippedField, string> = {
  askingPrice: 'Asking price',
  acquisitionTravelCost: 'Acquisition travel cost',
  preparationCost: 'Preparation cost',
  otherSharedCost: 'Other shared cost',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI',
  expectedLocalSalePrice: 'Expected local sale price',
  localNegotiationDiscountPercent: 'Local negotiation discount',
  localDeliveryCost: 'Local delivery cost',
  localOtherCost: 'Local other cost',
  localTimeHours: 'Local time hours',
  expectedShippedSalePrice: 'Expected shipped sale price',
  shippedNegotiationDiscountPercent: 'Shipped negotiation discount',
  platformFeePercent: 'Platform fee',
  fixedSellingFees: 'Fixed selling fees',
  shippingPaidByBuyer: 'Shipping paid by buyer',
  actualShippingCost: 'Actual shipping cost',
  packingSuppliesCost: 'Packing supplies cost',
  shippedOtherCost: 'Shipped other cost',
  shippedTimeHours: 'Shipped time hours'
}

interface SaleOptionCalculationInput {
  askingPrice: number
  itemRevenue: number
  shippingPaidByBuyer: number
  fixedSellingFees: number
  nonPurchaseCostsBeforeFees: number
  timeHours: number
  feeRate: number
  minimumRoiRate: number
  desiredMinimumProfit: number
}

interface RankedSaleOption {
  method: SaleMethod
  result: SaleOptionResult
}

const saleMethodOrder: SaleMethod[] = ['local', 'shipped']

export function validateLocalVsShippedInput(
  input: Partial<Record<LocalVsShippedField, unknown>>
): LocalVsShippedValidationError[] {
  const errors: LocalVsShippedValidationError[] = []

  for (const field of localVsShippedFields) {
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

    if (field === 'localNegotiationDiscountPercent' && value > 100) {
      errors.push({
        field,
        message: 'Local negotiation discount must be between 0 and 100 percent.'
      })
    }

    if (field === 'shippedNegotiationDiscountPercent' && value > 100) {
      errors.push({
        field,
        message: 'Shipped negotiation discount must be between 0 and 100 percent.'
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

export function calculateLocalVsShipped(input: LocalVsShippedInput): LocalVsShippedOutput {
  const validationErrors = validateLocalVsShippedInput(input)

  if (validationErrors.length > 0) {
    throw new Error('Local vs Shipped input is invalid.')
  }

  const localDiscountRate = input.localNegotiationDiscountPercent / 100
  const shippedDiscountRate = input.shippedNegotiationDiscountPercent / 100
  const feeRate = input.platformFeePercent / 100
  const minimumRoiRate = input.minimumRoiPercent / 100
  const sharedCosts = input.acquisitionTravelCost + input.preparationCost + input.otherSharedCost

  const localItemRevenue = input.expectedLocalSalePrice * (1 - localDiscountRate)
  const local = calculateSaleOptionResult({
    askingPrice: input.askingPrice,
    itemRevenue: localItemRevenue,
    shippingPaidByBuyer: 0,
    fixedSellingFees: 0,
    nonPurchaseCostsBeforeFees: sharedCosts + input.localDeliveryCost + input.localOtherCost,
    timeHours: input.localTimeHours,
    feeRate: 0,
    minimumRoiRate,
    desiredMinimumProfit: input.desiredMinimumProfit
  })

  const shippedItemRevenue = input.expectedShippedSalePrice * (1 - shippedDiscountRate)
  const shipped = calculateSaleOptionResult({
    askingPrice: input.askingPrice,
    itemRevenue: shippedItemRevenue,
    shippingPaidByBuyer: input.shippingPaidByBuyer,
    fixedSellingFees: input.fixedSellingFees,
    nonPurchaseCostsBeforeFees: sharedCosts + input.actualShippingCost + input.packingSuppliesCost + input.shippedOtherCost,
    timeHours: input.shippedTimeHours,
    feeRate,
    minimumRoiRate,
    desiredMinimumProfit: input.desiredMinimumProfit
  })

  const overallMaximumBuyPrice = Math.max(local.maximumBuyPrice, shipped.maximumBuyPrice)
  const { overallDecision, recommendedSaleMethod } = getOverallRecommendation([
    { method: 'local', result: local },
    { method: 'shipped', result: shipped }
  ])
  const profitDifferenceShippedMinusLocal = shipped.profitAtAsk - local.profitAtAsk
  const hourlyProfitDifferenceShippedMinusLocal =
    shipped.hourlyProfit === null || local.hourlyProfit === null ? null : shipped.hourlyProfit - local.hourlyProfit

  return {
    sharedCosts,
    local,
    shipped,
    overallDecision,
    recommendedSaleMethod,
    overallMaximumBuyPrice,
    profitDifferenceShippedMinusLocal,
    hourlyProfitDifferenceShippedMinusLocal
  }
}

export function calculateSaleOptionResult(input: SaleOptionCalculationInput): SaleOptionResult {
  const grossBuyerPayment = input.itemRevenue + input.shippingPaidByBuyer
  const percentageSellingFee = grossBuyerPayment * input.feeRate
  const sellingFees = percentageSellingFee + input.fixedSellingFees
  const nonPurchaseCosts = input.nonPurchaseCostsBeforeFees + sellingFees
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const profitAtAsk = grossBuyerPayment - totalInvestmentAtAsk
  const roiPercent = totalInvestmentAtAsk > 0 ? (profitAtAsk / totalInvestmentAtAsk) * 100 : null
  const hourlyProfit = input.timeHours > 0 ? profitAtAsk / input.timeHours : null
  const profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + input.minimumRoiRate) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const status = getLocalVsShippedStatus(grossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

  return {
    itemRevenue: input.itemRevenue,
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
    status
  }
}

export function getLocalVsShippedStatus(
  grossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): LocalVsShippedStatus {
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

export function getOverallRecommendation(options: RankedSaleOption[]): {
  overallDecision: LocalVsShippedStatus
  recommendedSaleMethod: LocalVsShippedRecommendedSaleMethod
} {
  const buyAtAskOptions = options.filter((option) => option.result.status === 'buy-at-ask')

  if (buyAtAskOptions.length > 0) {
    return {
      overallDecision: 'buy-at-ask',
      recommendedSaleMethod: chooseHighestProfitOption(buyAtAskOptions).method
    }
  }

  const negotiationOptions = options.filter((option) => option.result.status === 'negotiate')

  if (negotiationOptions.length > 0) {
    return {
      overallDecision: 'negotiate',
      recommendedSaleMethod: chooseHighestMaximumBuyPriceOption(negotiationOptions).method
    }
  }

  return {
    overallDecision: 'pass',
    recommendedSaleMethod: null
  }
}

function chooseHighestProfitOption(options: RankedSaleOption[]): RankedSaleOption {
  return [...options].sort((left, right) => {
    const profitDifference = right.result.profitAtAsk - left.result.profitAtAsk

    if (profitDifference !== 0) {
      return profitDifference
    }

    const roiDifference = nullableValue(right.result.roiPercent) - nullableValue(left.result.roiPercent)

    if (roiDifference !== 0) {
      return roiDifference
    }

    if (right.result.hourlyProfit !== null && left.result.hourlyProfit !== null) {
      const hourlyDifference = right.result.hourlyProfit - left.result.hourlyProfit

      if (hourlyDifference !== 0) {
        return hourlyDifference
      }
    }

    return saleMethodOrder.indexOf(left.method) - saleMethodOrder.indexOf(right.method)
  })[0]
}

function chooseHighestMaximumBuyPriceOption(options: RankedSaleOption[]): RankedSaleOption {
  return [...options].sort((left, right) => {
    const maximumBuyPriceDifference = right.result.maximumBuyPrice - left.result.maximumBuyPrice

    if (maximumBuyPriceDifference !== 0) {
      return maximumBuyPriceDifference
    }

    return saleMethodOrder.indexOf(left.method) - saleMethodOrder.indexOf(right.method)
  })[0]
}

function nullableValue(value: number | null): number {
  return value === null ? Number.NEGATIVE_INFINITY : value
}
