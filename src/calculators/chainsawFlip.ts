export type ChainsawFlipStatus = 'buy-at-ask' | 'negotiate' | 'pass'
export type ChainsawFlipRecommendedStrategy = 'as-is' | 'repair' | 'part-out' | null

type StrategyId = Exclude<ChainsawFlipRecommendedStrategy, null>

export interface ChainsawFlipInput {
  askingPrice: number
  travelCost: number
  otherAcquisitionCost: number
  negotiationDiscountPercent: number
  platformFeePercent: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
  expectedAsIsSalePrice: number
  asIsShippingPaidByBuyer: number
  asIsActualShippingCost: number
  asIsPreparationCost: number
  asIsFixedSellingFees: number
  asIsTimeHours: number
  expectedRepairedSalePrice: number
  expectedFailedRepairRecoveryValue: number
  repairSuccessPercent: number
  topEndPartsCost: number
  carbFuelSystemCost: number
  ignitionElectricalCost: number
  barChainCost: number
  otherRepairCost: number
  repairPreparationCost: number
  repairShippingPaidByBuyer: number
  repairActualShippingCost: number
  repairFixedSellingFees: number
  repairTimeHours: number
  expectedPartsGrossRevenue: number
  partsSellThroughPercent: number
  partOutShippingPaidByBuyers: number
  partOutActualShippingCost: number
  partOutSuppliesCost: number
  partOutFixedSellingFees: number
  partOutTimeHours: number
}

export type ChainsawFlipField = keyof ChainsawFlipInput

export interface ChainsawFlipValidationError {
  field: ChainsawFlipField
  message: string
}

export interface ChainsawStrategyResult {
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
  status: ChainsawFlipStatus
}

export interface ChainsawFlipOutput {
  repairPartsCost: number
  discountedRepairedRevenue: number
  discountedFailedRepairRevenue: number
  expectedRepairItemRevenue: number
  repairSuccessProfitAtAsk: number
  repairFailureProfitAtAsk: number
  sellablePartsRevenue: number
  asIs: ChainsawStrategyResult
  repair: ChainsawStrategyResult
  partOut: ChainsawStrategyResult
  overallDecision: ChainsawFlipStatus
  recommendedStrategy: ChainsawFlipRecommendedStrategy
  overallMaximumBuyPrice: number
}

export const chainsawFlipFields = [
  'askingPrice',
  'travelCost',
  'otherAcquisitionCost',
  'negotiationDiscountPercent',
  'platformFeePercent',
  'desiredMinimumProfit',
  'minimumRoiPercent',
  'expectedAsIsSalePrice',
  'asIsShippingPaidByBuyer',
  'asIsActualShippingCost',
  'asIsPreparationCost',
  'asIsFixedSellingFees',
  'asIsTimeHours',
  'expectedRepairedSalePrice',
  'expectedFailedRepairRecoveryValue',
  'repairSuccessPercent',
  'topEndPartsCost',
  'carbFuelSystemCost',
  'ignitionElectricalCost',
  'barChainCost',
  'otherRepairCost',
  'repairPreparationCost',
  'repairShippingPaidByBuyer',
  'repairActualShippingCost',
  'repairFixedSellingFees',
  'repairTimeHours',
  'expectedPartsGrossRevenue',
  'partsSellThroughPercent',
  'partOutShippingPaidByBuyers',
  'partOutActualShippingCost',
  'partOutSuppliesCost',
  'partOutFixedSellingFees',
  'partOutTimeHours'
] as const satisfies readonly ChainsawFlipField[]

