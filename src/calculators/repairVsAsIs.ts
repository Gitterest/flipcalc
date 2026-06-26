export type RepairVsAsIsStatus = 'buy-at-ask' | 'negotiate' | 'pass'
export type RepairVsAsIsRecommendedMethod = 'as-is' | 'repair' | null

type Method = Exclude<RepairVsAsIsRecommendedMethod, null>

export interface RepairVsAsIsInput {
  askingPrice: number
  acquisitionTravelCost: number
  otherSharedCost: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
  asIsSalePrice: number
  asIsNegotiationDiscountPercent: number
  asIsSellingFeePercent: number
  asIsFixedFees: number
  asIsShippingCollected: number
  asIsShippingCost: number
  asIsOtherCost: number
  asIsTimeHours: number
  repairedSalePrice: number
  repairNegotiationDiscountPercent: number
  repairCost: number
  repairSuppliesCost: number
  repairFailureRiskPercent: number
  repairSellingFeePercent: number
  repairFixedFees: number
  repairShippingCollected: number
  repairShippingCost: number
  repairOtherCost: number
  repairTimeHours: number
}

export type RepairVsAsIsField = keyof RepairVsAsIsInput

export interface RepairVsAsIsValidationError {
  field: RepairVsAsIsField
  message: string
}

export interface RepairVsAsIsOptionResult {
  itemRevenue: number
  grossBuyerPayment: number
  effectiveGrossBuyerPayment: number
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
  status: RepairVsAsIsStatus
}

export interface RepairVsAsIsOutput {
  sharedCosts: number
  repairSuccessRate: number
  asIs: RepairVsAsIsOptionResult
  repair: RepairVsAsIsOptionResult
  overallDecision: RepairVsAsIsStatus
  recommendedMethod: RepairVsAsIsRecommendedMethod
  overallMaximumBuyPrice: number
  profitDifferenceRepairMinusAsIs: number
  hourlyProfitDifferenceRepairMinusAsIs: number | null
}

export const repairVsAsIsFields = [
  'askingPrice',
  'acquisitionTravelCost',
  'otherSharedCost',
  'desiredMinimumProfit',
  'minimumRoiPercent',
  'asIsSalePrice',
  'asIsNegotiationDiscountPercent',
  'asIsSellingFeePercent',
  'asIsFixedFees',
  'asIsShippingCollected',
  'asIsShippingCost',
  'asIsOtherCost',
  'asIsTimeHours',
  'repairedSalePrice',
  'repairNegotiationDiscountPercent',
  'repairCost',
  'repairSuppliesCost',
  'repairFailureRiskPercent',
  'repairSellingFeePercent',
  'repairFixedFees',
  'repairShippingCollected',
  'repairShippingCost',
  'repairOtherCost',
  'repairTimeHours'
] as const satisfies readonly RepairVsAsIsField[]

export const defaultRepairVsAsIsInput: RepairVsAsIsInput = {
  askingPrice: 0,
  acquisitionTravelCost: 0,
  otherSharedCost: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0,
  asIsSalePrice: 0,
  asIsNegotiationDiscountPercent: 0,
  asIsSellingFeePercent: 0,
  asIsFixedFees: 0,
  asIsShippingCollected: 0,
  asIsShippingCost: 0,
  asIsOtherCost: 0,
  asIsTimeHours: 0,
  repairedSalePrice: 0,
  repairNegotiationDiscountPercent: 0,
  repairCost: 0,
  repairSuppliesCost: 0,
  repairFailureRiskPercent: 0,
  repairSellingFeePercent: 0,
  repairFixedFees: 0,
  repairShippingCollected: 0,
  repairShippingCost: 0,
  repairOtherCost: 0,
  repairTimeHours: 0
}

