# Build Chainsaw Flip Strategy Calculator v1

## Goal

Implement a mobile-first **Chainsaw Flip Strategy Calculator** that compares three resale strategies for one chainsaw purchase:

1. Sell as-is
2. Repair and sell complete
3. Part out

The calculator must use only user-supplied values. It must never invent chainsaw values, parts prices, repair odds, sell-through rates, condition deductions, model compatibility, or market data.

## Required workflow

1. Read `AGENTS.md` and all files in `docs/`.
2. Create `docs/calculators/CHAINSAW_FLIP.md` containing this specification.
3. Implement strict types, pure calculation functions, and validation first.
4. Add complete Vitest coverage.
5. Build the route and UI only after calculation tests pass.
6. Run lint, tests, and production build before completion.

## Route

`/calculators/chainsaw-flip`

Update the existing Chainsaw Flip catalog card to `available` and make it navigate to this route. Preserve the Phone Flip and Power Tool Flip calculators.

## Inputs

All money and hour inputs are numeric and default to `0`.

### Shared acquisition and targets

- `askingPrice`: seller's asking price; minimum 0
- `travelCost`: acquisition travel expense; minimum 0
- `otherAcquisitionCost`: other cost shared by all strategies; minimum 0
- `negotiationDiscountPercent`: expected buyer discount applied to all item-revenue assumptions; 0 through 100
- `platformFeePercent`: percentage fee applied to each strategy's item revenue plus buyer-paid shipping; 0 through less than 100
- `desiredMinimumProfit`: required profit for a strategy; minimum 0
- `minimumRoiPercent`: required ROI for a strategy; minimum 0; values above 100 are allowed

### Sell as-is strategy

- `expectedAsIsSalePrice`: expected item price before negotiation; minimum 0
- `asIsShippingPaidByBuyer`: shipping collected from buyer; minimum 0
- `asIsActualShippingCost`: actual shipping expense; minimum 0
- `asIsPreparationCost`: cleaning, minor supplies, or preparation expense; minimum 0
- `asIsFixedSellingFees`: total fixed fees for the sale; minimum 0
- `asIsTimeHours`: expected time required; minimum 0

### Repair and sell strategy

- `expectedRepairedSalePrice`: expected item price if repair succeeds, before negotiation; minimum 0
- `expectedFailedRepairRecoveryValue`: expected as-is recovery value if repair fails, before negotiation; minimum 0
- `repairSuccessPercent`: user-supplied repair success probability; 0 through 100
- `topEndPartsCost`: piston, cylinder, rings, gasket, or top-end expense; minimum 0
- `carbFuelSystemCost`: carburetor, fuel line, filter, intake, or fuel-system expense; minimum 0
- `ignitionElectricalCost`: ignition, coil, plug, switch, wiring, or electrical expense; minimum 0
- `barChainCost`: bar, chain, sprocket, clutch, or cutting-equipment expense; minimum 0
- `otherRepairCost`: other repair expense; minimum 0
- `repairPreparationCost`: cleaning, testing, and consumable expense beyond repair parts; minimum 0
- `repairShippingPaidByBuyer`: shipping collected from buyer; minimum 0
- `repairActualShippingCost`: actual shipping expense; minimum 0
- `repairFixedSellingFees`: total fixed fees for the repaired sale; minimum 0
- `repairTimeHours`: expected repair, testing, listing, and fulfillment time; minimum 0

### Part-out strategy

- `expectedPartsGrossRevenue`: total potential item revenue if all entered parts sell, before sell-through and negotiation adjustments; minimum 0
- `partsSellThroughPercent`: user-supplied percentage of potential parts revenue expected to sell; 0 through 100
- `partOutShippingPaidByBuyers`: total shipping expected to be collected across parts sales; minimum 0
- `partOutActualShippingCost`: total actual shipping expense across parts sales; minimum 0
- `partOutSuppliesCost`: teardown, packaging, labeling, cleaning, and storage supplies; minimum 0
- `partOutFixedSellingFees`: total fixed fees across anticipated parts sales; minimum 0
- `partOutTimeHours`: expected teardown, listing, storage, and fulfillment time; minimum 0

## Shared rates

```text
discountRate = negotiationDiscountPercent / 100
feeRate = platformFeePercent / 100
minimumRoiRate = minimumRoiPercent / 100
repairSuccessRate = repairSuccessPercent / 100
partsSellThroughRate = partsSellThroughPercent / 100
```

Do not round intermediate values. Round only displayed currency and percentages to two decimal places.

