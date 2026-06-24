# Phone Flip Calculator v1

Source: GitHub Issue #4, `Gitterest/flipcalc`

Supersedes closed Issue #3 because its Test 2 expected success/failure scenario profits and ROI were arithmetically incorrect.

## Goal

Implement a mobile-first **Phone Flip Calculator** that helps a reseller evaluate a used, damaged, locked, or repairable phone using user-supplied resale values, repair costs, and repair-success assumptions.

The calculator must never invent market values, repair odds, carrier deductions, model values, or condition deductions.

## Required workflow

1. Read `AGENTS.md` and all files in `docs/`.
2. Create `docs/calculators/PHONE_FLIP.md` containing this specification.
3. Implement pure TypeScript calculation and validation functions first.
4. Add complete Vitest coverage.
5. Build the route and UI only after calculation tests pass.
6. Run lint, tests, and production build before completion.

## Route

`/calculators/phone-flip`

Update the existing Phone Flip catalog card to `available` and make it navigate to this route. Other calculator cards remain unchanged.

## Inputs

All money values are numeric USD amounts and default to `0`.

- `askingPrice`: seller's current asking price; minimum 0
- `expectedWorkingSalePrice`: expected final item price if the repair succeeds; minimum 0
- `expectedFailureRecoveryValue`: expected as-is or parts recovery value if the repair fails; minimum 0
- `repairSuccessPercent`: user-supplied chance of repair success; 0 through 100
- `negotiationDiscountPercent`: expected buyer discount from both success and failure resale values; 0 through 100
- `platformFeePercent`: selling fee applied to item revenue plus shipping charged to buyer; 0 through less than 100
- `fixedSellingFees`: fixed transaction or promotion fees; minimum 0
- `shippingPaidByBuyer`: shipping amount collected from the buyer; minimum 0
- `actualShippingCost`: actual shipping expense; minimum 0
- `screenRepairCost`: screen or display repair expense; minimum 0
- `batteryRepairCost`: battery repair expense; minimum 0
- `backGlassRepairCost`: back-glass or housing repair expense; minimum 0
- `cameraOtherRepairCost`: camera, port, button, board, or other repair expense; minimum 0
- `diagnosticUnlockCost`: diagnostic, carrier-unlock, or service expense; minimum 0
- `cleaningSuppliesCost`: cleaning and consumable expense; minimum 0
- `travelCost`: pickup or delivery expense; minimum 0
- `otherCost`: other direct expense; minimum 0
- `desiredMinimumProfit`: user's required expected dollar profit; minimum 0
- `minimumRoiPercent`: user's required expected ROI percentage; minimum 0
- `timeHours`: total expected labor, listing, travel, and delivery time; minimum 0

## Exact formulas

```text
repairSuccessRate = repairSuccessPercent / 100
discountRate = negotiationDiscountPercent / 100
feeRate = platformFeePercent / 100
minimumRoiRate = minimumRoiPercent / 100

repairCosts =
  screenRepairCost +
  batteryRepairCost +
  backGlassRepairCost +
  cameraOtherRepairCost +
  diagnosticUnlockCost

preparationCosts =
  repairCosts +
  cleaningSuppliesCost +
  travelCost +
  otherCost

discountedWorkingRevenue =
  expectedWorkingSalePrice * (1 - discountRate)

discountedFailureRevenue =
  expectedFailureRecoveryValue * (1 - discountRate)

expectedItemSaleRevenue =
  discountedWorkingRevenue * repairSuccessRate +
  discountedFailureRevenue * (1 - repairSuccessRate)

grossBuyerPayment =
  expectedItemSaleRevenue + shippingPaidByBuyer

percentageSellingFee = grossBuyerPayment * feeRate

sellingFees = percentageSellingFee + fixedSellingFees

nonPurchaseCosts =
  sellingFees +
  actualShippingCost +
  preparationCosts

totalInvestmentAtAsk = askingPrice + nonPurchaseCosts

expectedProfitAtAsk =
  grossBuyerPayment - totalInvestmentAtAsk

expectedRoiPercent =
  totalInvestmentAtAsk > 0
    ? (expectedProfitAtAsk / totalInvestmentAtAsk) * 100
    : null

expectedHourlyProfit =
  timeHours > 0
    ? expectedProfitAtAsk / timeHours
    : null

successGrossBuyerPayment =
  discountedWorkingRevenue + shippingPaidByBuyer

failureGrossBuyerPayment =
  discountedFailureRevenue + shippingPaidByBuyer

successSellingFees =
  successGrossBuyerPayment * feeRate + fixedSellingFees

failureSellingFees =
  failureGrossBuyerPayment * feeRate + fixedSellingFees

successProfitAtAsk =
  successGrossBuyerPayment -
  (
    askingPrice +
    successSellingFees +
    actualShippingCost +
    preparationCosts
  )

failureProfitAtAsk =
  failureGrossBuyerPayment -
  (
    askingPrice +
    failureSellingFees +
    actualShippingCost +
    preparationCosts
  )

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
    preparationCosts
  ) / (1 - feeRate)
```

