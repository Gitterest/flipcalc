import type { CalculatorDefinition } from '../types/calculator'

export const calculatorCatalog: CalculatorDefinition[] = [
  {
    id: 'general-flip',
    name: 'General Flip Decision',
    description: 'Determine a safe buy price, expected profit, and whether a deal meets your targets.',
    category: 'General',
    status: 'planned'
  },
  {
    id: 'local-vs-shipped',
    name: 'Local vs Shipped Sale',
    description: 'Compare local delivery expenses against online selling fees and shipping costs.',
    category: 'Selling',
    status: 'planned'
  },
  {
    id: 'repair-vs-as-is',
    name: 'Repair vs Sell As-Is',
    description: 'Compare the expected outcome of repairing an item against selling it in current condition.',
    category: 'Repair',
    status: 'planned'
  },
  {
    id: 'phone-flip',
    name: 'Phone Flip',
    description: 'Evaluate acquisition cost, known defects, repair expenses, parts value, and resale assumptions.',
    category: 'Phones',
    status: 'planned'
  },
  {
    id: 'power-tool-flip',
    name: 'Power Tool Flip',
    description: 'Evaluate tool condition, battery and charger inclusion, repair costs, and selling strategy.',
    category: 'Power Tools',
    status: 'planned'
  },
  {
    id: 'chainsaw-flip',
    name: 'Chainsaw Flip',
    description: 'Compare complete-sale, repaired-sale, and parts-out assumptions for a chainsaw.',
    category: 'Chainsaws',
    status: 'planned'
  }
]