## Strategy result shape

Each strategy must return:

- `itemRevenue`
- `grossBuyerPayment`
- `percentageSellingFee`
- `sellingFees`
- `nonPurchaseCosts`
- `totalInvestmentAtAsk`
- `profitAtAsk`
- `roiPercent`
- `hourlyProfit`
- `profitLimitedMaxBuyPrice`
- `roiLimitedMaxBuyPrice`
- `rawMaximumBuyPrice`
- `maximumBuyPrice`
- `amountBelowMaximum`
- `status`

`roiPercent` is `null` when total investment is 0.

`hourlyProfit` is `null` when the strategy time is 0.

## Exact sell as-is formulas

```text
asIsItemRevenue =
  expectedAsIsSalePrice * (1 - discountRate)

asIsGrossBuyerPayment =
  asIsItemRevenue + asIsShippingPaidByBuyer

asIsPercentageSellingFee =
  asIsGrossBuyerPayment * feeRate

asIsSellingFees =
  asIsPercentageSellingFee + asIsFixedSellingFees

asIsNonPurchaseCosts =
  travelCost +
  otherAcquisitionCost +
  asIsPreparationCost +
  asIsSellingFees +
  asIsActualShippingCost

asIsTotalInvestmentAtAsk =
  askingPrice + asIsNonPurchaseCosts

asIsProfitAtAsk =
  asIsGrossBuyerPayment - asIsTotalInvestmentAtAsk

asIsRoiPercent =
  asIsTotalInvestmentAtAsk > 0
    ? (asIsProfitAtAsk / asIsTotalInvestmentAtAsk) * 100
    : null

asIsHourlyProfit =
  asIsTimeHours > 0
    ? asIsProfitAtAsk / asIsTimeHours
    : null

asIsProfitLimitedMaxBuyPrice =
  asIsGrossBuyerPayment -
  asIsNonPurchaseCosts -
  desiredMinimumProfit

asIsRoiLimitedMaxBuyPrice =
  asIsGrossBuyerPayment / (1 + minimumRoiRate) -
  asIsNonPurchaseCosts

asIsRawMaximumBuyPrice = min(
  asIsProfitLimitedMaxBuyPrice,
  asIsRoiLimitedMaxBuyPrice
)

asIsMaximumBuyPrice = max(0, asIsRawMaximumBuyPrice)

asIsAmountBelowMaximum =
  asIsMaximumBuyPrice - askingPrice
```

## Exact repair and sell formulas

```text
repairPartsCost =
  topEndPartsCost +
  carbFuelSystemCost +
  ignitionElectricalCost +
  barChainCost +
  otherRepairCost

discountedRepairedRevenue =
  expectedRepairedSalePrice * (1 - discountRate)

discountedFailedRepairRevenue =
  expectedFailedRepairRecoveryValue * (1 - discountRate)

expectedRepairItemRevenue =
  discountedRepairedRevenue * repairSuccessRate +
  discountedFailedRepairRevenue * (1 - repairSuccessRate)

repairGrossBuyerPayment =
  expectedRepairItemRevenue + repairShippingPaidByBuyer

repairPercentageSellingFee =
  repairGrossBuyerPayment * feeRate

repairSellingFees =
  repairPercentageSellingFee + repairFixedSellingFees

repairNonPurchaseCosts =
  travelCost +
  otherAcquisitionCost +
  repairPartsCost +
  repairPreparationCost +
  repairSellingFees +
  repairActualShippingCost

repairTotalInvestmentAtAsk =
  askingPrice + repairNonPurchaseCosts

repairExpectedProfitAtAsk =
  repairGrossBuyerPayment - repairTotalInvestmentAtAsk

repairExpectedRoiPercent =
  repairTotalInvestmentAtAsk > 0
    ? (repairExpectedProfitAtAsk / repairTotalInvestmentAtAsk) * 100
    : null

repairExpectedHourlyProfit =
  repairTimeHours > 0
    ? repairExpectedProfitAtAsk / repairTimeHours
    : null

repairSuccessGrossBuyerPayment =
  discountedRepairedRevenue + repairShippingPaidByBuyer

repairFailureGrossBuyerPayment =
  discountedFailedRepairRevenue + repairShippingPaidByBuyer

repairSuccessSellingFees =
  repairSuccessGrossBuyerPayment * feeRate + repairFixedSellingFees

repairFailureSellingFees =
  repairFailureGrossBuyerPayment * feeRate + repairFixedSellingFees

repairSuccessProfitAtAsk =
  repairSuccessGrossBuyerPayment -
  (
    askingPrice +
    travelCost +
    otherAcquisitionCost +
    repairPartsCost +
    repairPreparationCost +
    repairSuccessSellingFees +
    repairActualShippingCost
  )

repairFailureProfitAtAsk =
  repairFailureGrossBuyerPayment -
  (
    askingPrice +
    travelCost +
    otherAcquisitionCost +
    repairPartsCost +
    repairPreparationCost +
    repairFailureSellingFees +
    repairActualShippingCost
  )

repairProfitLimitedMaxBuyPrice =
  repairGrossBuyerPayment -
  repairNonPurchaseCosts -
  desiredMinimumProfit

repairRoiLimitedMaxBuyPrice =
  repairGrossBuyerPayment / (1 + minimumRoiRate) -
  repairNonPurchaseCosts

repairRawMaximumBuyPrice = min(
  repairProfitLimitedMaxBuyPrice,
  repairRoiLimitedMaxBuyPrice
)

repairMaximumBuyPrice = max(0, repairRawMaximumBuyPrice)

repairAmountBelowMaximum =
  repairMaximumBuyPrice - askingPrice
```

