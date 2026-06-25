import { describe, expect, it } from 'vitest'
import {
  calculateChainsawFlip,
  defaultChainsawFlipInput,
  validateChainsawFlipInput,
  type ChainsawFlipInput
} from './chainsawFlip'

function makeInput(overrides: Partial<ChainsawFlipInput>): ChainsawFlipInput {
  return {
    ...defaultChainsawFlipInput,
    ...overrides
  }
}

describe('calculateChainsawFlip', () => {
  it('handles as-is as the only buy-at-ask strategy', () => {
    const result = calculateChainsawFlip(
      makeInput({
        askingPrice: 80,
        travelCost: 10,
        negotiationDiscountPercent: 10,
        platformFeePercent: 10,
        desiredMinimumProfit: 30,
        minimumRoiPercent: 25,
        expectedAsIsSalePrice: 180,
        asIsShippingPaidByBuyer: 20,
        asIsActualShippingCost: 20,
        asIsPreparationCost: 5,
        asIsTimeHours: 2,
        expectedRepairedSalePrice: 220,
        expectedFailedRepairRecoveryValue: 90,
        repairSuccessPercent: 60,
        topEndPartsCost: 60,
        repairPreparationCost: 5,
        repairShippingPaidByBuyer: 20,
        repairActualShippingCost: 20,
        repairTimeHours: 4,
        expectedPartsGrossRevenue: 250,
        partsSellThroughPercent: 50,
        partOutShippingPaidByBuyers: 25,
        partOutActualShippingCost: 30,
        partOutSuppliesCost: 10,
        partOutTimeHours: 5
      })
    )

    expect(result.asIs.itemRevenue).toBe(162)
    expect(result.asIs.grossBuyerPayment).toBe(182)
    expect(result.asIs.sellingFees).toBe(18.2)
    expect(result.asIs.nonPurchaseCosts).toBe(53.2)
    expect(result.asIs.totalInvestmentAtAsk).toBe(133.2)
    expect(result.asIs.profitAtAsk).toBeCloseTo(48.8)
    expect(result.asIs.roiPercent).toBeCloseTo(36.6366366)
    expect(result.asIs.hourlyProfit).toBeCloseTo(24.4)
    expect(result.asIs.maximumBuyPrice).toBeCloseTo(92.4)
    expect(result.asIs.status).toBe('buy-at-ask')
    expect(result.repair.itemRevenue).toBeCloseTo(151.2)
    expect(result.repair.profitAtAsk).toBeCloseTo(-20.92)
    expect(result.repair.maximumBuyPrice).toBeCloseTo(24.84)
    expect(result.repair.status).toBe('negotiate')
    expect(result.partOut.itemRevenue).toBe(112.5)
    expect(result.partOut.profitAtAsk).toBeCloseTo(-6.25)
    expect(result.partOut.maximumBuyPrice).toBe(43.75)
    expect(result.partOut.status).toBe('negotiate')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedStrategy).toBe('as-is')
    expect(result.overallMaximumBuyPrice).toBeCloseTo(92.4)
  })

  it('handles repair as the recommended buy-at-ask strategy', () => {
    const result = calculateChainsawFlip(
      makeInput({
        askingPrice: 95,
        travelCost: 10,
        platformFeePercent: 10,
        desiredMinimumProfit: 40,
        minimumRoiPercent: 25,
        expectedAsIsSalePrice: 150,
        asIsPreparationCost: 5,
        asIsTimeHours: 1,
        expectedRepairedSalePrice: 300,
        expectedFailedRepairRecoveryValue: 100,
        repairSuccessPercent: 80,
        topEndPartsCost: 70,
        repairPreparationCost: 5,
        repairTimeHours: 4,
        expectedPartsGrossRevenue: 220,
        partsSellThroughPercent: 80,
        partOutSuppliesCost: 10,
        partOutTimeHours: 5
      })
    )

    expect(result.asIs.profitAtAsk).toBe(25)
    expect(result.asIs.maximumBuyPrice).toBe(80)
    expect(result.asIs.status).toBe('negotiate')
    expect(result.repairPartsCost).toBe(70)
    expect(result.expectedRepairItemRevenue).toBe(260)
    expect(result.repair.profitAtAsk).toBe(54)
    expect(result.repair.roiPercent).toBeCloseTo(26.2135922)
    expect(result.repair.maximumBuyPrice).toBe(97)
    expect(result.repair.status).toBe('buy-at-ask')
    expect(result.repairSuccessProfitAtAsk).toBe(90)
    expect(result.repairFailureProfitAtAsk).toBe(-90)
    expect(result.sellablePartsRevenue).toBe(176)
    expect(result.partOut.profitAtAsk).toBeCloseTo(43.4)
    expect(result.partOut.roiPercent).toBeCloseTo(32.7300151)
    expect(result.partOut.maximumBuyPrice).toBeCloseTo(98.4)
    expect(result.partOut.status).toBe('buy-at-ask')
    expect(result.overallDecision).toBe('buy-at-ask')
    expect(result.recommendedStrategy).toBe('repair')
    expect(result.overallMaximumBuyPrice).toBeCloseTo(98.4)
  })

  it('handles part-out as the recommended negotiation strategy', () => {
    const result = calculateChainsawFlip(
      makeInput({
        askingPrice: 150,
        travelCost: 10,
        negotiationDiscountPercent: 10,
        platformFeePercent: 12,
        desiredMinimumProfit: 50,
        minimumRoiPercent: 30,
        expectedAsIsSalePrice: 180,
        asIsPreparationCost: 5,
        asIsTimeHours: 1,
        expectedRepairedSalePrice: 350,
        expectedFailedRepairRecoveryValue: 120,
        repairSuccessPercent: 60,
        topEndPartsCost: 100,
        repairPreparationCost: 5,
        repairTimeHours: 5,
        expectedPartsGrossRevenue: 500,
        partsSellThroughPercent: 70,
        partOutShippingPaidByBuyers: 50,
        partOutActualShippingCost: 60,
        partOutSuppliesCost: 20,
        partOutFixedSellingFees: 5,
        partOutTimeHours: 8
      })
    )

    expect(result.asIs.maximumBuyPrice).toBeCloseTo(77.56)
    expect(result.asIs.status).toBe('negotiate')
    expect(result.expectedRepairItemRevenue).toBeCloseTo(232.2)
    expect(result.repair.maximumBuyPrice).toBeCloseTo(35.7513846)
    expect(result.repair.status).toBe('negotiate')
    expect(result.sellablePartsRevenue).toBe(350)
    expect(result.partOut.itemRevenue).toBe(315)
    expect(result.partOut.grossBuyerPayment).toBe(365)
    expect(result.partOut.sellingFees).toBeCloseTo(48.8)
    expect(result.partOut.nonPurchaseCosts).toBeCloseTo(138.8)
    expect(result.partOut.totalInvestmentAtAsk).toBeCloseTo(288.8)
    expect(result.partOut.profitAtAsk).toBeCloseTo(76.2)
    expect(result.partOut.roiPercent).toBeCloseTo(26.3850416)
    expect(result.partOut.maximumBuyPrice).toBeCloseTo(141.9692308)
    expect(result.partOut.status).toBe('negotiate')
    expect(result.overallDecision).toBe('negotiate')
    expect(result.recommendedStrategy).toBe('part-out')
    expect(result.overallMaximumBuyPrice).toBeCloseTo(141.9692308)
  })

  it('passes when every strategy has no revenue or negative raw maximum buy price', () => {
    const result = calculateChainsawFlip(
      makeInput({
        expectedAsIsSalePrice: 10,
        asIsPreparationCost: 20,
        expectedRepairedSalePrice: 10,
        expectedFailedRepairRecoveryValue: 5,
        repairSuccessPercent: 50,
        topEndPartsCost: 30,
        expectedPartsGrossRevenue: 0,
        partsSellThroughPercent: 0
      })
    )

    expect(result.asIs.status).toBe('pass')
    expect(result.repair.status).toBe('pass')
    expect(result.partOut.status).toBe('pass')
    expect(result.overallDecision).toBe('pass')
    expect(result.recommendedStrategy).toBeNull()
  })

  it('handles repair probability and parts sell-through boundaries', () => {
    const allSuccess = calculateChainsawFlip(
      makeInput({
        expectedRepairedSalePrice: 300,
        expectedFailedRepairRecoveryValue: 50,
        repairSuccessPercent: 100,
        negotiationDiscountPercent: 10,
        expectedPartsGrossRevenue: 200,
        partsSellThroughPercent: 100
      })
    )
    const noSuccess = calculateChainsawFlip(
      makeInput({
        expectedRepairedSalePrice: 300,
        expectedFailedRepairRecoveryValue: 50,
        repairSuccessPercent: 0,
        negotiationDiscountPercent: 10,
        expectedPartsGrossRevenue: 200,
        partsSellThroughPercent: 0
      })
    )

    expect(allSuccess.expectedRepairItemRevenue).toBe(allSuccess.discountedRepairedRevenue)
    expect(noSuccess.expectedRepairItemRevenue).toBe(noSuccess.discountedFailedRepairRevenue)
    expect(allSuccess.sellablePartsRevenue).toBe(200)
    expect(noSuccess.sellablePartsRevenue).toBe(0)
  })

  it('returns null ROI for zero investment and null hourly profit for zero time', () => {
    const result = calculateChainsawFlip(
      makeInput({
        expectedAsIsSalePrice: 100,
        expectedRepairedSalePrice: 100,
        repairSuccessPercent: 100,
        expectedPartsGrossRevenue: 100,
        partsSellThroughPercent: 100
      })
    )

    expect(result.asIs.totalInvestmentAtAsk).toBe(0)
    expect(result.asIs.roiPercent).toBeNull()
    expect(result.asIs.hourlyProfit).toBeNull()
    expect(result.repair.roiPercent).toBeNull()
    expect(result.repair.hourlyProfit).toBeNull()
    expect(result.partOut.roiPercent).toBeNull()
    expect(result.partOut.hourlyProfit).toBeNull()
  })

  it('uses higher ROI and then fixed order to break recommendation ties', () => {
    const higherRoiResult = calculateChainsawFlip(
      makeInput({
        askingPrice: 10,
        expectedAsIsSalePrice: 100,
        expectedRepairedSalePrice: 90,
        repairSuccessPercent: 100,
        expectedPartsGrossRevenue: 50,
        partsSellThroughPercent: 100,
        asIsPreparationCost: 30,
        repairPreparationCost: 20
      })
    )
    const fixedOrderResult = calculateChainsawFlip(
      makeInput({
        askingPrice: 10,
        expectedAsIsSalePrice: 100,
        expectedRepairedSalePrice: 100,
        repairSuccessPercent: 100,
        expectedPartsGrossRevenue: 100,
        partsSellThroughPercent: 100
      })
    )

    expect(higherRoiResult.asIs.profitAtAsk).toBe(higherRoiResult.repair.profitAtAsk)
    expect(higherRoiResult.repair.roiPercent).toBeGreaterThan(higherRoiResult.asIs.roiPercent ?? 0)
    expect(higherRoiResult.recommendedStrategy).toBe('repair')
    expect(fixedOrderResult.asIs.profitAtAsk).toBe(fixedOrderResult.repair.profitAtAsk)
    expect(fixedOrderResult.asIs.roiPercent).toBe(fixedOrderResult.repair.roiPercent)
    expect(fixedOrderResult.recommendedStrategy).toBe('as-is')
  })

  it('breaks maximum-buy-price ties by fixed order for negotiation recommendations', () => {
    const result = calculateChainsawFlip(
      makeInput({
        askingPrice: 100,
        expectedAsIsSalePrice: 50,
        expectedRepairedSalePrice: 50,
        repairSuccessPercent: 100,
        expectedPartsGrossRevenue: 50,
        partsSellThroughPercent: 100
      })
    )

    expect(result.asIs.status).toBe('negotiate')
    expect(result.repair.status).toBe('negotiate')
    expect(result.partOut.status).toBe('negotiate')
    expect(result.recommendedStrategy).toBe('as-is')
  })

  it('throws instead of calculating invalid input', () => {
    expect(() =>
      calculateChainsawFlip(
        makeInput({
          platformFeePercent: 100
        })
      )
    ).toThrow('Chainsaw Flip input is invalid.')
  })
})

