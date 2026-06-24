# Power Tool Flip Calculator v1

Source: GitHub Issue #1, `Gitterest/flipcalc`

## Goal

Implement the first production calculator in FlipCalc: a mobile-first **Power Tool Flip Calculator** that helps a reseller decide whether to buy a tool, tool kit, battery, charger, case, or accessory bundle.

The calculator must never invent market values. The user supplies all resale assumptions.

## Required workflow

1. Read `AGENTS.md` and all files in `docs/`.
2. Create `docs/calculators/POWER_TOOL_FLIP.md` containing this specification.
3. Implement pure TypeScript calculation and validation functions first.
4. Add complete Vitest coverage.
5. Build the route and UI only after the calculation tests pass.
6. Run lint, tests, and production build before completion.

## Route

`/calculators/power-tool-flip`

Update the existing Power Tool catalog card to `available` and make it navigate to this route. Other calculator cards remain unchanged.

## Inputs

All money values are numeric USD amounts and default to `0`.

- `askingPrice`: seller's current asking price; minimum 0
- `expectedToolSalePrice`: expected resale contribution of the tool; minimum 0
- `expectedBatterySalePrice`: expected resale contribution of included batteries; minimum 0
- `expectedChargerSalePrice`: expected resale contribution of included charger(s); minimum 0
- `expectedCaseAccessorySalePrice`: expected resale contribution of case and accessories; minimum 0
- `negotiationDiscountPercent`: expected buyer discount from the combined component value; 0 through 100
- `platformFeePercent`: selling fee applied to item revenue plus shipping charged to buyer; 0 through 100, but values equal to 100 must be rejected because break-even math would divide by zero
- `fixedSellingFees`: fixed transaction or promotion fees; minimum 0
- `shippingPaidByBuyer`: shipping amount collected from the buyer; minimum 0
- `actualShippingCost`: actual shipping expense; minimum 0
- `repairPartsCost`: repair parts and outsourced repair expense; minimum 0
- `cleaningSuppliesCost`: cleaning and consumable expense; minimum 0
- `travelCost`: pickup or delivery expense; minimum 0
- `otherCost`: other direct expense; minimum 0
- `desiredMinimumProfit`: user's required dollar profit; minimum 0
- `minimumRoiPercent`: user's required ROI percentage; minimum 0
- `timeHours`: total expected labor/listing/travel time; minimum 0

## Exact formulas

Let:

```text
componentValue =
  expectedToolSalePrice +
  expectedBatterySalePrice +
  expectedChargerSalePrice +
  expectedCaseAccessorySalePrice

discountRate = negotiationDiscountPercent / 100
feeRate = platformFeePercent / 100
minimumRoiRate = minimumRoiPercent / 100

expectedItemSaleRevenue = componentValue * (1 - discountRate)

grossBuyerPayment = expectedItemSaleRevenue + shippingPaidByBuyer

percentageSellingFee = grossBuyerPayment * feeRate

sellingFees = percentageSellingFee + fixedSellingFees

nonPurchaseCosts =
  sellingFees +
  actualShippingCost +
  repairPartsCost +
  cleaningSuppliesCost +
  travelCost +
  otherCost

totalInvestmentAtAsk = askingPrice + nonPurchaseCosts

expectedProfitAtAsk = grossBuyerPayment - totalInvestmentAtAsk

roiPercent =
  totalInvestmentAtAsk > 0
    ? (expectedProfitAtAsk / totalInvestmentAtAsk) * 100
    : null

hourlyProfit =
  timeHours > 0
    ? expectedProfitAtAsk / timeHours
    : null

profitLimitedMaxBuyPrice =
  grossBuyerPayment - nonPurchaseCosts - desiredMinimumProfit

roiLimitedMaxBuyPrice =
  grossBuyerPayment / (1 + minimumRoiRate) - nonPurchaseCosts

rawMaximumBuyPrice = min(
  profitLimitedMaxBuyPrice,
  roiLimitedMaxBuyPrice
)

maximumBuyPrice = max(0, rawMaximumBuyPrice)

amountBelowMaximum = maximumBuyPrice - askingPrice

breakEvenGrossBuyerPayment =
  (
    askingPrice +
    fixedSellingFees +
    actualShippingCost +
    repairPartsCost +
    cleaningSuppliesCost +
    travelCost +
    otherCost
  ) / (1 - feeRate)
```

Do not round intermediate calculations. Round only formatted display values to two decimal places.

## Decision status

Use only these statuses:

- `buy-at-ask`
- `negotiate`
- `pass`

Rules, in order:

1. `pass` when `grossBuyerPayment <= 0`.
2. `pass` when `rawMaximumBuyPrice < 0`.
3. `buy-at-ask` when `askingPrice <= maximumBuyPrice`.
4. Otherwise `negotiate`.

Display meanings:

