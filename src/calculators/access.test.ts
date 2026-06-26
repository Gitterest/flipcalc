import { describe, expect, it } from 'vitest'
import { calculatorCatalog } from './catalog'
import { canAccessCalculator, freeCalculatorIds, getCalculatorAccess } from './access'

describe('calculator access configuration', () => {
  it('keeps General Flip as the only free launch calculator', () => {
    expect(freeCalculatorIds).toEqual(['general-flip'])

    for (const calculator of calculatorCatalog) {
      const expectedAccess = calculator.id === 'general-flip' ? 'free' : 'pro'

      expect(getCalculatorAccess(calculator)).toBe(expectedAccess)
    }
  })

  it('allows free calculator access without Pro entitlement and locks Pro calculators', () => {
    const generalFlip = calculatorCatalog.find((calculator) => calculator.id === 'general-flip')
    const proCalculators = calculatorCatalog.filter((calculator) => calculator.id !== 'general-flip')

    expect(generalFlip).toBeDefined()
    expect(canAccessCalculator(generalFlip!, false)).toBe(true)

    for (const calculator of proCalculators) {
      expect(canAccessCalculator(calculator, false)).toBe(false)
      expect(canAccessCalculator(calculator, true)).toBe(true)
    }
  })
})