## Exact part-out formulas

```text
sellablePartsRevenue =
  expectedPartsGrossRevenue * partsSellThroughRate

partOutItemRevenue =
  sellablePartsRevenue * (1 - discountRate)

partOutGrossBuyerPayment =
  partOutItemRevenue + partOutShippingPaidByBuyers

partOutPercentageSellingFee =
  partOutGrossBuyerPayment * feeRate

partOutSellingFees =
  partOutPercentageSellingFee + partOutFixedSellingFees

partOutNonPurchaseCosts =
  travelCost +
  otherAcquisitionCost +
  partOutSuppliesCost +
  partOutSellingFees +
  partOutActualShippingCost

partOutTotalInvestmentAtAsk =
  askingPrice + partOutNonPurchaseCosts

partOutProfitAtAsk =
  partOutGrossBuyerPayment - partOutTotalInvestmentAtAsk

partOutRoiPercent =
  partOutTotalInvestmentAtAsk > 0
    ? (partOutProfitAtAsk / partOutTotalInvestmentAtAsk) * 100
    : null

partOutHourlyProfit =
  partOutTimeHours > 0
    ? partOutProfitAtAsk / partOutTimeHours
    : null

partOutProfitLimitedMaxBuyPrice =
  partOutGrossBuyerPayment -
  partOutNonPurchaseCosts -
  desiredMinimumProfit

partOutRoiLimitedMaxBuyPrice =
  partOutGrossBuyerPayment / (1 + minimumRoiRate) -
  partOutNonPurchaseCosts

partOutRawMaximumBuyPrice = min(
  partOutProfitLimitedMaxBuyPrice,
  partOutRoiLimitedMaxBuyPrice
)

partOutMaximumBuyPrice = max(0, partOutRawMaximumBuyPrice)

partOutAmountBelowMaximum =
  partOutMaximumBuyPrice - askingPrice
```

## Per-strategy status

Use only:

- `buy-at-ask`
- `negotiate`
- `pass`

For each strategy, apply these rules in order:

1. `pass` when that strategy's gross buyer payment is less than or equal to 0.
2. `pass` when that strategy's raw maximum buy price is less than 0.
3. `buy-at-ask` when `askingPrice` is less than or equal to that strategy's maximum buy price.
4. Otherwise `negotiate`.

## Overall decision and recommendation

Return:

- `overallDecision`: `buy-at-ask`, `negotiate`, or `pass`
- `recommendedStrategy`: `as-is`, `repair`, `part-out`, or `null`
- `overallMaximumBuyPrice`

Rules:

1. `overallMaximumBuyPrice = max(asIsMaximumBuyPrice, repairMaximumBuyPrice, partOutMaximumBuyPrice)`.
2. If one or more strategies are `buy-at-ask`, set `overallDecision = buy-at-ask` and recommend the qualifying strategy with the highest profit at asking price.
3. If no strategy is `buy-at-ask` but one or more are `negotiate`, set `overallDecision = negotiate` and recommend the negotiating strategy with the highest maximum buy price.
4. If every strategy is `pass`, set `overallDecision = pass` and `recommendedStrategy = null`.
5. Profit ties are broken by higher ROI. If still tied, use this fixed order: `as-is`, `repair`, `part-out`.
6. Maximum-buy-price ties use the same fixed order: `as-is`, `repair`, `part-out`.