describe('validateChainsawFlipInput', () => {
  it('returns field-specific validation errors', () => {
    const errors = validateChainsawFlipInput({
      ...defaultChainsawFlipInput,
      askingPrice: -1,
      negotiationDiscountPercent: 101,
      platformFeePercent: 100,
      repairSuccessPercent: 101,
      partsSellThroughPercent: 101,
      expectedAsIsSalePrice: Number.NaN,
      repairActualShippingCost: Number.POSITIVE_INFINITY
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'askingPrice' }),
        expect.objectContaining({ field: 'negotiationDiscountPercent' }),
        expect.objectContaining({ field: 'platformFeePercent' }),
        expect.objectContaining({ field: 'repairSuccessPercent' }),
        expect.objectContaining({ field: 'partsSellThroughPercent' }),
        expect.objectContaining({ field: 'expectedAsIsSalePrice' }),
        expect.objectContaining({ field: 'repairActualShippingCost' })
      ])
    )
  })

  it('rejects non-numeric values', () => {
    const errors = validateChainsawFlipInput({
      ...defaultChainsawFlipInput,
      askingPrice: '100'
    })

    expect(errors).toEqual([expect.objectContaining({ field: 'askingPrice' })])
  })

  it('allows minimum ROI above 100 percent', () => {
    const errors = validateChainsawFlipInput({
      ...defaultChainsawFlipInput,
      minimumRoiPercent: 150
    })

    expect(errors).toEqual([])
  })
})
