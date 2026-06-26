import { describe, expect, it } from 'vitest'
import {
  calculateLocalVsShipped,
  defaultLocalVsShippedInput,
  validateLocalVsShippedInput,
  type LocalVsShippedInput
} from './localVsShipped'

function makeInput(overrides: Partial<LocalVsShippedInput>): LocalVsShippedInput {
  return {
    ...defaultLocalVsShippedInput,
    ...overrides
  }
}

describe('calculateLocalVsShipped', () => {
  it('handles both options qualifying with local recommended', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        askingPrice: 100,
        acquisitionTravelCost: 10,
        preparationCost: 5,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        expectedLocalSalePrice: 220,
        localDeliveryCost: 10,
        localTimeHours: 2,
        expectedShippedSalePrice: 260,
        shippedNegotiationDiscountPercent: 10,
        platformFeePercent: 10,
        fixedSellingFees: 5,
        shippingPaidByBuyer: 20,
        actualShippingCost: 25,
        packingSuppliesCost: 5,
        shippedTimeHours: 3
      })
    )

    expect(result.sharedCosts).toBe(15)
    expect(result.local.itemRevenue).toBe(220)
    expect(result.local.grossBuyerPayment).toBe(220)
    expect(result.local.nonPurchaseCosts).toBe(25)
    expect(result.local.totalInvestmentAtAsk).toBe(125)
    expect(result.local.profitAtAsk).toBe(95)
    expect(result.local.roiPercent).toBe(76)
    expect(result.local.hourlyProfit).toBe(47.5)
    expect(result.local.maximumBuyPrice).toBe(151)
    expect(result.local.status).toBe('buy-at-ask')
    expect(result.shipped.itemRevenue).toBe(234)
    expect(result.shipped.grossBuyerPayment).toBe(254)
    expect(result.shipped.sellingFees).toBeCloseTo(30.4)
    expect(result.shipped.nonPurchaseCosts).toBeCloseTo(75.4)
    expect(result.shipped.totalInvestmentAtAsk).toBeCloseTo(175.4)
    expect(result.shipped.profitAtAsk).toBeCloseTo(78.6)
    expect(result.shipped.roiPercent).toBeCloseTo(44.8118586)
    expect(result.shipped.hourlyProfit).toBeCloseTo(26.2)
    expect(result.shipped.maximumBuyPrice).toBeCloseTo(127.8)
    expect(result.shipped.status).toBe('buy-at-ask')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedSaleMethod).toBe('local')
    expect(result.overallMaximumBuyPrice).toBe(151)
    expect(result.profitDifferenceShippedMinusLocal).toBeCloseTo(-16.4)
    expect(result.hourlyProfitDifferenceShippedMinusLocal).toBeCloseTo(-21.3)
  })

  it('handles shipped as the recommended buy-at-ask option', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        askingPrice: 100,
        acquisitionTravelCost: 5,
        preparationCost: 5,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        expectedLocalSalePrice: 180,
        localDeliveryCost: 10,
        localTimeHours: 1,
        expectedShippedSalePrice: 260,
        platformFeePercent: 12,
        fixedSellingFees: 3,
        shippingPaidByBuyer: 20,
        actualShippingCost: 25,
        packingSuppliesCost: 5,
        shippedTimeHours: 2
      })
    )

    expect(result.sharedCosts).toBe(10)
    expect(result.local.profitAtAsk).toBe(60)
    expect(result.local.roiPercent).toBe(50)
    expect(result.local.maximumBuyPrice).toBe(120)
    expect(result.local.status).toBe('buy-at-ask')
    expect(result.shipped.itemRevenue).toBe(260)
    expect(result.shipped.grossBuyerPayment).toBe(280)
    expect(result.shipped.sellingFees).toBeCloseTo(36.6)
    expect(result.shipped.nonPurchaseCosts).toBeCloseTo(76.6)
    expect(result.shipped.totalInvestmentAtAsk).toBeCloseTo(176.6)
    expect(result.shipped.profitAtAsk).toBeCloseTo(103.4)
    expect(result.shipped.roiPercent).toBeCloseTo(58.5503964)
    expect(result.shipped.hourlyProfit).toBeCloseTo(51.7)
    expect(result.shipped.maximumBuyPrice).toBeCloseTo(147.4)
    expect(result.shipped.status).toBe('buy-at-ask')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedSaleMethod).toBe('shipped')
    expect(result.overallMaximumBuyPrice).toBeCloseTo(147.4)
    expect(result.profitDifferenceShippedMinusLocal).toBeCloseTo(43.4)
    expect(result.hourlyProfitDifferenceShippedMinusLocal).toBeCloseTo(-8.3)
  })

  it('handles both options requiring negotiation with shipped recommended', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        askingPrice: 200,
        acquisitionTravelCost: 5,
        preparationCost: 5,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        expectedLocalSalePrice: 180,
        localDeliveryCost: 10,
        localTimeHours: 1,
        expectedShippedSalePrice: 260,
        platformFeePercent: 12,
        fixedSellingFees: 3,
        shippingPaidByBuyer: 20,
        actualShippingCost: 25,
        packingSuppliesCost: 5,
        shippedTimeHours: 2
      })
    )

    expect(result.local.profitAtAsk).toBe(-40)
    expect(result.local.maximumBuyPrice).toBe(120)
    expect(result.local.status).toBe('negotiate')
    expect(result.shipped.profitAtAsk).toBeCloseTo(3.4)
    expect(result.shipped.roiPercent).toBeCloseTo(1.2292119)
    expect(result.shipped.maximumBuyPrice).toBeCloseTo(147.4)
    expect(result.shipped.status).toBe('negotiate')
    expect(result.overallDecision).toBe('negotiate')
    expect(result.recommendedSaleMethod).toBe('shipped')
    expect(result.overallMaximumBuyPrice).toBeCloseTo(147.4)
  })

  it('passes when both options have no revenue or negative raw maximum buy prices', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        expectedLocalSalePrice: 10,
        localDeliveryCost: 20,
        expectedShippedSalePrice: 10,
        actualShippingCost: 20,
        packingSuppliesCost: 10
      })
    )

    expect(result.local.status).toBe('pass')
    expect(result.shipped.status).toBe('pass')
    expect(result.overallDecision).toBe('pass')
    expect(result.recommendedSaleMethod).toBeNull()
  })

  it('returns null ROI for zero investment and null hourly values for zero time', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        expectedLocalSalePrice: 100,
        expectedShippedSalePrice: 100
      })
    )

    expect(result.local.totalInvestmentAtAsk).toBe(0)
    expect(result.local.roiPercent).toBeNull()
    expect(result.local.hourlyProfit).toBeNull()
    expect(result.shipped.roiPercent).toBeNull()
    expect(result.shipped.hourlyProfit).toBeNull()
    expect(result.hourlyProfitDifferenceShippedMinusLocal).toBeNull()
  })

  it('uses higher ROI, then hourly profit, then fixed order for buy-at-ask ties', () => {
    const roiTieBreaker = calculateLocalVsShipped(
      makeInput({
        askingPrice: 10,
        expectedLocalSalePrice: 100,
        localDeliveryCost: 30,
        expectedShippedSalePrice: 90,
        shippedOtherCost: 20
      })
    )
    const hourlyTieBreaker = calculateLocalVsShipped(
      makeInput({
        askingPrice: 10,
        expectedLocalSalePrice: 100,
        localTimeHours: 3,
        expectedShippedSalePrice: 100,
        shippedTimeHours: 2
      })
    )
    const fixedTieBreaker = calculateLocalVsShipped(
      makeInput({
        askingPrice: 10,
        expectedLocalSalePrice: 100,
        localTimeHours: 2,
        expectedShippedSalePrice: 100,
        shippedTimeHours: 2
      })
    )

    expect(roiTieBreaker.local.profitAtAsk).toBe(roiTieBreaker.shipped.profitAtAsk)
    expect(roiTieBreaker.shipped.roiPercent).toBeGreaterThan(roiTieBreaker.local.roiPercent ?? 0)
    expect(roiTieBreaker.recommendedSaleMethod).toBe('shipped')
    expect(hourlyTieBreaker.local.profitAtAsk).toBe(hourlyTieBreaker.shipped.profitAtAsk)
    expect(hourlyTieBreaker.local.roiPercent).toBe(hourlyTieBreaker.shipped.roiPercent)
    expect(hourlyTieBreaker.shipped.hourlyProfit).toBeGreaterThan(hourlyTieBreaker.local.hourlyProfit ?? 0)
    expect(hourlyTieBreaker.recommendedSaleMethod).toBe('shipped')
    expect(fixedTieBreaker.recommendedSaleMethod).toBe('local')
  })

  it('breaks negotiation maximum-buy-price ties by fixed order', () => {
    const result = calculateLocalVsShipped(
      makeInput({
        askingPrice: 100,
        expectedLocalSalePrice: 50,
        expectedShippedSalePrice: 50
      })
    )

    expect(result.local.status).toBe('negotiate')
    expect(result.shipped.status).toBe('negotiate')
    expect(result.local.maximumBuyPrice).toBe(result.shipped.maximumBuyPrice)
    expect(result.recommendedSaleMethod).toBe('local')
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculateLocalVsShipped(
        makeInput({
          platformFeePercent: 100
        })
      )
    ).toThrow('Local vs Shipped input is invalid.')
  })
})

describe('validateLocalVsShippedInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validateLocalVsShippedInput({
      ...defaultLocalVsShippedInput,
      askingPrice: -1,
      localNegotiationDiscountPercent: 101,
      shippedNegotiationDiscountPercent: 101,
      platformFeePercent: 100,
      expectedLocalSalePrice: Number.NaN,
      actualShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'localNegotiationDiscountPercent' }),
        expect.objectContaining({ field: 'shippedNegotiationDiscountPercent' }),
        expect.objectContaining({ field: 'platformFeePercent' }),
        expect.objectContaining({ field: 'expectedLocalSalePrice' }),
        expect.objectContaining({ field: 'actualShippingCost' })
      ])
    )
  })

  it('rejects non-numeric values', () => {
    const errors = validateLocalVsShippedInput({
      ...defaultLocalVsShippedInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validateLocalVsShippedInput({
      ...defaultLocalVsShippedInput,
      minimumRoiPercent: 150
    })

    expect(errors).toEqual([])
  })
})
