import type { CalculatorDefinition } from '../types/calculator'

interface CalculatorCardProps {
  calculator: CalculatorDefinition
}

export function CalculatorCard({ calculator }: CalculatorCardProps) {
  return (
    <article className="calculator-card">
      <div>
        <span className="category-label">{calculator.category}</span>
        <h3>{calculator.name}</h3>
        <p>{calculator.description}</p>
      </div>
      <span className="status-badge">{calculator.status === 'planned' ? 'Planned' : 'Available'}</span>
    </article>
  )
}
