import { CalculatorCard } from '../components/CalculatorCard'
import { calculatorCatalog } from '../calculators/catalog'

export function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Make the decision before spending the money</p>
        <h1>Niche calculators built for real-world flipping.</h1>
        <p className="hero-copy">
          Compare buying costs, selling options, repair decisions, and risk without stitching together random formulas.
        </p>
      </section>

      <section aria-labelledby="calculator-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Calculator library</p>
            <h2 id="calculator-heading">Choose a decision tool</h2>
          </div>
          <span>{calculatorCatalog.length} planned calculators</span>
        </div>

        <div className="calculator-grid">
          {calculatorCatalog.map((calculator) => (
            <CalculatorCard calculator={calculator} key={calculator.id} />
          ))}
        </div>
      </section>
    </>
  )
}
