export type CalculatorStatus = 'planned' | 'available'

export interface CalculatorDefinition {
  id: string
  name: string
  description: string
  category: string
  status: CalculatorStatus
}
