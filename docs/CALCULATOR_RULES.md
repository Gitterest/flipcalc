# Calculator Rules

## Non-negotiable rule

No formula, threshold, deduction, success probability, condition adjustment, or recommendation may be invented by the implementation agent.

Every calculator specification must define:

- Purpose
- Inputs
- Input constraints
- Outputs
- Exact formulas
- Recommendation logic
- Rounding behavior
- Edge-case behavior
- Test cases

## Shared terminology

- `purchasePrice`: amount paid to acquire an item
- `expectedSalePrice`: estimated final amount received from the buyer
- `sellingCosts`: platform fees, payment fees, promotions, and supplies
- `repairCosts`: parts and outsourced repair expenses
- `travelCosts`: fuel, tolls, and delivery expenses
- `totalInvestment`: total money spent
- `netProfit`: proceeds minus total investment and selling costs
- `roiPercent`: net profit divided by total investment, multiplied by 100
- `maximumBuyPrice`: highest purchase price that preserves a defined profit target

## Calculation architecture

Each calculator should export:

- Input and output TypeScript types
- A pure calculation function
- Input validation
- Tests with documented expected values

UI code may call calculation functions but must not duplicate their formulas.
