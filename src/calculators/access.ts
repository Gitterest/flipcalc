import type { CalculatorDefinition } from '../types/calculator'

export type CalculatorAccessLevel = 'free' | 'pro'

export const freeCalculatorIds = ['general-flip'] as const

export function getCalculatorAccess(calculator: CalculatorDefinition): CalculatorAccessLevel {
  return freeCalculatorIds.includes(calculator.id as (typeof freeCalculatorIds)[number]) ? 'free' : 'pro'
}

export function canAccessCalculator(calculator: CalculatorDefinition, hasProEntitlement: boolean): boolean {
  return getCalculatorAccess(calculator) === 'free' || hasProEntitlement
}

export function getCalculatorById(calculators: CalculatorDefinition[], calculatorId: string): CalculatorDefinition | undefined {
  return calculators.find((calculator) => calculator.id === calculatorId)
}
