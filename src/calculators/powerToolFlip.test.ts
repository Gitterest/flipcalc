import { describe, expect, it } from 'vitest'
import {
  calculatePowerToolFlip,
  defaultPowerToolFlipInput,
  validatePowerToolFlipInput,
  type PowerToolFlipInput
} from './powerToolFlip'

function makeInput(overrides: Partial<PowerToolFlipInput>): PowerToolFlipInput {
  return {
    ...defaultPowerToolFlipInput,
    ...overrides
  }
}

describe('calculatePowerToolFlip', () => {
  it('handles a local bundle that is buyable at ask', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        askingPrice: 100,
        expectedToolSalePrice: 200,
        repairPartsCost: 20,
        cleaningSuppliesCost: 5,
        travelCost: 5,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        timeHours: 2
      })
    )

    expect(result.grossBuyerPayment).toBe(200)
    expect(result.nonPurchaseCosts).toBe(30)
    expect(result.expectedProfitAtAsk).toBe(70)
    expect(result.totalInvestmentAtAsk).toBe(130)
    expect(result.roiPercent).toBeCloseTo(53.8461538)
    expect(result.hourlyProfit).toBe(35)
    expect(result.profitLimitedMaxBuyPrice).toBe(130)
    expect(result.roiLimitedMaxBuyPrice).toBe(130)
    expect(result.maximumBuyPrice).toBe(130)
    expect(result.decisionStatus).toBe('buy-at-ask')
  })

  it('handles a shipped sale where ROI limits the maximum buy price', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        askingPrice: 120,
        expectedToolSalePrice: 300,
        negotiationDiscountPercent: 10,
        platformFeePercent: 10,
        shippingPaidByBuyer: 20,
        actualShippingCost: 25,
        repairPartsCost: 20,
        cleaningSuppliesCost: 5,
        desiredMinimumProfit: 60,
        minimumRoiPercent: 40,
        timeHours: 4
      })
    )

    expect(result.expectedItemSaleRevenue).toBe(270)
    expect(result.grossBuyerPayment).toBe(290)
    expect(result.sellingFees).toBe(29)
    expect(result.nonPurchaseCosts).toBe(79)
    expect(result.expectedProfitAtAsk).toBe(91)
    expect(result.totalInvestmentAtAsk).toBe(199)
    expect(result.roiPercent).toBeCloseTo(45.7286432)
    expect(result.hourlyProfit).toBe(22.75)
    expect(result.profitLimitedMaxBuyPrice).toBe(151)
    expect(result.roiLimitedMaxBuyPrice).toBeCloseTo(128.1428571)
    expect(result.maximumBuyPrice).toBeCloseTo(128.1428571)
    expect(result.decisionStatus).toBe('buy-at-ask')
  })

  it('returns negotiate when asking price is above the maximum buy price', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        askingPrice: 150,
        expectedToolSalePrice: 300,
        negotiationDiscountPercent: 10,
        platformFeePercent: 10,
        shippingPaidByBuyer: 20,
        actualShippingCost: 25,
        repairPartsCost: 20,
        cleaningSuppliesCost: 5,
        desiredMinimumProfit: 60,
        minimumRoiPercent: 40,
        timeHours: 4
      })
    )

    expect(result.expectedProfitAtAsk).toBe(61)
    expect(result.totalInvestmentAtAsk).toBe(229)
    expect(result.roiPercent).toBeCloseTo(26.6375546)
    expect(result.maximumBuyPrice).toBeCloseTo(128.1428571)
    expect(result.decisionStatus).toBe('negotiate')
  })

  it('passes when a deal cannot meet targets at a zero-dollar purchase price', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        expectedToolSalePrice: 50,
        repairPartsCost: 60,
        desiredMinimumProfit: 10
      })
    )

    expect(result.rawMaximumBuyPrice).toBe(-20)
    expect(result.maximumBuyPrice).toBe(0)
    expect(result.hourlyProfit).toBeNull()
    expect(result.decisionStatus).toBe('pass')
  })

  it('returns null ROI when asking price and all non-purchase costs are zero', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        expectedToolSalePrice: 100
      })
    )

    expect(result.totalInvestmentAtAsk).toBe(0)
    expect(result.roiPercent).toBeNull()
  })

  it('passes when there is no expected revenue', () => {
    const result = calculatePowerToolFlip(defaultPowerToolFlipInput)

    expect(result.grossBuyerPayment).toBe(0)
    expect(result.decisionStatus).toBe('pass')
  })

  it('calculates break-even gross buyer payment', () => {
    const result = calculatePowerToolFlip(
      makeInput({
        askingPrice: 100,
        platformFeePercent: 10,
        fixedSellingFees: 5,
        actualShippingCost: 15,
        repairPartsCost: 20,
        cleaningSuppliesCost: 5,
        travelCost: 5,
        otherCost: 3
      })
    )

    expect(result.breakEvenGrossBuyerPayment).toBeCloseTo(170)
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculatePowerToolFlip(
        makeInput({
          platformFeePercent: 100
        })
      )
    ).toThrow('Power Tool Flip input is invalid.')
  })
})

describe('validatePowerToolFlipInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validatePowerToolFlipInput({
      ...defaultPowerToolFlipInput,
      askingPrice: -1,
      negotiationDiscountPercent: 101,
      platformFeePercent: 100,
      expectedToolSalePrice: Number.NaN,
      actualShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'negotiationDiscountPercent' }),
        expect.objectContaining({ field: 'platformFeePercent' }),
        expect.objectContaining({ field: 'expectedToolSalePrice' }),
        expect.objectContaining({ field: 'actualShippingCost' })
      ])
    )
  })

  it('rejects non-numeric values', () => {
    const errors = validatePowerToolFlipInput({
      ...defaultPowerToolFlipInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validatePowerToolFlipInput({
      ...defaultPowerToolFlipInput,
      minimumRoiPercent: 125
    })

    expect(errors).toEqual([])
  })
})