Do not add hidden scores or subjective recommendations.

## Additional required outputs

- `repairPartsCost`
- `discountedRepairedRevenue`
- `discountedFailedRepairRevenue`
- `repairSuccessProfitAtAsk`
- `repairFailureProfitAtAsk`
- `sellablePartsRevenue`
- All three complete strategy result objects
- Overall decision, recommendation, and overall maximum buy price

## Validation

Return field-specific errors.

- Reject non-numeric values, `NaN`, and `Infinity`.
- Reject negative values for every field.
- Reject negotiation discount below 0 or above 100.
- Reject platform fee below 0 or greater than or equal to 100.
- Reject repair success below 0 or above 100.
- Reject parts sell-through below 0 or above 100.
- Allow minimum ROI above 100.
- Allow zero hours and return `null` hourly profit for that strategy.
- Do not silently clamp invalid input.
- Do not calculate until validation succeeds.

## Required tests

Use approximate floating-point assertions where appropriate.

### Test 1: as-is is the only buy-at-ask strategy

```text
askingPrice = 80
travelCost = 10
otherAcquisitionCost = 0
negotiationDiscountPercent = 10
platformFeePercent = 10
desiredMinimumProfit = 30
minimumRoiPercent = 25

expectedAsIsSalePrice = 180
asIsShippingPaidByBuyer = 20
asIsActualShippingCost = 20
asIsPreparationCost = 5
asIsFixedSellingFees = 0
asIsTimeHours = 2

expectedRepairedSalePrice = 220
expectedFailedRepairRecoveryValue = 90
repairSuccessPercent = 60
topEndPartsCost = 60
all other repair costs = 0
repairPreparationCost = 5
repairShippingPaidByBuyer = 20
repairActualShippingCost = 20
repairFixedSellingFees = 0
repairTimeHours = 4

expectedPartsGrossRevenue = 250
partsSellThroughPercent = 50
partOutShippingPaidByBuyers = 25
partOutActualShippingCost = 30
partOutSuppliesCost = 10
partOutFixedSellingFees = 0
partOutTimeHours = 5
```

Expected important results:

```text
asIs.itemRevenue = 162
asIs.grossBuyerPayment = 182
asIs.sellingFees = 18.2
asIs.nonPurchaseCosts = 53.2
asIs.totalInvestmentAtAsk = 133.2
asIs.profitAtAsk = 48.8
asIs.roiPercent approximately 36.6366366
asIs.hourlyProfit = 24.4
asIs.maximumBuyPrice = 92.4
asIs.status = buy-at-ask

repair.itemRevenue = 151.2
repair.profitAtAsk = -20.92
repair.maximumBuyPrice approximately 24.84
repair.status = negotiate

partOut.itemRevenue = 112.5
partOut.profitAtAsk = -6.25
partOut.maximumBuyPrice = 43.75
partOut.status = negotiate

overallDecision = buy-at-ask
recommendedStrategy = as-is
overallMaximumBuyPrice = 92.4
```

### Test 2: repair is the recommended buy-at-ask strategy

```text
askingPrice = 95
travelCost = 10
otherAcquisitionCost = 0
negotiationDiscountPercent = 0
platformFeePercent = 10
desiredMinimumProfit = 40
minimumRoiPercent = 25

expectedAsIsSalePrice = 150
as-is shipping, shipping cost, and fixed fees = 0
asIsPreparationCost = 5
asIsTimeHours = 1

expectedRepairedSalePrice = 300
expectedFailedRepairRecoveryValue = 100
repairSuccessPercent = 80
topEndPartsCost = 70
all other repair costs = 0
repairPreparationCost = 5
repair shipping, shipping cost, and fixed fees = 0
repairTimeHours = 4

expectedPartsGrossRevenue = 220
partsSellThroughPercent = 80
part-out shipping, shipping cost, and fixed fees = 0
partOutSuppliesCost = 10
partOutTimeHours = 5
```

Expected important results:

```text
asIs.profitAtAsk = 25
asIs.maximumBuyPrice = 80
asIs.status = negotiate

repairPartsCost = 70
expectedRepairItemRevenue = 260
repair.profitAtAsk = 54
repair.roiPercent approximately 26.2135922
repair.maximumBuyPrice = 97
repair.status = buy-at-ask
repairSuccessProfitAtAsk = 90
repairFailureProfitAtAsk = -90

sellablePartsRevenue = 176
partOut.profitAtAsk = 43.4
partOut.roiPercent approximately 32.7300151
partOut.maximumBuyPrice = 98.4
partOut.status = buy-at-ask

overallDecision = buy-at-ask
recommendedStrategy = repair
overallMaximumBuyPrice = 98.4
```