Do not round intermediate calculations. Round only formatted display values to two decimal places.

## Decision status

Use only:

- `buy-at-ask`
- `negotiate`
- `pass`

Rules, in order:

1. `pass` when `grossBuyerPayment <= 0`.
2. `pass` when `rawMaximumBuyPrice < 0`.
3. `buy-at-ask` when `askingPrice <= maximumBuyPrice`.
4. Otherwise `negotiate`.

Display meanings:

- `buy-at-ask`: The current asking price meets both the user's expected minimum profit and expected minimum ROI targets.
- `negotiate`: The asking price is too high under the entered repair-risk assumptions.
- `pass`: The entered assumptions cannot meet the user's targets even at a zero-dollar purchase price, or there is no expected revenue.

No hidden scoring, model lookup, carrier-lock deduction, condition deduction, repair probability, or automatic market value is allowed.

## Required outputs

- Total repair costs
- Total preparation costs
- Discounted working revenue
- Discounted failure recovery revenue
- Expected item sale revenue
- Gross buyer payment
- Percentage selling fee
- Total selling fees
- Non-purchase costs
- Total investment at asking price
- Expected profit at asking price
- Expected ROI or `Not available`
- Expected hourly profit or `Not available`
- Success-case profit at asking price
- Failure-case profit at asking price
- Profit-limited maximum buy price
- ROI-limited maximum buy price
- Final maximum buy price
- Amount below or above maximum buy price
- Break-even gross buyer payment
- Decision status and explanation

## Validation

Return field-specific validation errors.

- Reject non-numeric values, `NaN`, and `Infinity`.
- Reject negative values for every field.
- Reject repair success below 0 or above 100.
- Reject negotiation discount below 0 or above 100.
- Reject platform fee below 0 or greater than or equal to 100.
- Allow minimum ROI above 100.
- Allow zero time and return `null` expected hourly profit.
- Do not silently clamp invalid input.
- Do not calculate until validation succeeds.

## Required tests

Use approximate floating-point assertions where appropriate.

### Test 1: repair-risk deal that is buyable at ask

```text
askingPrice = 100
expectedWorkingSalePrice = 250
expectedFailureRecoveryValue = 80
repairSuccessPercent = 80
negotiationDiscountPercent = 0
platformFeePercent = 0
fixedSellingFees = 0
shippingPaidByBuyer = 0
actualShippingCost = 0
screenRepairCost = 40
batteryRepairCost = 0
backGlassRepairCost = 0
cameraOtherRepairCost = 0
diagnosticUnlockCost = 10
cleaningSuppliesCost = 5
travelCost = 5
otherCost = 0
desiredMinimumProfit = 40
minimumRoiPercent = 25
timeHours = 2
```

Expected:

```text
repairCosts = 50
preparationCosts = 60
discountedWorkingRevenue = 250
discountedFailureRevenue = 80
expectedItemSaleRevenue = 216
grossBuyerPayment = 216
nonPurchaseCosts = 60
totalInvestmentAtAsk = 160
expectedProfitAtAsk = 56
expectedRoiPercent = 35
expectedHourlyProfit = 28
successProfitAtAsk = 90
failureProfitAtAsk = -80
profitLimitedMaxBuyPrice = 116
roiLimitedMaxBuyPrice = 112.8
maximumBuyPrice = 112.8
status = buy-at-ask
```

