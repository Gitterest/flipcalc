import type { CalculatorDefinition } from '../types/calculator'

export const calculatorCatalog: CalculatorDefinition[] = [
  {
    id: 'general-flip',
    name: 'General Flip Decision',
    description: 'Determine a safe buy price, expected profit, and whether a deal meets your targets.',
    question: 'What is the highest price you can safely pay?',
    category: 'General',
    status: 'available',
    route: '/calculators/general-flip'
  },
  {
    id: 'local-vs-shipped',
    name: 'Local vs Shipped Sale',
    description: 'Compare local delivery expenses against online selling fees and shipping costs.',
    question: 'Should you sell locally or ship it?',
    category: 'Selling',
    status: 'available',
    route: '/calculators/local-vs-shipped',
    proTeaser: 'Compare local meetup costs against platform fees and fulfillment expenses before choosing an exit.'
  },
  {
    id: 'repair-vs-as-is',
    name: 'Repair vs Sell As-Is',
    description: 'Compare the expected outcome of repairing an item against selling it in current condition.',
    question: 'Is repairing this actually worth it?',
    category: 'Repair',
    status: 'available',
    route: '/calculators/repair-vs-as-is',
    proTeaser: 'Decide whether repair creates enough expected value to justify more time and money.'
  },
  {
    id: 'phone-flip',
    name: 'Phone Flip',
    description: 'Evaluate acquisition cost, known defects, repair expenses, parts value, and resale assumptions.',
    question: 'Is this phone flip worth the repair risk?',
    category: 'Phones',
    status: 'available',
    route: '/calculators/phone-flip',
    proTeaser: 'Model repair success, failure recovery, fees, shipping, and parts costs from your own assumptions.'
  },
  {
    id: 'power-tool-flip',
    name: 'Power Tool Flip',
    description: 'Evaluate tool condition, battery and charger inclusion, repair costs, and selling strategy.',
    question: 'Does this power-tool flip meet your target?',
    category: 'Power Tools',
    status: 'available',
    route: '/calculators/power-tool-flip',
    proTeaser: 'Separate tool, battery, charger, repair, and selling-cost assumptions into one buy decision.'
  },
  {
    id: 'chainsaw-flip',
    name: 'Chainsaw Flip',
    description: 'Compare complete-sale, repaired-sale, and parts-out assumptions for a chainsaw.',
    question: 'What should you pay for this chainsaw?',
    category: 'Chainsaws',
    status: 'available',
    route: '/calculators/chainsaw-flip',
    proTeaser: 'Compare as-is, repair, and part-out strategies with one maximum buy price recommendation.'
  }
]
