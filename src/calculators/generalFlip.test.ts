import { describe, expect, it } from 'vitest'
import {
  calculateGeneralFlip,
  defaultGeneralFlipInput,
  validateGeneralFlipInput,
  type GeneralFlipInput
} from './generalFlip'

function makeInput(overrides: Partial<GeneralFlipInput>): GeneralFlipInput {
  return {
    ...defaultGeneralFlipInput,
    ...overrides
  }
}

describe('calculateGeneralFlip', () => {
  it('returns buy at ask when the asking price is within the maximum buy price', () => {
    const result = calculateGeneralFlip(
      makeInput({
        askingPrice: 100,
        expectedSalePrice: 250,
        negotiationDiscountPercent: 10,
        sellingFeePercent: 10,
        fixedSellingFees: 2,
        shippingPaidByBuyer: 20,
        actualShippingCost: 20,
        acquisitionTravelCost: 10,
        preparationCost: 5,
        packingSuppliesCost: 3,
        otherCost: 4,
        timeHours: 2,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 25
      })
    )

    expect(result.discountRate).toBe(0.1)
    expect(result.feeRate).toBe(0.1)
    expect(result.minimumRoiRate).toBe(0.25)
    expect(result.itemRevenue).toBe(225)
    expect(result.grossBuyerPayment).toBe(245)
    expect(result.percentageSellingFee).toBe(24.5)
    expect(result.sellingFees).toBe(26.5)
    expect(result.nonPurchaseCosts).toBe(68.5)
    expect(result.totalInvestmentAtAsk).toBe(168.5)
    expect(result.profitAtAsk).toBe(76.5)
    expect(result.roiPercent).toBeCloseTo(45.40059347)
    expect(result.hourlyProfit).toBe(38.25)
    expect(result.profitLimitedMaxBuyPrice).toBe(126.5)
    expect(result.roiLimitedMaxBuyPrice).toBe(127.5)
    expect(result.rawMaximumBuyPrice).toBe(126.5)
    expect(result.maximumBuyPrice).toBe(126.5)
    expect(result.amountBelowMaximum).toBe(26.5)
    expect(result.breakEvenBuyPrice).toBe(176.5)
    expect(result.decision).toBe('buy-at-ask')
  })

  it('returns negotiate when revenue exists but asking price is above maximum buy price', () => {
    const result = calculateGeneralFlip(
      makeInput({
        askingPrice: 150,
        expectedSalePrice: 250,
        negotiationDiscountPercent: 10,
        sellingFeePercent: 10,
        fixedSellingFees: 2,
        shippingPaidByBuyer: 20,
        actualShippingCost: 20,
        acquisitionTravelCost: 10,
        preparationCost: 5,
        packingSuppliesCost: 3,
        otherCost: 4,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 25
      })
    )

    expect(result.maximumBuyPrice).toBe(126.5)
    expect(result.amountBelowMaximum).toBe(-23.5)
    expect(result.decision).toBe('negotiate')
  })

  it('passes when gross buyer payment is zero', () => {
    const result = calculateGeneralFlip(makeInput({ expectedSalePrice: 0, shippingPaidByBuyer: 0 }))

    expect(result.grossBuyerPayment).toBe(0)
    expect(result.decision).toBe('pass')
  })

  it('passes when the raw maximum buy price is negative', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 100,
        desiredMinimumProfit: 200
      })
    )

    expect(result.rawMaximumBuyPrice).toBe(-100)
    expect(result.maximumBuyPrice).toBe(0)
    expect(result.decision).toBe('pass')
  })

  it('applies shipping paid by buyer to gross payment and percentage fee basis', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 100,
        sellingFeePercent: 10,
        fixedSellingFees: 2,
        shippingPaidByBuyer: 20
      })
    )

    expect(result.grossBuyerPayment).toBe(120)
    expect(result.percentageSellingFee).toBe(12)
    expect(result.sellingFees).toBe(14)
  })

  it('applies the negotiation discount to expected sale price', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 100,
        negotiationDiscountPercent: 25
      })
    )

    expect(result.itemRevenue).toBe(75)
    expect(result.grossBuyerPayment).toBe(75)
  })

  it('uses the desired-profit limit when it is lower than the ROI limit', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 200,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 10
      })
    )

    expect(result.profitLimitedMaxBuyPrice).toBe(150)
    expect(result.roiLimitedMaxBuyPrice).toBeCloseTo(181.8181818)
    expect(result.rawMaximumBuyPrice).toBe(150)
  })

  it('uses the ROI limit when it is lower than the desired-profit limit', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 200,
        desiredMinimumProfit: 10,
        minimumRoiPercent: 100
      })
    )

    expect(result.profitLimitedMaxBuyPrice).toBe(190)
    expect(result.roiLimitedMaxBuyPrice).toBe(100)
    expect(result.rawMaximumBuyPrice).toBe(100)
  })

  it('returns null ROI for zero investment and null hourly profit for zero time', () => {
    const result = calculateGeneralFlip(
      makeInput({
        expectedSalePrice: 100,
        timeHours: 0
      })
    )

    expect(result.totalInvestmentAtAsk).toBe(0)
    expect(result.roiPercent).toBeNull()
    expect(result.hourlyProfit).toBeNull()
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculateGeneralFlip(
        makeInput({
          sellingFeePercent: 100
        })
      )
    ).toThrow('General Flip input is invalid.')
  })
})

describe('validateGeneralFlipInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validateGeneralFlipInput({
      ...defaultGeneralFlipInput,
      askingPrice: -1,
      negotiationDiscountPercent: 101,
      sellingFeePercent: 100,
      expectedSalePrice: Number.NaN,
      actualShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'negotiationDiscountPercent' }),
        expect.objectContaining({ field: 'sellingFeePercent' }),
        expect.objectContaining({ field: 'expectedSalePrice' }),
        expect.objectContaining({ field: 'actualShippingCost' })
      ])
    )
  })

  it('rejects non-numeric input', () => {
    const errors = validateGeneralFlipInput({
      ...defaultGeneralFlipInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validateGeneralFlipInput({
      ...defaultGeneralFlipInput,
      minimumRoiPercent: 150
    })

    expect(errors).toEqual([])
  })
})