- `buy-at-ask`: The current asking price meets both the user's minimum profit and minimum ROI targets.
- `negotiate`: The asking price is too high. Show the maximum buy price and how far the asking price is above it.
- `pass`: The entered assumptions cannot meet the user's targets even at a zero-dollar purchase price, or there is no expected revenue.

No hidden thresholds, scores, probabilities, or automatic market-value deductions are allowed.

## Required outputs

- Combined component value
- Expected item sale revenue after negotiation
- Gross buyer payment
- Percentage selling fee
- Total selling fees
- Non-purchase costs
- Total investment at asking price
- Expected profit at asking price
- ROI percentage or `Not available`
- Hourly profit or `Not available`
- Profit-limited maximum buy price
- ROI-limited maximum buy price
- Final maximum buy price
- Amount below or above maximum buy price
- Break-even gross buyer payment
- Decision status and explanation

## Validation

Return field-specific validation errors.

- Reject `NaN`, `Infinity`, and non-numeric values.
- Reject negative values for all fields.
- Reject negotiation discount below 0 or above 100.
- Reject platform fee below 0 or greater than or equal to 100.
- Allow minimum ROI above 100.
- Allow zero time and return `null` hourly profit.
- Do not silently clamp invalid user input.
- Do not run calculation until validation succeeds.

## Required tests

Use approximate floating-point assertions where appropriate.

### Test 1: local bundle, buy at ask

```text
askingPrice = 100
component prices = 200 total
negotiationDiscountPercent = 0
platformFeePercent = 0
fixedSellingFees = 0
shippingPaidByBuyer = 0
actualShippingCost = 0
repairPartsCost = 20
cleaningSuppliesCost = 5
travelCost = 5
otherCost = 0
desiredMinimumProfit = 40
minimumRoiPercent = 25
timeHours = 2
```

Expected:

```text
grossBuyerPayment = 200
nonPurchaseCosts = 30
expectedProfitAtAsk = 70
totalInvestmentAtAsk = 130
roiPercent approximately 53.8461538
hourlyProfit = 35
profitLimitedMaxBuyPrice = 130
roiLimitedMaxBuyPrice = 130
maximumBuyPrice = 130
status = buy-at-ask
```

### Test 2: shipped sale, ROI is limiting factor

```text
askingPrice = 120
component prices = 300 total
negotiationDiscountPercent = 10
platformFeePercent = 10
fixedSellingFees = 0
shippingPaidByBuyer = 20
actualShippingCost = 25
repairPartsCost = 20
cleaningSuppliesCost = 5
travelCost = 0
otherCost = 0
desiredMinimumProfit = 60
minimumRoiPercent = 40
timeHours = 4
```

Expected:

```text
expectedItemSaleRevenue = 270
grossBuyerPayment = 290
sellingFees = 29
nonPurchaseCosts = 79
expectedProfitAtAsk = 91
totalInvestmentAtAsk = 199
roiPercent approximately 45.7286432
hourlyProfit = 22.75
profitLimitedMaxBuyPrice = 151
roiLimitedMaxBuyPrice approximately 128.1428571
maximumBuyPrice approximately 128.1428571
status = buy-at-ask
```

### Test 3: negotiate

Use Test 2 values but set `askingPrice = 150`.

Expected:

```text
expectedProfitAtAsk = 61
totalInvestmentAtAsk = 229
roiPercent approximately 26.6375546
maximumBuyPrice approximately 128.1428571
status = negotiate
```

### Test 4: impossible deal

```text
askingPrice = 0
component prices = 50 total
all percentages = 0
repairPartsCost = 60
all other costs = 0
desiredMinimumProfit = 10
minimumRoiPercent = 0
timeHours = 0
```

Expected:

```text
rawMaximumBuyPrice = -20
maximumBuyPrice = 0
hourlyProfit = null
status = pass
```

### Test 5: validation

Verify errors for:

- negative asking price
- negotiation discount over 100
- platform fee equal to 100
- `NaN`
- `Infinity`

### Test 6: zero investment

Verify ROI is `null` when asking price and all non-purchase costs are zero.

## UI requirements

- Mobile-first and fully usable at 320px width.
- Reuse the current app shell and design direction.
- Group inputs into: Deal, Expected Resale, Selling Costs, Preparation Costs, and Targets.
- Use visible labels and short helper text.
- Use proper numeric input modes for mobile keyboards.
- Display field-level validation messages.
- Provide Calculate and Reset buttons.
- Put the decision status, maximum buy price, expected profit, and ROI at the top of the results.
- Clearly state that FlipCalc does not determine market value; the user supplies resale assumptions.
- Do not rely on color alone for status.
- Do not add persistence, history, export, authentication, backend, analytics, payments, ads, or unrelated dependencies in this task.

## Acceptance criteria

- Exact formulas are isolated in pure TypeScript functions under `src/calculators/`.
- UI contains no duplicated business formulas.
- All required tests pass.
- Existing catalog test passes.
- Lint passes.
- Production build passes.
- Documentation matches implementation.
- No unrelated calculator or redesign is introduced.
