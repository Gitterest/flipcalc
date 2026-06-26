import { describe, expect, it } from 'vitest'
import {
  calculateRepairVsAsIs,
  defaultRepairVsAsIsInput,
  validateRepairVsAsIsInput,
  type RepairVsAsIsInput
} from './repairVsAsIs'

function makeInput(overrides: Partial<RepairVsAsIsInput>): RepairVsAsIsInput {
  return {
    ...defaultRepairVsAsIsInput,
    ...overrides
  }
}

describe('calculateRepairVsAsIs', () => {
  it('handles as-is winning at ask', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 100,
        acquisitionTravelCost: 10,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        asIsSalePrice: 220,
        asIsNegotiationDiscountPercent: 10,
        asIsSellingFeePercent: 10,
        asIsFixedFees: 2,
        asIsShippingCollected: 20,
        asIsShippingCost: 20,
        asIsOtherCost: 5,
        asIsTimeHours: 2,
        repairedSalePrice: 300,
        repairNegotiationDiscountPercent: 10,
        repairCost: 80,
        repairSuppliesCost: 10,
        repairFailureRiskPercent: 30,
        repairSellingFeePercent: 10,
        repairFixedFees: 2,
        repairShippingCollected: 20,
        repairShippingCost: 20,
        repairOtherCost: 5,
        repairTimeHours: 5
      })
    )

    expect(result.sharedCosts).toBe(10)
    expect(result.asIs.itemRevenue).toBe(198)
    expect(result.asIs.grossBuyerPayment).toBe(218)
    expect(result.asIs.sellingFees).toBeCloseTo(23.8)
    expect(result.asIs.nonPurchaseCosts).toBeCloseTo(58.8)
    expect(result.asIs.profitAtAsk).toBeCloseTo(59.2)
    expect(result.asIs.roiPercent).toBeCloseTo(37.27959698)
    expect(result.asIs.hourlyProfit).toBeCloseTo(29.6)
    expect(result.asIs.maximumBuyPrice).toBeCloseTo(115.6)
    expect(result.asIs.status).toBe('buy-at-ask')
    expect(result.repair.effectiveGrossBuyerPayment).toBeCloseTo(203)
    expect(result.repair.profitAtAsk).toBeCloseTo(-53)
    expect(result.repair.maximumBuyPrice).toBeCloseTo(6.4)
    expect(result.repair.status).toBe('negotiate')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedMethod).toBe('as-is')
  })

  it('handles repair winning at ask', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 100,
        acquisitionTravelCost: 5,
        desiredMinimumProfit: 70,
        minimumRoiPercent: 25,
        asIsSalePrice: 160,
        asIsTimeHours: 1,
        repairedSalePrice: 300,
        repairCost: 50,
        repairSuppliesCost: 10,
        repairFailureRiskPercent: 10,
        repairTimeHours: 3
      })
    )

    expect(result.repairSuccessRate).toBe(0.9)
    expect(result.asIs.profitAtAsk).toBe(55)
    expect(result.asIs.maximumBuyPrice).toBe(85)
    expect(result.asIs.status).toBe('negotiate')
    expect(result.repair.effectiveGrossBuyerPayment).toBe(270)
    expect(result.repair.nonPurchaseCosts).toBe(65)
    expect(result.repair.profitAtAsk).toBe(105)
    expect(result.repair.roiPercent).toBeCloseTo(63.6363636)
    expect(result.repair.hourlyProfit).toBe(35)
    expect(result.repair.maximumBuyPrice).toBe(135)
    expect(result.repair.status).toBe('buy-at-ask')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedMethod).toBe('repair')
    expect(result.overallMaximumBuyPrice).toBe(135)
    expect(result.profitDifferenceRepairMinusAsIs).toBe(50)
  })

  it('handles negotiation and recommends the higher maximum buy price', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 200,
        acquisitionTravelCost: 5,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 25,
        asIsSalePrice: 160,
        repairedSalePrice: 300,
        repairCost: 50,
        repairSuppliesCost: 10,
        repairFailureRiskPercent: 10
      })
    )

    expect(result.asIs.status).toBe('negotiate')
    expect(result.asIs.maximumBuyPrice).toBe(105)
    expect(result.repair.status).toBe('negotiate')
    expect(result.repair.maximumBuyPrice).toBe(151)
    expect(result.overallDecision).toBe('negotiate')
    expect(result.recommendedMethod).toBe('repair')
  })

  it('passes when both options cannot meet targets', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        asIsSalePrice: 10,
        asIsShippingCost: 20,
        repairedSalePrice: 10,
        repairCost: 30
      })
    )

    expect(result.asIs.status).toBe('pass')
    expect(result.repair.status).toBe('pass')
    expect(result.overallDecision).toBe('pass')
    expect(result.recommendedMethod).toBeNull()
  })

  it('handles repair failure risk boundaries', () => {
    const noFailure = calculateRepairVsAsIs(
      makeInput({
        repairedSalePrice: 100,
        repairFailureRiskPercent: 0
      })
    )
    const allFailure = calculateRepairVsAsIs(
      makeInput({
        repairedSalePrice: 100,
        repairFailureRiskPercent: 100
      })
    )

    expect(noFailure.repairSuccessRate).toBe(1)
    expect(noFailure.repair.effectiveGrossBuyerPayment).toBe(noFailure.repair.grossBuyerPayment)
    expect(allFailure.repairSuccessRate).toBe(0)
    expect(allFailure.repair.effectiveGrossBuyerPayment).toBe(0)
    expect(allFailure.repair.status).toBe('pass')
  })

  it('returns null ROI for zero investment and null hourly values for zero time', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        asIsSalePrice: 100,
        repairedSalePrice: 100
      })
    )

    expect(result.asIs.totalInvestmentAtAsk).toBe(0)
    expect(result.asIs.roiPercent).toBeNull()
    expect(result.asIs.hourlyProfit).toBeNull()
    expect(result.repair.roiPercent).toBeNull()
    expect(result.repair.hourlyProfit).toBeNull()
    expect(result.hourlyProfitDifferenceRepairMinusAsIs).toBeNull()
  })

  it('uses higher ROI, then hourly profit, then fixed order for buy-at-ask ties', () => {
    const roiTieBreaker = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 10,
        asIsSalePrice: 100,
        asIsOtherCost: 30,
        repairedSalePrice: 90,
        repairOtherCost: 20
      })
    )
    const hourlyTieBreaker = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 10,
        asIsSalePrice: 100,
        asIsTimeHours: 3,
        repairedSalePrice: 100,
        repairTimeHours: 2
      })
    )
    const fixedTieBreaker = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 10,
        asIsSalePrice: 100,
        asIsTimeHours: 2,
        repairedSalePrice: 100,
        repairTimeHours: 2
      })
    )

    expect(roiTieBreaker.asIs.profitAtAsk).toBe(roiTieBreaker.repair.profitAtAsk)
    expect(roiTieBreaker.repair.roiPercent).toBeGreaterThan(roiTieBreaker.asIs.roiPercent ?? 0)
    expect(roiTieBreaker.recommendedMethod).toBe('repair')
    expect(hourlyTieBreaker.asIs.profitAtAsk).toBe(hourlyTieBreaker.repair.profitAtAsk)
    expect(hourlyTieBreaker.asIs.roiPercent).toBe(hourlyTieBreaker.repair.roiPercent)
    expect(hourlyTieBreaker.repair.hourlyProfit).toBeGreaterThan(hourlyTieBreaker.asIs.hourlyProfit ?? 0)
    expect(hourlyTieBreaker.recommendedMethod).toBe('repair')
    expect(fixedTieBreaker.recommendedMethod).toBe('as-is')
  })

  it('breaks negotiation maximum-buy-price ties by fixed order', () => {
    const result = calculateRepairVsAsIs(
      makeInput({
        askingPrice: 100,
        asIsSalePrice: 50,
        repairedSalePrice: 50
      })
    )

    expect(result.asIs.status).toBe('negotiate')
    expect(result.repair.status).toBe('negotiate')
    expect(result.asIs.maximumBuyPrice).toBe(result.repair.maximumBuyPrice)
    expect(result.recommendedMethod).toBe('as-is')
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculateRepairVsAsIs(
        makeInput({
          repairSellingFeePercent: 100
        })
      )
    ).toThrow('Repair vs Sell As-Is input is invalid.')
  })
})

describe('validateRepairVsAsIsInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validateRepairVsAsIsInput({
      ...defaultRepairVsAsIsInput,
      askingPrice: -1,
      asIsNegotiationDiscountPercent: 101,
      repairNegotiationDiscountPercent: 101,
      repairFailureRiskPercent: 101,
      asIsSellingFeePercent: 100,
      repairSellingFeePercent: 100,
      asIsSalePrice: Number.NaN,
      repairShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'asIsNegotiationDiscountPercent' }),
        expect.objectContaining({ field: 'repairNegotiationDiscountPercent' }),
        expect.objectContaining({ field: 'repairFailureRiskPercent' }),
        expect.objectContaining({ field: 'asIsSellingFeePercent' }),
        expect.objectContaining({ field: 'repairSellingFeePercent' }),
        expect.objectContaining({ field: 'asIsSalePrice' }),
        expect.objectContaining({ field: 'repairShippingCost' })
      ])
    )
  })

  it('rejects non-numeric values', () => {
    const errors = validateRepairVsAsIsInput({
      ...defaultRepairVsAsIsInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validateRepairVsAsIsInput({
      ...defaultRepairVsAsIsInput,
      minimumRoiPercent: 150
    })

    expect(errors).toEqual([])
  })
})
