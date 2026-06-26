# General Flip Decision Calculator v1

Source of truth: GitHub Issue #11, Build General Flip Decision Calculator v1.

## Goal

Build a mobile-first general flip calculator that determines buy-at-ask, negotiate, or pass from user-entered acquisition, resale, fee, shipping, cost, time, profit, and ROI assumptions. Never invent market values or fees.

## Route

`/calculators/general-flip`

## Inputs

All numeric, default 0: `askingPrice`, `expectedSalePrice`, `negotiationDiscountPercent` (0-100), `sellingFeePercent` (0-<100), `fixedSellingFees`, `shippingPaidByBuyer`, `actualShippingCost`, `acquisitionTravelCost`, `preparationCost`, `repairCost`, `packingSuppliesCost`, `otherCost`, `timeHours`, `desiredMinimumProfit`, `minimumRoiPercent` (allow >100).

## Exact formulas

`discountRate = negotiationDiscountPercent / 100`
`feeRate = sellingFeePercent / 100`
`minimumRoiRate = minimumRoiPercent / 100`
`itemRevenue = expectedSalePrice * (1 - discountRate)`
`grossBuyerPayment = itemRevenue + shippingPaidByBuyer`
`percentageSellingFee = grossBuyerPayment * feeRate`
`sellingFees = percentageSellingFee + fixedSellingFees`
`nonPurchaseCosts = acquisitionTravelCost + preparationCost + repairCost + packingSuppliesCost + actualShippingCost + otherCost + sellingFees`
`totalInvestmentAtAsk = askingPrice + nonPurchaseCosts`
`profitAtAsk = grossBuyerPayment - totalInvestmentAtAsk`
`roiPercent = totalInvestmentAtAsk > 0 ? profitAtAsk / totalInvestmentAtAsk * 100 : null`
`hourlyProfit = timeHours > 0 ? profitAtAsk / timeHours : null`
`profitLimitedMaxBuyPrice = grossBuyerPayment - nonPurchaseCosts - desiredMinimumProfit`
`roiLimitedMaxBuyPrice = grossBuyerPayment / (1 + minimumRoiRate) - nonPurchaseCosts`
`rawMaximumBuyPrice = min(profitLimitedMaxBuyPrice, roiLimitedMaxBuyPrice)`
`maximumBuyPrice = max(0, rawMaximumBuyPrice)`
`amountBelowMaximum = maximumBuyPrice - askingPrice`
`breakEvenBuyPrice = max(0, grossBuyerPayment - nonPurchaseCosts)`

Do not round intermediate values. Display currency and percentages to two decimals.

## Decision

Use only `buy-at-ask`, `negotiate`, `pass`.

1. `pass` if grossBuyerPayment <= 0.
2. `pass` if rawMaximumBuyPrice < 0.
3. `buy-at-ask` if askingPrice <= maximumBuyPrice.
4. Otherwise `negotiate`.

Return all formula outputs plus `decision`.

## Validation

Field-specific errors. Reject non-numeric strings, NaN, Infinity, and negatives. Discount must be 0-100. Selling fee must be 0-<100. Minimum ROI may exceed 100. Zero time returns null hourly profit. Do not silently clamp invalid input or calculate before validation succeeds.

## UI

Reuse existing shell and visual system. State that all values are supplied by the user. Show decision, maximum buy price, profit, ROI, and hourly profit first. Then show revenue, fees, total investment, break-even buy price, and amount below maximum. Provide Calculate and Reset. Mobile usable at 320px; accessible focus and labels; do not rely on color alone. No presets, APIs, market lookup, persistence, history, export, authentication, backend, analytics, payments, ads, or unrelated dependencies.

## Tests

Cover: buy-at-ask; negotiate; pass for zero revenue; pass for negative raw maximum; shipping collected and fee basis; discount; desired-profit limit; ROI limit; zero investment/time null behavior; validation for negative, >100 discount, fee=100, NaN, Infinity, non-numeric; existing calculator tests remain passing.

## Acceptance

Pure strict TypeScript calculations under `src/calculators/`; docs file `docs/calculators/GENERAL_FLIP.md`; complete Vitest coverage; route and catalog card enabled; no duplicated formulas in React; lint, all tests, and production build pass; no unrelated changes.