export const defaultChainsawFlipInput: ChainsawFlipInput = {
  askingPrice: 0,
  travelCost: 0,
  otherAcquisitionCost: 0,
  negotiationDiscountPercent: 0,
  platformFeePercent: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0,
  expectedAsIsSalePrice: 0,
  asIsShippingPaidByBuyer: 0,
  asIsActualShippingCost: 0,
  asIsPreparationCost: 0,
  asIsFixedSellingFees: 0,
  asIsTimeHours: 0,
  expectedRepairedSalePrice: 0,
  expectedFailedRepairRecoveryValue: 0,
  repairSuccessPercent: 0,
  topEndPartsCost: 0,
  carbFuelSystemCost: 0,
  ignitionElectricalCost: 0,
  barChainCost: 0,
  otherRepairCost: 0,
  repairPreparationCost: 0,
  repairShippingPaidByBuyer: 0,
  repairActualShippingCost: 0,
  repairFixedSellingFees: 0,
  repairTimeHours: 0,
  expectedPartsGrossRevenue: 0,
  partsSellThroughPercent: 0,
  partOutShippingPaidByBuyers: 0,
  partOutActualShippingCost: 0,
  partOutSuppliesCost: 0,
  partOutFixedSellingFees: 0,
  partOutTimeHours: 0
}

const fieldLabels: Record<ChainsawFlipField, string> = {
  askingPrice: 'Asking price',
  travelCost: 'Travel cost',
  otherAcquisitionCost: 'Other acquisition cost',
  negotiationDiscountPercent: 'Negotiation discount',
  platformFeePercent: 'Platform fee',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI',
  expectedAsIsSalePrice: 'Expected as-is sale price',
  asIsShippingPaidByBuyer: 'As-is shipping paid by buyer',
  asIsActualShippingCost: 'As-is actual shipping cost',
  asIsPreparationCost: 'As-is preparation cost',
  asIsFixedSellingFees: 'As-is fixed selling fees',
  asIsTimeHours: 'As-is time hours',
  expectedRepairedSalePrice: 'Expected repaired sale price',
  expectedFailedRepairRecoveryValue: 'Expected failed repair recovery value',
  repairSuccessPercent: 'Repair success',
  topEndPartsCost: 'Top-end parts cost',
  carbFuelSystemCost: 'Carb and fuel-system cost',
  ignitionElectricalCost: 'Ignition and electrical cost',
  barChainCost: 'Bar and chain cost',
  otherRepairCost: 'Other repair cost',
  repairPreparationCost: 'Repair preparation cost',
  repairShippingPaidByBuyer: 'Repair shipping paid by buyer',
  repairActualShippingCost: 'Repair actual shipping cost',
  repairFixedSellingFees: 'Repair fixed selling fees',
  repairTimeHours: 'Repair time hours',
  expectedPartsGrossRevenue: 'Expected parts gross revenue',
  partsSellThroughPercent: 'Parts sell-through',
  partOutShippingPaidByBuyers: 'Part-out shipping paid by buyers',
  partOutActualShippingCost: 'Part-out actual shipping cost',
  partOutSuppliesCost: 'Part-out supplies cost',
  partOutFixedSellingFees: 'Part-out fixed selling fees',
  partOutTimeHours: 'Part-out time hours'
}

interface StrategyCalculationInput {
  askingPrice: number
  itemRevenue: number
  shippingPaidByBuyer: number
  fixedSellingFees: number
  baseNonPurchaseCosts: number
  actualShippingCost: number
  timeHours: number
  feeRate: number
  minimumRoiRate: number
  desiredMinimumProfit: number
}

interface RankedStrategy {
  id: StrategyId
  result: ChainsawStrategyResult
}

const strategyOrder: StrategyId[] = ['as-is', 'repair', 'part-out']

export function validateChainsawFlipInput(
  input: Partial<Record<ChainsawFlipField, unknown>>
): ChainsawFlipValidationError[] {
  const errors: ChainsawFlipValidationError[] = []

  for (const field of chainsawFlipFields) {
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

    if (field === 'repairSuccessPercent' && value > 100) {
      errors.push({
        field,
        message: 'Repair success must be between 0 and 100 percent.'
      })
    }

    if (field === 'partsSellThroughPercent' && value > 100) {
      errors.push({
        field,
        message: 'Parts sell-through must be between 0 and 100 percent.'
      })
    }
  }

  return errors
}

