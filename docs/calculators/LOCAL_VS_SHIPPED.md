# Build Local vs Shipped Sale Calculator v1

## Goal

Implement a mobile-first **Local vs Shipped Sale Calculator** that compares selling the same acquired item locally versus selling it online and shipping it.

The calculator must use only user-supplied assumptions. It must never invent item values, platform fees, shipping prices, discounts, travel costs, delivery costs, return rates, or market data.

## Required workflow

1. Read `AGENTS.md` and all files in `docs/`.
2. Create `docs/calculators/LOCAL_VS_SHIPPED.md` containing this specification.
3. Implement strict types, pure calculation functions, and validation first.
4. Add complete Vitest coverage.
5. Build the route and UI only after calculation tests pass.
6. Run lint, tests, and production build before completion.

## Route

`/calculators/local-vs-shipped`

Update the existing Local vs Shipped Sale catalog card to `available` and make it navigate to this route. Preserve all existing calculators.

## Inputs

All money and hour inputs are numeric and default to `0`.

### Shared deal assumptions

- `askingPrice`: acquisition price; minimum 0
- `acquisitionTravelCost`: cost to acquire the item; minimum 0
- `preparationCost`: cleaning, testing, or preparation cost shared by both sale methods; minimum 0
- `otherSharedCost`: other cost shared by both sale methods; minimum 0
- `desiredMinimumProfit`: required profit; minimum 0
- `minimumRoiPercent`: required ROI; minimum 0; values above 100 are allowed

### Local sale assumptions

- `expectedLocalSalePrice`: expected local item price before negotiation; minimum 0
- `localNegotiationDiscountPercent`: expected local buyer discount; 0 through 100
- `localDeliveryCost`: delivery, meetup, fuel, toll, or local transportation expense; minimum 0
- `localOtherCost`: other local-only expense; minimum 0
- `localTimeHours`: expected local listing, messaging, meetup, and delivery time; minimum 0

### Shipped sale assumptions

- `expectedShippedSalePrice`: expected online item price before negotiation; minimum 0
- `shippedNegotiationDiscountPercent`: expected online buyer discount; 0 through 100
- `platformFeePercent`: percentage fee applied to shipped item revenue plus buyer-paid shipping; 0 through less than 100
- `fixedSellingFees`: total fixed transaction or promotion fees; minimum 0
- `shippingPaidByBuyer`: shipping collected from the buyer; minimum 0
- `actualShippingCost`: actual shipping expense; minimum 0
- `packingSuppliesCost`: box, tape, padding, label, and packing expense; minimum 0
- `shippedOtherCost`: other shipped-sale expense; minimum 0
- `shippedTimeHours`: expected listing, packing, and fulfillment time; minimum 0

## Shared formulas

```text
localDiscountRate = localNegotiationDiscountPercent / 100
shippedDiscountRate = shippedNegotiationDiscountPercent / 100
feeRate = platformFeePercent / 100
minimumRoiRate = minimumRoiPercent / 100

sharedCosts =
  acquisitionTravelCost +
  preparationCost +
  otherSharedCost
```

Do not round intermediate values. Round only displayed currency and percentages to two decimal places.

## Sale option result shape

Each sale option must return:

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

`hourlyProfit` is `null` when the option time is 0.

## Exact local sale formulas

```text
localItemRevenue =
  expectedLocalSalePrice * (1 - localDiscountRate)

localGrossBuyerPayment = localItemRevenue

localPercentageSellingFee = 0

localSellingFees = 0

localNonPurchaseCosts =
  sharedCosts +
  localDeliveryCost +
  localOtherCost

localTotalInvestmentAtAsk =
  askingPrice + localNonPurchaseCosts

localProfitAtAsk =
  localGrossBuyerPayment - localTotalInvestmentAtAsk

localRoiPercent =
  localTotalInvestmentAtAsk > 0
    ? (localProfitAtAsk / localTotalInvestmentAtAsk) * 100
    : null

localHourlyProfit =
  localTimeHours > 0
    ? localProfitAtAsk / localTimeHours
    : null

localProfitLimitedMaxBuyPrice =
  localGrossBuyerPayment -
  localNonPurchaseCosts -
  desiredMinimumProfit

localRoiLimitedMaxBuyPrice =
  localGrossBuyerPayment / (1 + minimumRoiRate) -
  localNonPurchaseCosts

localRawMaximumBuyPrice = min(
  localProfitLimitedMaxBuyPrice,
  localRoiLimitedMaxBuyPrice
)

localMaximumBuyPrice = max(0, localRawMaximumBuyPrice)

localAmountBelowMaximum =
  localMaximumBuyPrice - askingPrice
```

## Exact shipped sale formulas

