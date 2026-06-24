export type PhoneFlipDecisionStatus = 'buy-at-ask' | 'negotiate' | 'pass'

export interface PhoneFlipInput {
  askingPrice: number
  expectedWorkingSalePrice: number
  expectedFailureRecoveryValue: number
  repairSuccessPercent: number
  negotiationDiscountPercent: number
  platformFeePercent: number
  fixedSellingFees: number
  shippingPaidByBuyer: number
  actualShippingCost: number
  screenRepairCost: number
  batteryRepairCost: number
  backGlassRepairCost: number
  cameraOtherRepairCost: number
  diagnosticUnlockCost: number
  cleaningSuppliesCost: number
  travelCost: number
  otherCost: number
  desiredMinimumProfit: number
  minimumRoiPercent: number
  timeHours: number
}

export type PhoneFlipField = keyof PhoneFlipInput

export interface PhoneFlipValidationError {
  field: PhoneFlipField
  message: string
}

export interface PhoneFlipOutput {
  repairCosts: number
  preparationCosts: number
  discountedWorkingRevenue: number
  discountedFailureRevenue: number
  expectedItemSaleRevenue: number
  grossBuyerPayment: number
  percentageSellingFee: number
  sellingFees: number
  nonPurchaseCosts: number
  totalInvestmentAtAsk: number
  expectedProfitAtAsk: number
  expectedRoiPercent: number | null
  expectedHourlyProfit: number | null
  successGrossBuyerPayment: number
  failureGrossBuyerPayment: number
  successSellingFees: number
  failureSellingFees: number
  successProfitAtAsk: number
  failureProfitAtAsk: number
  profitLimitedMaxBuyPrice: number
  roiLimitedMaxBuyPrice: number
  rawMaximumBuyPrice: number
  maximumBuyPrice: number
  amountBelowMaximum: number
  breakEvenGrossBuyerPayment: number
  decisionStatus: PhoneFlipDecisionStatus
  decisionExplanation: string
}

export const phoneFlipFields = [
  'askingPrice',
  'expectedWorkingSalePrice',
  'expectedFailureRecoveryValue',
  'repairSuccessPercent',
  'negotiationDiscountPercent',
  'platformFeePercent',
  'fixedSellingFees',
  'shippingPaidByBuyer',
  'actualShippingCost',
  'screenRepairCost',
  'batteryRepairCost',
  'backGlassRepairCost',
  'cameraOtherRepairCost',
  'diagnosticUnlockCost',
  'cleaningSuppliesCost',
  'travelCost',
  'otherCost',
  'desiredMinimumProfit',
  'minimumRoiPercent',
  'timeHours'
] as const satisfies readonly PhoneFlipField[]

export const defaultPhoneFlipInput: PhoneFlipInput = {
  askingPrice: 0,
  expectedWorkingSalePrice: 0,
  expectedFailureRecoveryValue: 0,
  repairSuccessPercent: 0,
  negotiationDiscountPercent: 0,
  platformFeePercent: 0,
  fixedSellingFees: 0,
  shippingPaidByBuyer: 0,
  actualShippingCost: 0,
  screenRepairCost: 0,
  batteryRepairCost: 0,
  backGlassRepairCost: 0,
  cameraOtherRepairCost: 0,
  diagnosticUnlockCost: 0,
  cleaningSuppliesCost: 0,
  travelCost: 0,
  otherCost: 0,
  desiredMinimumProfit: 0,
  minimumRoiPercent: 0,
  timeHours: 0
}

const fieldLabels: Record<PhoneFlipField, string> = {
  askingPrice: 'Asking price',
  expectedWorkingSalePrice: 'Expected working sale price',
  expectedFailureRecoveryValue: 'Expected failure recovery value',
  repairSuccessPercent: 'Repair success',
  negotiationDiscountPercent: 'Negotiation discount',
  platformFeePercent: 'Platform fee',
  fixedSellingFees: 'Fixed selling fees',
  shippingPaidByBuyer: 'Shipping paid by buyer',
  actualShippingCost: 'Actual shipping cost',
  screenRepairCost: 'Screen repair cost',
  batteryRepairCost: 'Battery repair cost',
  backGlassRepairCost: 'Back glass repair cost',
  cameraOtherRepairCost: 'Camera and other repair cost',
  diagnosticUnlockCost: 'Diagnostic and unlock cost',
  cleaningSuppliesCost: 'Cleaning supplies cost',
  travelCost: 'Travel cost',
  otherCost: 'Other cost',
  desiredMinimumProfit: 'Desired minimum profit',
  minimumRoiPercent: 'Minimum ROI',
  timeHours: 'Time hours'
}