### Test 2: shipped phone requiring negotiation

```text
askingPrice = 80
expectedWorkingSalePrice = 350
expectedFailureRecoveryValue = 120
repairSuccessPercent = 70
negotiationDiscountPercent = 10
platformFeePercent = 12
fixedSellingFees = 3
shippingPaidByBuyer = 15
actualShippingCost = 20
screenRepairCost = 50
batteryRepairCost = 20
backGlassRepairCost = 0
cameraOtherRepairCost = 0
diagnosticUnlockCost = 10
cleaningSuppliesCost = 5
travelCost = 0
otherCost = 5
desiredMinimumProfit = 50
minimumRoiPercent = 30
timeHours = 3
```

Expected:

```text
repairCosts = 80
preparationCosts = 90
discountedWorkingRevenue = 315
discountedFailureRevenue = 108
expectedItemSaleRevenue = 252.9
grossBuyerPayment = 267.9
percentageSellingFee = 32.148
sellingFees = 35.148
nonPurchaseCosts = 145.148
totalInvestmentAtAsk = 225.148
expectedProfitAtAsk = 42.752
expectedRoiPercent approximately 18.9883987
expectedHourlyProfit approximately 14.2506667
successProfitAtAsk = 97.4
failureProfitAtAsk = -84.76
profitLimitedMaxBuyPrice = 72.752
roiLimitedMaxBuyPrice approximately 60.9289231
maximumBuyPrice approximately 60.9289231
status = negotiate
```

### Test 3: impossible deal

```text
askingPrice = 0
expectedWorkingSalePrice = 50
expectedFailureRecoveryValue = 10
repairSuccessPercent = 50
all percentages besides repairSuccessPercent = 0
screenRepairCost = 40
all other costs = 0
desiredMinimumProfit = 20
minimumRoiPercent = 0
timeHours = 0
```

Expected:

```text
expectedItemSaleRevenue = 30
nonPurchaseCosts = 40
rawMaximumBuyPrice = -30
maximumBuyPrice = 0
expectedHourlyProfit = null
status = pass
```

### Test 4: 100 percent repair success

Verify expected item sale revenue equals discounted working revenue and the failure recovery value does not affect the expected result.

### Test 5: zero percent repair success

Verify expected item sale revenue equals discounted failure recovery revenue and the working sale value does not affect the expected result.

### Test 6: validation

Verify field-specific errors for:

- negative asking price
- repair success over 100
- negotiation discount over 100
- platform fee equal to 100
- `NaN`
- `Infinity`

### Test 7: zero investment

Verify expected ROI is `null` when asking price and all non-purchase costs are zero.

## UI requirements

- Mobile-first and fully usable at 320px width.
- Reuse the current app shell and design direction.
- Group inputs into: Deal, Resale Outcomes, Repair Risk, Selling Costs, Repair and Preparation Costs, and Targets.
- Use visible labels and short helper text.
- Use numeric mobile input modes.
- Display field-level validation errors.
- Provide Calculate and Reset buttons.
- Put decision status, maximum buy price, expected profit, expected ROI, success-case profit, and failure-case profit near the top of results.
- Clearly state that FlipCalc does not determine phone value or repair probability; the user supplies both.
- Explain expected value in plain language near the repair-success input.
- Do not rely on color alone for status.
- Do not add model databases, carrier lookup, IMEI lookup, persistence, history, export, authentication, backend services, analytics, payments, ads, or unrelated dependencies.

## Acceptance criteria

- Exact formulas are isolated in pure TypeScript functions under `src/calculators/`.
- UI contains no duplicated business formulas.
- Required and edge-case tests pass.
- Existing tests continue to pass.
- Lint passes.
- Production build passes.
- Documentation matches implementation.
- No unrelated calculator or redesign is introduced.