const fieldLabels: Record<RepairVsAsIsField, string> = {
  askingPrice: 'Asking price',
  acquisitionTravelCost: 'Acquisition travel cost',
  otherSharedCost: 'Other shared cost',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI',
  asIsSalePrice: 'As-is sale price',
  asIsNegotiationDiscountPercent: 'As-is negotiation discount',
  asIsSellingFeePercent: 'As-is selling fee',
  asIsFixedFees: 'As-is fixed fees',
  asIsShippingCollected: 'As-is shipping collected',
  asIsShippingCost: 'As-is shipping cost',
  asIsOtherCost: 'As-is other cost',
  asIsTimeHours: 'As-is time hours',
  repairedSalePrice: 'Repaired sale price',
  repairNegotiationDiscountPercent: 'Repair negotiation discount',
  repairCost: 'Repair cost',
  repairSuppliesCost: 'Repair supplies cost',
  repairFailureRiskPercent: 'Repair failure risk',
  repairSellingFeePercent: 'Repair selling fee',
  repairFixedFees: 'Repair fixed fees',
  repairShippingCollected: 'Repair shipping collected',
  repairShippingCost: 'Repair shipping cost',
  repairOtherCost: 'Repair other cost',
  repairTimeHours: 'Repair time hours'
}

interface OptionCalculationInput {
  askingPrice: number
  salePrice: number
  discountPercent: number
  feePercent: number
  fixedFees: number
  shippingCollected: number
  nonPurchaseCostsBeforeFees: number
  timeHours: number
  effectiveGrossMultiplier: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
}

interface RankedOption {
  method: Method
  result: RepairVsAsIsOptionResult
}

const methodOrder: Method[] = ['as-is', 'repair']

export function validateRepairVsAsIsInput(
  input: Partial<Record<RepairVsAsIsField, unknown>>
): RepairVsAsIsValidationError[] {
  const errors: RepairVsAsIsValidationError[] = []

  for (const field of repairVsAsIsFields) {
    const value = input[field]

    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push({ field, message: `${fieldLabels[field]} must be a valid number.` })
      continue
    }

    if (value < 0) {
      errors.push({ field, message: `${fieldLabels[field]} cannot be negative.` })
      continue
    }

    if (
      (field === 'asIsNegotiationDiscountPercent' ||
        field === 'repairNegotiationDiscountPercent' ||
        field === 'repairFailureRiskPercent') &&
      value > 100
    ) {
      errors.push({ field, message: `${fieldLabels[field]} must be between 0 and 100 percent.` })
    }

    if ((field === 'asIsSellingFeePercent' || field === 'repairSellingFeePercent') && value >= 100) {
      errors.push({ field, message: `${fieldLabels[field]} must be less than 100 percent.` })
    }
  }

  return errors
}

export function calculateRepairVsAsIs(input: RepairVsAsIsInput): RepairVsAsIsOutput {
  const validationErrors = validateRepairVsAsIsInput(input)

  if (validationErrors.length > 0) {
    throw new Error('Repair vs Sell As-Is input is invalid.')
  }

  const sharedCosts = input.acquisitionTravelCost + input.otherSharedCost
  const repairSuccessRate = 1 - input.repairFailureRiskPercent / 100
  const asIs = calculateOptionResult({
    askingPrice: input.askingPrice,
    salePrice: input.asIsSalePrice,
    discountPercent: input.asIsNegotiationDiscountPercent,
    feePercent: input.asIsSellingFeePercent,
    fixedFees: input.asIsFixedFees,
    shippingCollected: input.asIsShippingCollected,
    nonPurchaseCostsBeforeFees: sharedCosts + input.asIsShippingCost + input.asIsOtherCost,
    timeHours: input.asIsTimeHours,
    effectiveGrossMultiplier: 1,
    desiredMinimumProfit: input.desiredMinimumProfit,
    minimumRoiPercent: input.minimumRoiPercent
  })
  const repair = calculateOptionResult({
    askingPrice: input.askingPrice,
    salePrice: input.repairedSalePrice,
    discountPercent: input.repairNegotiationDiscountPercent,
    feePercent: input.repairSellingFeePercent,
    fixedFees: input.repairFixedFees,
    shippingCollected: input.repairShippingCollected,
    nonPurchaseCostsBeforeFees:
      sharedCosts + input.repairCost + input.repairSuppliesCost + input.repairShippingCost + input.repairOtherCost,
    timeHours: input.repairTimeHours,
    effectiveGrossMultiplier: repairSuccessRate,
    desiredMinimumProfit: input.desiredMinimumProfit,
    minimumRoiPercent: input.minimumRoiPercent
  })
  const overallMaximumBuyPrice = Math.max(asIs.maximumBuyPrice, repair.maximumBuyPrice)
  const { overallDecision, recommendedMethod } = getOverallRecommendation([
    { method: 'as-is', result: asIs },
    { method: 'repair', result: repair }
  ])
  const profitDifferenceRepairMinusAsIs = repair.profitAtAsk - asIs.profitAtAsk
  const hourlyProfitDifferenceRepairMinusAsIs =
    repair.hourlyProfit === null || asIs.hourlyProfit === null ? null : repair.hourlyProfit - asIs.hourlyProfit

  return {
    sharedCosts,
    repairSuccessRate,
    asIs,
    repair,
    overallDecision,
    recommendedMethod,
    overallMaximumBuyPrice,
    profitDifferenceRepairMinusAsIs,
    hourlyProfitDifferenceRepairMinusAsIs
  }
}