```text
shippedItemRevenue =
  expectedShippedSalePrice * (1 - shippedDiscountRate)

shippedGrossBuyerPayment =
  shippedItemRevenue + shippingPaidByBuyer

shippedPercentageSellingFee =
  shippedGrossBuyerPayment * feeRate

shippedSellingFees =
  shippedPercentageSellingFee + fixedSellingFees

shippedNonPurchaseCosts =
  sharedCosts +
  shippedSellingFees +
  actualShippingCost +
  packingSuppliesCost +
  shippedOtherCost

shippedTotalInvestmentAtAsk =
  askingPrice + shippedNonPurchaseCosts

shippedProfitAtAsk =
  shippedGrossBuyerPayment - shippedTotalInvestmentAtAsk

shippedRoiPercent =
  shippedTotalInvestmentAtAsk > 0
    ? (shippedProfitAtAsk / shippedTotalInvestmentAtAsk) * 100
    : null

shippedHourlyProfit =
  shippedTimeHours > 0
    ? shippedProfitAtAsk / shippedTimeHours
    : null

shippedProfitLimitedMaxBuyPrice =
  shippedGrossBuyerPayment -
  shippedNonPurchaseCosts -
  desiredMinimumProfit

shippedRoiLimitedMaxBuyPrice =
  shippedGrossBuyerPayment / (1 + minimumRoiRate) -
  shippedNonPurchaseCosts

shippedRawMaximumBuyPrice = min(
  shippedProfitLimitedMaxBuyPrice,
  shippedRoiLimitedMaxBuyPrice
)

shippedMaximumBuyPrice = max(0, shippedRawMaximumBuyPrice)

shippedAmountBelowMaximum =
  shippedMaximumBuyPrice - askingPrice
```

## Per-option status

Use only:

- `buy-at-ask`
- `negotiate`
- `pass`

For each option, apply these rules in order:

1. `pass` when that option's gross buyer payment is less than or equal to 0.
2. `pass` when that option's raw maximum buy price is less than 0.
3. `buy-at-ask` when `askingPrice` is less than or equal to that option's maximum buy price.
4. Otherwise `negotiate`.

## Overall recommendation

Return:

- `overallDecision`: `buy-at-ask`, `negotiate`, or `pass`
- `recommendedSaleMethod`: `local`, `shipped`, or `null`
- `overallMaximumBuyPrice`
- `profitDifferenceShippedMinusLocal`
- `hourlyProfitDifferenceShippedMinusLocal`, or `null` when either hourly result is unavailable

Rules:

1. `overallMaximumBuyPrice = max(localMaximumBuyPrice, shippedMaximumBuyPrice)`.
2. If one or both options are `buy-at-ask`, set `overallDecision = buy-at-ask` and recommend the qualifying option with the higher profit at asking price.
3. Break a qualifying profit tie using higher ROI.
4. Break a remaining tie using higher hourly profit when both hourly values are available and unequal.
5. Break any remaining tie using fixed order: `local`, then `shipped`.
6. If neither option is `buy-at-ask` but one or both are `negotiate`, set `overallDecision = negotiate` and recommend the negotiating option with the higher maximum buy price.
7. Break a maximum-buy-price tie using fixed order: `local`, then `shipped`.
8. If both options are `pass`, set `overallDecision = pass` and `recommendedSaleMethod = null`.

No hidden score, convenience adjustment, risk penalty, return-rate estimate, or subjective recommendation is allowed.

## Validation

Return field-specific errors.

- Reject non-numeric values, `NaN`, and `Infinity`.
- Reject negative values for every field.
- Reject local negotiation discount below 0 or above 100.
- Reject shipped negotiation discount below 0 or above 100.
- Reject platform fee below 0 or greater than or equal to 100.
- Allow minimum ROI above 100.
- Allow zero hours and return `null` hourly profit for that option.
- Do not silently clamp invalid input.
- Do not calculate until validation succeeds.

## Required tests

Use approximate floating-point assertions where appropriate.

### Test 1: both qualify, local is recommended

```text
askingPrice = 100
acquisitionTravelCost = 10
preparationCost = 5
otherSharedCost = 0
desiredMinimumProfit = 40
minimumRoiPercent = 25

expectedLocalSalePrice = 220
localNegotiationDiscountPercent = 0
localDeliveryCost = 10
localOtherCost = 0
localTimeHours = 2

expectedShippedSalePrice = 260
shippedNegotiationDiscountPercent = 10
platformFeePercent = 10
fixedSellingFees = 5
shippingPaidByBuyer = 20
actualShippingCost = 25
packingSuppliesCost = 5
shippedOtherCost = 0
shippedTimeHours = 3
```

Expected important results:

