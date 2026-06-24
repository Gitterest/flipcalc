import { describe, expect, it } from 'vitest'
import { calculatePhoneFlip, defaultPhoneFlipInput, validatePhoneFlipInput, type PhoneFlipInput } from './phoneFlip'

function makeInput(overrides: Partial<PhoneFlipInput>): PhoneFlipInput {
  return {
    ...defaultPhoneFlipInput,
    ...overrides
  }
}

describe('calculatePhoneFlip', () => {
  it('handles a repair-risk deal that is buyable at ask', () => {
    const result = calculatePhoneFlip(
      makeInput({
        askingPrice: 100,
        expectedWorkingSalePrice: 250,
        expectedFailureRecoveryValue: 80,
        repairSuccessPercent: 80,
        screenRepairCost: 40,
        diagnosticUnlockCost: 10,
        cleaningSuppliesCost: 5,
        travelCost: 5,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        timeHours: 2
      })
    )

    expect(result.repairCosts).toBe(50)
    expect(result.preparationCosts).toBe(60)
    expect(result.discountedWorkingRevenue).toBe(250)
    expect(result.discountedFailureRevenue).toBe(80)
    expect(result.expectedItemSaleRevenue).toBe(216)
    expect(result.grossBuyerPayment).toBe(216)
    expect(result.nonPurchaseCosts).toBe(60)
    expect(result.totalInvestmentAtAsk).toBe(160)
    expect(result.expectedProfitAtAsk).toBe(56)
    expect(result.expectedRoiPercent).toBe(35)
    expect(result.expectedHourlyProfit).toBe(28)
    expect(result.successProfitAtAsk).toBe(90)
    expect(result.failureProfitAtAsk).toBe(-80)
    expect(result.profitLimitedMaxBuyPrice).toBe(116)
    expect(result.roiLimitedMaxBuyPrice).toBeCloseTo(112.8)
    expect(result.maximumBuyPrice).toBeCloseTo(112.8)
    expect(result.decisionStatus).toBe('buy-at-ask')
  })

  it('handles a shipped phone requiring negotiation', () => {
    const result = calculatePhoneFlip(
      makeInput({
        askingPrice: 80,
        expectedWorkingSalePrice: 350,
        expectedFailureRecoveryValue: 120,
        repairSuccessPercent: 70,
        negotiationDiscountPercent: 10,
        platformFeePercent: 12,
        fixedSellingFees: 3,
        shippingPaidByBuyer: 15,
        actualShippingCost: 20,
        screenRepairCost: 50,
        batteryRepairCost: 20,
        diagnosticUnlockCost: 10,
        cleaningSuppliesCost: 5,
        otherCost: 5,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 30,
        timeHours: 3
      })
    )

    expect(result.repairCosts).toBe(80)
    expect(result.preparationCosts).toBe(90)
    expect(result.discountedWorkingRevenue).toBe(315)
    expect(result.discountedFailureRevenue).toBe(108)
    expect(result.expectedItemSaleRevenue).toBeCloseTo(252.9)
    expect(result.grossBuyerPayment).toBeCloseTo(267.9)
    expect(result.percentageSellingFee).toBeCloseTo(32.148)
    expect(result.sellingFees).toBeCloseTo(35.148)
    expect(result.nonPurchaseCosts).toBeCloseTo(145.148)
    expect(result.totalInvestmentAtAsk).toBeCloseTo(225.148)
    expect(result.expectedProfitAtAsk).toBeCloseTo(42.752)
    expect(result.expectedRoiPercent).toBeCloseTo(18.9883987)
    expect(result.expectedHourlyProfit).toBeCloseTo(14.2506667)
    expect(result.successProfitAtAsk).toBeCloseTo(97.4)
    expect(result.failureProfitAtAsk).toBeCloseTo(-84.76)
    expect(result.profitLimitedMaxBuyPrice).toBeCloseTo(72.752)
    expect(result.roiLimitedMaxBuyPrice).toBeCloseTo(60.9289231)
    expect(result.maximumBuyPrice).toBeCloseTo(60.9289231)
    expect(result.decisionStatus).toBe('negotiate')
  })

  it('passes when a deal cannot meet targets at a zero-dollar purchase price', () => {
    const result = calculatePhoneFlip(
      makeInput({
        expectedWorkingSalePrice: 50,
        expectedFailureRecoveryValue: 10,
        repairSuccessPercent: 50,
        screenRepairCost: 40,
        desiredMinimumProfit: 20
      })
    )

    expect(result.expectedItemSaleRevenue).toBe(30)
    expect(result.nonPurchaseCosts).toBe(40)
    expect(result.rawMaximumBuyPrice).toBe(-30)
    expect(result.maximumBuyPrice).toBe(0)
    expect(result.expectedHourlyProfit).toBeNull()
    expect(result.decisionStatus).toBe('pass')
  })

  it('uses discounted working revenue when repair success is 100 percent', () => {
    const result = calculatePhoneFlip(
      makeInput({
        expectedWorkingSalePrice: 300,
        expectedFailureRecoveryValue: 1_000,
        repairSuccessPercent: 100,
        negotiationDiscountPercent: 10
      })
    )

    expect(result.discountedWorkingRevenue).toBe(270)
    expect(result.expectedItemSaleRevenue).toBe(result.discountedWorkingRevenue)
  })

  it('uses discounted failure revenue when repair success is 0 percent', () => {
    const result = calculatePhoneFlip(
      makeInput({
        expectedWorkingSalePrice: 1_000,
        expectedFailureRecoveryValue: 100,
        repairSuccessPercent: 0,
        negotiationDiscountPercent: 10
      })
    )

    expect(result.discountedFailureRevenue).toBe(90)
    expect(result.expectedItemSaleRevenue).toBe(result.discountedFailureRevenue)
  })

  it('returns null expected ROI when asking price and all non-purchase costs are zero', () => {
    const result = calculatePhoneFlip(
      makeInput({
        expectedWorkingSalePrice: 100,
        repairSuccessPercent: 100
      })
    )

    expect(result.totalInvestmentAtAsk).toBe(0)
    expect(result.expectedRoiPercent).toBeNull()
  })

  it('passes when there is no expected revenue', () => {
    const result = calculatePhoneFlip(defaultPhoneFlipInput)

    expect(result.grossBuyerPayment).toBe(0)
    expect(result.decisionStatus).toBe('pass')
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculatePhoneFlip(
        makeInput({
          platformFeePercent: 100
        })
      )
    ).toThrow('Phone Flip input is invalid.')
  })
})

describe('validatePhoneFlipInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validatePhoneFlipInput({
      ...defaultPhoneFlipInput,
      askingPrice: -1,
      repairSuccessPercent: 101,
      negotiationDiscountPercent: 101,
      platformFeePercent: 100,
      expectedWorkingSalePrice: Number.NaN,
      actualShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'repairSuccessPercent' }),
        expect.objectContaining({ field: 'negotiationDiscountPercent' }),
        expect.objectContaining({ field: 'platformFeePercent' }),
        expect.objectContaining({ field: 'expectedWorkingSalePrice' }),
        expect.objectContaining({ field: 'actualShippingCost' })
      ])
    )
  })

  it('rejects non-numeric values', () => {
    const errors = validatePhoneFlipInput({
      ...defaultPhoneFlipInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validatePhoneFlipInput({
      ...defaultPhoneFlipInput,
      minimumRoiPercent: 150
    })

    expect(errors).toEqual([])
  })
}
)
