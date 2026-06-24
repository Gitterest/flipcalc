import { Link } from 'react-router-dom'
import type { CalculatorDefinition } from '../types/calculator'

interface CalculatorCardProps {
  calculator: CalculatorDefinition
}

export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const cardContent = (
    <>
      <div>
        <span className="category-label">{calculator.category}</span>
        <h3>{calculator.name}</h3>
        <p>{calculator.description}</p>
      </div>
      <span className="status-badge">{calculator.status === 'planned' ? 'Planned' : 'Available'}</span>
    </>
  )

  if (calculator.status === 'available' && calculator.route !== undefined) {
    return (
      <Link className="calculator-card calculator-card-link" to={calculator.route} aria-label={`Open ${calculator.name}`}>
        {cardContent}
      </Link>
    )
  }

  return (
    <article className="calculator-card">
      {cardContent}
    </article>
  )
}
