export type CalculatorStatus = 'planned' | 'available'

export interface CalculatorDefinition {
  id: string
  name: string
  description: string
  question: string
  category: string
  status: CalculatorStatus
  route?: string
  proTeaser?: string
}