The recommendation is repair because among buy-at-ask strategies it has the higher profit at asking price, even though part-out has a slightly higher maximum buy price.

### Test 3: part-out is the recommended negotiation strategy

```text
askingPrice = 150
travelCost = 10
otherAcquisitionCost = 0
negotiationDiscountPercent = 10
platformFeePercent = 12
desiredMinimumProfit = 50
minimumRoiPercent = 30

expectedAsIsSalePrice = 180
asIsPreparationCost = 5
all as-is shipping and fixed fee inputs = 0
asIsTimeHours = 1

expectedRepairedSalePrice = 350
expectedFailedRepairRecoveryValue = 120
repairSuccessPercent = 60
topEndPartsCost = 100
all other repair costs = 0
repairPreparationCost = 5
all repair shipping and fixed fee inputs = 0
repairTimeHours = 5

expectedPartsGrossRevenue = 500
partsSellThroughPercent = 70
partOutShippingPaidByBuyers = 50
partOutActualShippingCost = 60
partOutSuppliesCost = 20
partOutFixedSellingFees = 5
partOutTimeHours = 8
```

Expected important results:

```text
asIs.maximumBuyPrice = 77.56
asIs.status = negotiate

expectedRepairItemRevenue = 232.2
repair.maximumBuyPrice approximately 35.7513846
repair.status = negotiate

sellablePartsRevenue = 350
partOut.itemRevenue = 315
partOut.grossBuyerPayment = 365
partOut.sellingFees = 48.8
partOut.nonPurchaseCosts = 138.8
partOut.totalInvestmentAtAsk = 288.8
partOut.profitAtAsk = 76.2
partOut.roiPercent approximately 26.3850416
partOut.maximumBuyPrice approximately 141.9692308
partOut.status = negotiate

overallDecision = negotiate
recommendedStrategy = part-out
overallMaximumBuyPrice approximately 141.9692308
```

### Test 4: all strategies pass

Create a case where all three strategies have either no revenue or a negative raw maximum buy price.

Expected:

```text
overallDecision = pass
recommendedStrategy = null
```

### Test 5: probability and sell-through boundaries

- At 100% repair success, expected repair item revenue equals discounted repaired revenue.
- At 0% repair success, expected repair item revenue equals discounted failed-repair revenue.
- At 100% parts sell-through, sellable parts revenue equals expected parts gross revenue.
- At 0% parts sell-through, sellable parts revenue equals 0.

### Test 6: validation

Verify field-specific errors for:

- negative asking price
- negotiation discount over 100
- platform fee equal to 100
- repair success over 100
- parts sell-through over 100
- `NaN`
- `Infinity`
- non-numeric input

### Test 7: zero investment and zero time

Verify ROI is `null` for a strategy with zero total investment and hourly profit is `null` for a strategy with zero time.

### Test 8: recommendation tie-breaking

Verify ties follow higher ROI and then the fixed order `as-is`, `repair`, `part-out`.

## UI requirements

- Mobile-first and fully usable at 320px width.
- Reuse the existing app shell and visual system.
- Group inputs into Shared Deal Assumptions, Sell As-Is, Repair and Sell, and Part Out.
- Clearly explain that all values, repair odds, and sell-through estimates are supplied by the user.
- Show the overall decision, recommended strategy, and overall maximum buy price first.
- Show three clearly separated strategy result cards.
- Each result card must prominently show status, profit, ROI, hourly profit, and maximum buy price.
- Repair results must show success-case and failure-case profits.
- Part-out results must show sellable parts revenue.
- Display field-specific errors.
- Provide Calculate and Reset buttons.
- Do not rely on color alone.
- Preserve keyboard accessibility and visible focus.
- Do not add a chainsaw database, model lookup, parts database, compatibility lookup, market-price lookup, persistence, history, export, authentication, backend, analytics, payments, ads, or unrelated dependencies.

## Acceptance criteria

- All formulas are pure TypeScript functions under `src/calculators/`.
- Shared strategy calculation logic is reused rather than copied unnecessarily.
- React components do not duplicate formulas.
- Required and edge-case tests pass.
- Existing Phone and Power Tool tests continue to pass.
- Lint passes.
- Production build passes.
- Documentation matches implementation.
- No unrelated redesign or calculator is introduced.
