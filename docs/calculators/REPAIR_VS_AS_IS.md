# Build Repair vs Sell As-Is Calculator v1

## Goal

Build a mobile-first calculator comparing selling an item as-is versus repairing it before sale. Use only user-supplied assumptions.

## Route

`/calculators/repair-vs-as-is`

## Inputs

All numeric, default 0.

Shared: `askingPrice`, `acquisitionTravelCost`, `otherSharedCost`, `desiredMinimumProfit`, `minimumRoiPercent`.

As-is: `asIsSalePrice`, `asIsNegotiationDiscountPercent` (0-100), `asIsSellingFeePercent` (0-<100), `asIsFixedFees`, `asIsShippingCollected`, `asIsShippingCost`, `asIsOtherCost`, `asIsTimeHours`.

Repair: `repairedSalePrice`, `repairNegotiationDiscountPercent` (0-100), `repairCost`, `repairSuppliesCost`, `repairFailureRiskPercent` (0-100), `repairSellingFeePercent` (0-<100), `repairFixedFees`, `repairShippingCollected`, `repairShippingCost`, `repairOtherCost`, `repairTimeHours`.

## Formulas

`sharedCosts = acquisitionTravelCost + otherSharedCost`

For either option:

`itemRevenue = salePrice * (1 - discountPercent/100)`

`grossBuyerPayment = itemRevenue + shippingCollected`

`percentageSellingFee = grossBuyerPayment * feePercent/100`

`sellingFees = percentageSellingFee + fixedFees`

As-is:

`nonPurchaseCosts = sharedCosts + sellingFees + shippingCost + otherCost`

`totalInvestmentAtAsk = askingPrice + nonPurchaseCosts`

`profitAtAsk = grossBuyerPayment - totalInvestmentAtAsk`

Repair expected-value treatment:

`repairSuccessRate = 1 - repairFailureRiskPercent/100`

`expectedGrossBuyerPayment = grossBuyerPayment * repairSuccessRate`

`nonPurchaseCosts = sharedCosts + repairCost + repairSuppliesCost + sellingFees + shippingCost + repairOtherCost`

`totalInvestmentAtAsk = askingPrice + nonPurchaseCosts`

`profitAtAsk = expectedGrossBuyerPayment - totalInvestmentAtAsk`

For both options:

`roiPercent = totalInvestmentAtAsk > 0 ? profitAtAsk / totalInvestmentAtAsk * 100 : null`

`hourlyProfit = timeHours > 0 ? profitAtAsk / timeHours : null`

`profitLimitedMaxBuyPrice = effectiveGrossBuyerPayment - nonPurchaseCosts - desiredMinimumProfit`

`roiLimitedMaxBuyPrice = effectiveGrossBuyerPayment / (1 + minimumRoiPercent/100) - nonPurchaseCosts`

`rawMaximumBuyPrice = min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)`

`maximumBuyPrice = max(0, rawMaximumBuyPrice)`

`amountBelowMaximum = maximumBuyPrice - askingPrice`

Use grossBuyerPayment for as-is effective gross; expectedGrossBuyerPayment for repair.

## Status

Per option: `pass` if effective gross <= 0 or rawMaximumBuyPrice < 0; `buy-at-ask` if askingPrice <= maximumBuyPrice; else `negotiate`.

## Recommendation

Return `overallDecision`, `recommendedMethod` (`as-is`, `repair`, or null), `overallMaximumBuyPrice`, `profitDifferenceRepairMinusAsIs`, `hourlyProfitDifferenceRepairMinusAsIs`.

If one or both buy-at-ask, choose higher profit; tie by higher ROI; then higher hourly profit when both available; then fixed order as-is, repair. If neither buys but one or both negotiate, choose higher maximum buy price; tie fixed order as-is, repair. If both pass, recommend null.

## Validation

Field-specific errors. Reject non-numeric, NaN, Infinity, negatives. Discount/risk 0-100. Fee 0-<100. Allow ROI >100 and zero hours. No silent clamping.

## UI

Reuse existing shell and calculator patterns. Show decision first, then separate As-Is and Repair cards with status, profit, ROI, hourly profit, maximum buy price. Clearly state repair result uses user-entered repair failure risk. Calculate and Reset buttons. Mobile usable at 320px. No presets, APIs, persistence, analytics, backend, or unrelated features.

## Tests

Cover: as-is wins; repair wins; negotiate; both pass; validation; zero investment/time; failure risk 0 and 100; tie-breaking; existing tests remain passing.

## Acceptance

Pure TypeScript formulas under `src/calculators/`, complete Vitest coverage, docs file `docs/calculators/REPAIR_VS_AS_IS.md`, catalog card enabled, lint/tests/build pass.