export function calculateChainsawFlip(input: ChainsawFlipInput): ChainsawFlipOutput {
  const validationErrors = validateChainsawFlipInput(input)

  if (validationErrors.length > 0) {
    throw new Error('Chainsaw Flip input is invalid.')
  }

  const discountRate = input.negotiationDiscountPercent / 100
  const feeRate = input.platformFeePercent / 100
  const minimumRoiRate = input.minimumRoiPercent / 100
  const repairSuccessRate = input.repairSuccessPercent / 100
  const partsSellThroughRate = input.partsSellThroughPercent / 100

  const asIsItemRevenue = input.expectedAsIsSalePrice * (1 - discountRate)
  const asIs = calculateStrategyResult({
    askingPrice: input.askingPrice,
    itemRevenue: asIsItemRevenue,
    shippingPaidByBuyer: input.asIsShippingPaidByBuyer,
    fixedSellingFees: input.asIsFixedSellingFees,
    baseNonPurchaseCosts: input.travelCost + input.otherAcquisitionCost + input.asIsPreparationCost,
    actualShippingCost: input.asIsActualShippingCost,
    timeHours: input.asIsTimeHours,
    feeRate,
    minimumRoiRate,
    desiredMinimumProfit: input.desiredMinimumProfit
  })

  const repairPartsCost =
    input.topEndPartsCost +
    input.carbFuelSystemCost +
    input.ignitionElectricalCost +
    input.barChainCost +
    input.otherRepairCost
  const discountedRepairedRevenue = input.expectedRepairedSalePrice * (1 - discountRate)
  const discountedFailedRepairRevenue = input.expectedFailedRepairRecoveryValue * (1 - discountRate)
  const expectedRepairItemRevenue =
    discountedRepairedRevenue * repairSuccessRate + discountedFailedRepairRevenue * (1 - repairSuccessRate)
  const repair = calculateStrategyResult({
    askingPrice: input.askingPrice,
    itemRevenue: expectedRepairItemRevenue,
    shippingPaidByBuyer: input.repairShippingPaidByBuyer,
    fixedSellingFees: input.repairFixedSellingFees,
    baseNonPurchaseCosts:
      input.travelCost + input.otherAcquisitionCost + repairPartsCost + input.repairPreparationCost,
    actualShippingCost: input.repairActualShippingCost,
    timeHours: input.repairTimeHours,
    feeRate,
    minimumRoiRate,
    desiredMinimumProfit: input.desiredMinimumProfit
  })
  const repairSuccessGrossBuyerPayment = discountedRepairedRevenue + input.repairShippingPaidByBuyer
  const repairFailureGrossBuyerPayment = discountedFailedRepairRevenue + input.repairShippingPaidByBuyer
  const repairSuccessSellingFees = repairSuccessGrossBuyerPayment * feeRate + input.repairFixedSellingFees
  const repairFailureSellingFees = repairFailureGrossBuyerPayment * feeRate + input.repairFixedSellingFees
  const repairSuccessProfitAtAsk =
    repairSuccessGrossBuyerPayment -
    (input.askingPrice +
      input.travelCost +
      input.otherAcquisitionCost +
      repairPartsCost +
      input.repairPreparationCost +
      repairSuccessSellingFees +
      input.repairActualShippingCost)
  const repairFailureProfitAtAsk =
    repairFailureGrossBuyerPayment -
    (input.askingPrice +
      input.travelCost +
      input.otherAcquisitionCost +
      repairPartsCost +
      input.repairPreparationCost +
      repairFailureSellingFees +
      input.repairActualShippingCost)

  const sellablePartsRevenue = input.expectedPartsGrossRevenue * partsSellThroughRate
  const partOutItemRevenue = sellablePartsRevenue * (1 - discountRate)
  const partOut = calculateStrategyResult({
    askingPrice: input.askingPrice,
    itemRevenue: partOutItemRevenue,
    shippingPaidByBuyer: input.partOutShippingPaidByBuyers,
    fixedSellingFees: input.partOutFixedSellingFees,
    baseNonPurchaseCosts: input.travelCost + input.otherAcquisitionCost + input.partOutSuppliesCost,
    actualShippingCost: input.partOutActualShippingCost,
    timeHours: input.partOutTimeHours,
    feeRate,
    minimumRoiRate,
    desiredMinimumProfit: input.desiredMinimumProfit
  })

  const overallMaximumBuyPrice = Math.max(asIs.maximumBuyPrice, repair.maximumBuyPrice, partOut.maximumBuyPrice)
  const { overallDecision, recommendedStrategy } = getOverallRecommendation([
    { id: 'as-is', result: asIs },
    { id: 'repair', result: repair },
    { id: 'part-out', result: partOut }
  ])

  return {
    repairPartsCost,
    discountedRepairedRevenue,
    discountedFailedRepairRevenue,
    expectedRepairItemRevenue,
    repairSuccessProfitAtAsk,
    repairFailureProfitAtAsk,
    sellablePartsRevenue,
    asIs,
    repair,
    partOut,
    overallDecision,
    recommendedStrategy,
    overallMaximumBuyPrice
  }
}