export function validatePhoneFlipInput(input: Partial<Record<PhoneFlipField, unknown>>): PhoneFlipValidationError[] {
  const errors: PhoneFlipValidationError[] = []

  for (const field of phoneFlipFields) {
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

    if (field === 'repairSuccessPercent' && value > 100) {
      errors.push({
        field,
        message: 'Repair success must be between 0 and 100 percent.'
      })
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

export function calculatePhoneFlip(input: PhoneFlipInput): PhoneFlipOutput {
  const validationErrors = validatePhoneFlipInput(input)

  if (validationErrors.length > 0) {
    throw new Error('Phone Flip input is invalid.')
  }

  const repairSuccessRate = input.repairSuccessPercent / 100
  const discountRate = input.negotiationDiscountPercent / 100
  const feeRate = input.platformFeePercent / 100
  const minimumRoiRate = input.minimumRoiPercent / 100
  const repairCosts =
    input.screenRepairCost +
    input.batteryRepairCost +
    input.backGlassRepairCost +
    input.cameraOtherRepairCost +
    input.diagnosticUnlockCost
  const preparationCosts = repairCosts + input.cleaningSuppliesCost + input.travelCost + input.otherCost
  const discountedWorkingRevenue = input.expectedWorkingSalePrice * (1 - discountRate)
  const discountedFailureRevenue = input.expectedFailureRecoveryValue * (1 - discountRate)
  const expectedItemSaleRevenue =
    discountedWorkingRevenue * repairSuccessRate + discountedFailureRevenue * (1 - repairSuccessRate)
  const grossBuyerPayment = expectedItemSaleRevenue + input.shippingPaidByBuyer
  const percentageSellingFee = grossBuyerPayment * feeRate
  const sellingFees = percentageSellingFee + input.fixedSellingFees
  const nonPurchaseCosts = sellingFees + input.actualShippingCost + preparationCosts
  const totalInvestmentAtAsk = input.askingPrice + nonPurchaseCosts
  const expectedProfitAtAsk = grossBuyerPayment - totalInvestmentAtAsk
  const expectedRoiPercent = totalInvestmentAtAsk > 0 ? (expectedProfitAtAsk / totalInvestmentAtAsk) * 100 : null
  const expectedHourlyProfit = input.timeHours > 0 ? expectedProfitAtAsk / input.timeHours : null
  const successGrossBuyerPayment = discountedWorkingRevenue + input.shippingPaidByBuyer
  const failureGrossBuyerPayment = discountedFailureRevenue + input.shippingPaidByBuyer
  const successSellingFees = successGrossBuyerPayment * feeRate + input.fixedSellingFees
  const failureSellingFees = failureGrossBuyerPayment * feeRate + input.fixedSellingFees
  const successProfitAtAsk =
    successGrossBuyerPayment -
    (input.askingPrice + successSellingFees + input.actualShippingCost + preparationCosts)
  const failureProfitAtAsk =
    failureGrossBuyerPayment -
    (input.askingPrice + failureSellingFees + input.actualShippingCost + preparationCosts)
  const profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - input.desiredMinimumProfit
  const roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + minimumRoiRate) - nonPurchaseCosts
  const rawMaximumBuyPrice = Math.min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)
  const maximumBuyPrice = Math.max(0, rawMaximumBuyPrice)
  const amountBelowMaximum = maximumBuyPrice - input.askingPrice
  const breakEvenGrossBuyerPayment =
    (input.askingPrice + input.fixedSellingFees + input.actualShippingCost + preparationCosts) / (1 - feeRate)
  const decisionStatus = getPhoneFlipDecisionStatus(grossBuyerPayment, rawMaximumBuyPrice, input.askingPrice, maximumBuyPrice)

  return {
    repairCosts,
    preparationCosts,
    discountedWorkingRevenue,
    discountedFailureRevenue,
    expectedItemSaleRevenue,
    grossBuyerPayment,
    percentageSellingFee,
    sellingFees,
    nonPurchaseCosts,
    totalInvestmentAtAsk,
    expectedProfitAtAsk,
    expectedRoiPercent,
    expectedHourlyProfit,
    successGrossBuyerPayment,
    failureGrossBuyerPayment,
    successSellingFees,
    failureSellingFees,
    successProfitAtAsk,
    failureProfitAtAsk,
    profitLimitedMaxBuyPrice,
    roiLimitedMaxBuyPrice,
    rawMaximumBuyPrice,
    maximumBuyPrice,
    amountBelowMaximum,
    breakEvenGrossBuyerPayment,
    decisionStatus,
    decisionExplanation: getPhoneFlipDecisionExplanation(decisionStatus)
  }
}

export function getPhoneFlipDecisionStatus(
  grossBuyerPayment: number,
  rawMaximumBuyPrice: number,
  askingPrice: number,
  maximumBuyPrice: number
): PhoneFlipDecisionStatus {
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

export function getPhoneFlipDecisionExplanation(status: PhoneFlipDecisionStatus): string {
  if (status === 'buy-at-ask') {
    return "The current asking price meets both the user's expected minimum profit and expected minimum ROI targets."
  }

  if (status === 'negotiate') {
    return 'The asking price is too high under the entered repair-risk assumptions.'
  }

  return "The entered assumptions cannot meet the user's targets even at a zero-dollar purchase price, or there is no expected revenue."
}