```text
sharedCosts = 15

local.itemRevenue = 220
local.grossBuyerPayment = 220
local.nonPurchaseCosts = 25
local.totalInvestmentAtAsk = 125
local.profitAtAsk = 95
local.roiPercent = 76
local.hourlyProfit = 47.5
local.maximumBuyPrice = 151
local.status = buy-at-ask

shipped.itemRevenue = 234
shipped.grossBuyerPayment = 254
shipped.sellingFees = 30.4
shipped.nonPurchaseCosts = 75.4
shipped.totalInvestmentAtAsk = 175.4
shipped.profitAtAsk = 78.6
shipped.roiPercent approximately 44.8118586
shipped.hourlyProfit = 26.2
shipped.maximumBuyPrice approximately 127.8
shipped.status = buy-at-ask

overallDecision = buy-at-ask
recommendedSaleMethod = local
overallMaximumBuyPrice = 151
profitDifferenceShippedMinusLocal = -16.4
hourlyProfitDifferenceShippedMinusLocal = -21.3
```

### Test 2: shipped is the recommended buy-at-ask option

```text
askingPrice = 100
acquisitionTravelCost = 5
preparationCost = 5
otherSharedCost = 0
desiredMinimumProfit = 40
minimumRoiPercent = 25

expectedLocalSalePrice = 180
localNegotiationDiscountPercent = 0
localDeliveryCost = 10
localOtherCost = 0
localTimeHours = 1

expectedShippedSalePrice = 260
shippedNegotiationDiscountPercent = 0
platformFeePercent = 12
fixedSellingFees = 3
shippingPaidByBuyer = 20
actualShippingCost = 25
packingSuppliesCost = 5
shippedOtherCost = 0
shippedTimeHours = 2
```

Expected important results:

```text
sharedCosts = 10

local.profitAtAsk = 60
local.roiPercent = 50
local.maximumBuyPrice = 120
local.status = buy-at-ask

shipped.itemRevenue = 260
shipped.grossBuyerPayment = 280
shipped.sellingFees = 36.6
shipped.nonPurchaseCosts = 76.6
shipped.totalInvestmentAtAsk = 176.6
shipped.profitAtAsk = 103.4
shipped.roiPercent approximately 58.5503964
shipped.hourlyProfit = 51.7
shipped.maximumBuyPrice = 147.4
shipped.status = buy-at-ask

overallDecision = buy-at-ask
recommendedSaleMethod = shipped
overallMaximumBuyPrice = 147.4
profitDifferenceShippedMinusLocal = 43.4
hourlyProfitDifferenceShippedMinusLocal = -8.3
```

### Test 3: both require negotiation, shipped is recommended

Use Test 2 values but set `askingPrice = 200`.

Expected important results:

```text
local.profitAtAsk = -40
local.maximumBuyPrice = 120
local.status = negotiate

shipped.profitAtAsk approximately 3.4
shipped.roiPercent approximately 1.2292119
shipped.maximumBuyPrice = 147.4
shipped.status = negotiate

overallDecision = negotiate
recommendedSaleMethod = shipped
overallMaximumBuyPrice = 147.4
```

### Test 4: both pass

Create a case where both options have no revenue or negative raw maximum buy prices.

Expected:

```text
overallDecision = pass
recommendedSaleMethod = null
```

### Test 5: validation

Verify field-specific errors for:

- negative asking price
- local discount over 100
- shipped discount over 100
- platform fee equal to 100
- `NaN`
- `Infinity`
- non-numeric input

### Test 6: zero investment and zero time

Verify ROI is `null` for an option with zero investment and hourly profit is `null` for an option with zero time. Verify `hourlyProfitDifferenceShippedMinusLocal` is `null` when either option's hourly result is unavailable.

### Test 7: recommendation tie-breaking

Verify:

- profit ties use higher ROI
- remaining ties use higher hourly profit when both are available
- remaining ties use fixed order `local`, `shipped`
- negotiate maximum-buy-price ties use fixed order `local`, `shipped`

## UI requirements

- Mobile-first and fully usable at 320px width.
- Reuse the existing app shell and visual system.
- Group inputs into Shared Deal Assumptions, Local Sale, and Shipped Sale.
- Clearly state that every price, fee, discount, shipping amount, and cost is supplied by the user.
- Show overall decision, recommended method, and overall maximum buy price first.
- Show two clearly separated result cards for Local and Shipped.
- Each result card must prominently show status, profit, ROI, hourly profit, and maximum buy price.
- Show the profit difference and hourly-profit difference.
- Display field-specific errors.
- Provide Calculate and Reset buttons.
- Do not rely on color alone.
- Preserve keyboard accessibility and visible focus.
- Do not add platform presets, marketplace integrations, shipping-rate lookup, return-risk estimates, market-price lookup, persistence, history, export, authentication, backend, analytics, payments, ads, or unrelated dependencies.

## Acceptance criteria

- All formulas are pure TypeScript functions under `src/calculators/`.
- Shared sale-option calculation logic is reused where practical without changing formulas.
- React components do not duplicate formulas.
- Required and edge-case tests pass.
- Existing Chainsaw, Phone, and Power Tool tests continue to pass.
- Lint passes.
- Production build passes.
- Documentation matches implementation.
- No unrelated redesign or calculator is introduced.
