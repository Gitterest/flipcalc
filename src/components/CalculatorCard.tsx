import { Link } from 'react-router-dom'
import { getCalculatorAccess } from '../calculators/access'
import type { CalculatorDefinition } from '../types/calculator'

interface CalculatorCardProps {
  calculator: CalculatorDefinition
}

export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const access = getCalculatorAccess(calculator)
  const cardContent = (
    <>
      <div>
        <div className="card-meta">
          <span className="category-label">{calculator.category}</span>
          <span className={access === 'free' ? 'free-badge' : 'pro-badge'}>{access === 'free' ? 'Free' : 'Pro'}</span>
        </div>
        <h3>{calculator.name}</h3>
        <p className="question-line">{calculator.question}</p>
        <p>{calculator.description}</p>
      </div>
      <span className="status-badge">{access === 'free' ? 'Run free' : 'View Pro access'}</span>
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