export function calculateStrategyResult(input: StrategyCalculationInput): ChainsawStrategyResult {
  const grossBuyerPayment = input.itemRevenue + input.shippingPaidByBuyer
  const percentageSellingFee = grossBuyerPayment * input.feeRate
  const sellingFees = percentageSellingFee + input.fixedSellingFees
  const nonPurchaseCosts = input.baseNonPurchaseCosts + sellingFees + input.actualShippingCost
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const profitAtAsk = grossBuyerPayment - totalInvestmentAtAsk
  const roiPercent = totalInvestmentAtAsk > 0 ? (profitAtAsk / totalInvestmentAtAsk) * 100 : null
  const hourlyProfit = input.timeHours > 0 ? profitAtAsk / input.timeHours : null
  const profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + input.minimumRoiRate) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const status = getChainsawFlipStatus(grossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

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

export function getChainsawFlipStatus(
  grossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): ChainsawFlipStatus {
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

export function getOverallRecommendation(strategies: RankedStrategy[]): {
  overallDecision: ChainsawFlipStatus
  recommendedStrategy: ChainsawFlipRecommendedStrategy
} {
  const buyAtAskStrategies = strategies.filter((strategy) => strategy.result.status === 'buy-at-ask')

  if (buyAtAskStrategies.length > 0) {
    return {
      overallDecision: 'buy-at-ask',
      recommendedStrategy: chooseHighestProfitStrategy(buyAtAskStrategies).id
    }
  }

  const negotiationStrategies = strategies.filter((strategy) => strategy.result.status === 'negotiate')

  if (negotiationStrategies.length > 0) {
    return {
      overallDecision: 'negotiate',
      recommendedStrategy: chooseHighestMaximumBuyPriceStrategy(negotiationStrategies).id
    }
  }

  return {
    overallDecision: 'pass',
    recommendedStrategy: null
  }
}

function chooseHighestProfitStrategy(strategies: RankedStrategy[]): RankedStrategy {
  return [...strategies].sort((left, right) => {
    const profitDifference = right.result.profitAtAsk - left.result.profitAtAsk

    if (profitDifference !== 0) {
      return profitDifference
    }

    const roiDifference = nullableRoiValue(right.result.roiPercent) - nullableRoiValue(left.result.roiPercent)

    if (roiDifference !== 0) {
      return roiDifference
    }

    return strategyOrder.indexOf(left.id) - strategyOrder.indexOf(right.id)
  })[0]
}

function chooseHighestMaximumBuyPriceStrategy(strategies: RankedStrategy[]): RankedStrategy {
  return [...strategies].sort((left, right) => {
    const maximumBuyPriceDifference = right.result.maximumBuyPrice - left.result.maximumBuyPrice

    if (maximumBuyPriceDifference !== 0) {
      return maximumBuyPriceDifference
    }

    return strategyOrder.indexOf(left.id) - strategyOrder.indexOf(right.id)
  })[0]
}

function nullableRoiValue(value: number | null): number {
  return value === null ? Number.NEGATIVE_INFINITY : value
}
