import { describe, expect, it } from 'vitest'
import { calculatorCatalog } from './catalog'
import type { CalculatorStatus } from '../types/calculator'

const validStatuses = new Set<CalculatorStatus>(['planned', 'available'])

describe('calculatorCatalog', () => {
  it('contains calculator definitions with unique IDs and valid metadata', () => {
    expect(calculatorCatalog).not.toHaveLength(0)

    const ids = new Set<string>()

    for (const calculator of calculatorCatalog) {
      expect(calculator.id.trim()).not.toBe('')
      expect(ids.has(calculator.id)).toBe(false)
      ids.add(calculator.id)

      expect(calculator.name.trim()).not.toBe('')
      expect(calculator.description.trim()).not.toBe('')
      expect(calculator.question.trim()).not.toBe('')
      expect(calculator.category.trim()).not.toBe('')
      expect(validStatuses.has(calculator.status)).toBe(true)

      if (calculator.status === 'available') {
        expect(calculator.route?.startsWith('/calculators/')).toBe(true)
      }
    }
  })
})