export function calculateOptionResult(input: OptionCalculationInput): RepairVsAsIsOptionResult {
  const itemRevenue = input.salePrice * (1 - input.discountPercent / 100)
  const grossBuyerPayment = itemRevenue + input.shippingCollected
  const effectiveGrossBuyerPayment = grossBuyerPayment * input.effectiveGrossMultiplier
  const percentageSellingFee = grossBuyerPayment * (input.feePercent / 100)
  const sellingFees = percentageSellingFee + input.fixedFees
  const nonPurchaseCosts = input.nonPurchaseCostsBeforeFees + sellingFees
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const profitAtAsk = effectiveGrossBuyerPayment - totalInvestmentAtAsk
  const roiPercent = totalInvestmentAtAsk > 0 ? (profitAtAsk / totalInvestmentAtAsk) * 100 : null
  const hourlyProfit = input.timeHours > 0 ? profitAtAsk / input.timeHours : null
  const profitLimitedMaxBuyPrice = effectiveGrossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice =
    effectiveGrossBuyerPayment / (1 + input.minimumRoiPercent / 100) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const status = getRepairVsAsIsStatus(effectiveGrossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

  return {
    itemRevenue,
    grossBuyerPayment,
    effectiveGrossBuyerPayment,
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

export function getRepairVsAsIsStatus(
  effectiveGrossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): RepairVsAsIsStatus {
  if (effectiveGrossBuyerPayment <= 0) {
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

export function getOverallRecommendation(options: RankedOption[]): {
  overallDecision: RepairVsAsIsStatus
  recommendedMethod: RepairVsAsIsRecommendedMethod
} {
  const buyAtAskOptions = options.filter((option) => option.result.status === 'buy-at-ask')

  if (buyAtAskOptions.length > 0) {
    return {
      overallDecision: 'buy-at-ask',
      recommendedMethod: chooseHighestProfitOption(buyAtAskOptions).method
    }
  }

  const negotiationOptions = options.filter((option) => option.result.status === 'negotiate')

  if (negotiationOptions.length > 0) {
    return {
      overallDecision: 'negotiate',
      recommendedMethod: chooseHighestMaximumBuyPriceOption(negotiationOptions).method
    }
  }

  return {
    overallDecision: 'pass',
    recommendedMethod: null
  }
}

function chooseHighestProfitOption(options: RankedOption[]): RankedOption {
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

    return methodOrder.indexOf(left.method) - methodOrder.indexOf(right.method)
  })[0]
}

function chooseHighestMaximumBuyPriceOption(options: RankedOption[]): RankedOption {
  return [...options].sort((left, right) => {
    const maximumBuyPriceDifference = right.result.maximumBuyPrice - left.result.maximumBuyPrice

    if (maximumBuyPriceDifference !== 0) {
      return maximumBuyPriceDifference
    }

    return methodOrder.indexOf(left.method) - methodOrder.indexOf(right.method)
  })[0]
}

function nullableValue(value: number | null): number {
  return value === null ? Number.NEGATIVE_INFINITY : value
}
