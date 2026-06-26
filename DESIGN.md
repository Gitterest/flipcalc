# FlipCalc Design System

## Signal / Control / Profit

FlipCalc is a reseller Deal Command System. The product starts from uncertainty, gives the user control through their own assumptions, reveals a decisive result, shows tension against their targets, and resolves with FlipCalc Pro as the complete specialized decision suite.

## Product Personality

- Precise, serious, fast, and money-focused.
- Proprietary without pretending to use hidden market data.
- Confident, restrained, and useful before it asks for payment.
- Built for mobile deal checks at the moment of purchase.

## Ethical Conversion Principles

- Demonstrate value with complete free General Flip results.
- Keep formulas transparent and assumption-driven.
- Present Pro as a clearer next decision path, not as a rescue from fabricated fear.
- Use examples only when they are clearly labeled as examples.
- Never claim profit guarantees or market certainty.

## Prohibited Dark Patterns

No fake urgency, fake scarcity, countdowns, fabricated testimonials, fake counters, fake crossed-out prices, unsupported savings, invented losses, hidden free results, forced signup for the free calculator, casino styling, manipulative motion, cursor traps, or deceptive locked-result previews.

## Color Tokens

- `--color-bg`: page background.
- `--color-bg-accent`: subtle banded background.
- `--color-surface`: primary elevated surface.
- `--color-surface-strong`: high-emphasis surface.
- `--color-border`: default border.
- `--color-border-strong`: structural border.
- `--color-text`: primary text.
- `--color-muted`: secondary text.
- `--color-profit`: electric lime for buy/profit/primary purchase actions.
- `--color-negotiate`: amber for negotiate/uncertainty.
- `--color-pass`: surgical red for pass/loss/errors.
- `--color-steel`: neutral operational information.

## Light Mode Tokens

Light mode uses warm neutral near-white backgrounds, crisp white surfaces, charcoal/navy text, graphite borders, and restrained lime/amber/red status accents. It must retain the command-system identity and not become generic white SaaS.

## Dark Mode Tokens

Dark mode uses ink black, deep graphite, controlled navy undertones, elevated neutral surfaces, high-contrast text, steel borders, and focused status accents.

## Typography

- Font stack: Inter, system UI, Segoe UI, sans-serif.
- Hero: 3.75rem desktop, 2.5rem mobile.
- Page title: 2.75rem desktop, 2rem mobile.
- Section title: 1.5rem.
- Body: 1rem with 1.6 line-height.
- Microcopy: 0.85rem.

## Numeric Styling

Money, ROI, hourly profit, and maximum buy price use tabular numerals. Currency uses strong weight and two decimal places in display. ROI always includes a percent sign with two decimals or `Not available`. Maximum buy price is the primary money metric and receives the strongest result hierarchy.

## Spacing

Use an 8px scale: `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `56`, `72`. Mobile spacing compresses but preserves clear grouping.

## Radius, Borders, Depth

- Buttons and inputs: 12px.
- Cards and panels: 18px.
- Large page sections: 24px.
- Borders use one-pixel steel lines.
- Depth is restrained: small shadows for cards, stronger shadows only for result/revelation panels.

## Grid And Layout

The app shell maxes at 1180px. Calculator pages use a form/results split on desktop and single column on mobile. Catalog grids collapse from three columns to two and one. All pages must remain usable at 320px with no horizontal scrolling.

## Motion

Motion reinforces cause and effect: subtle status reveal, hover depth, and result entry. No constant pulsing or shaking. `prefers-reduced-motion: reduce` disables transitions and animations.

## Navigation

Navigation contains brand, primary routes, pricing, and an accessible theme selector. Touch targets are at least 44px. Header remains compact on mobile.

## Buttons

- Primary: lime text on ink/graphite or lime fill where appropriate.
- Secondary: bordered steel.
- Disabled or unavailable actions must be visibly disabled and explained.

## Inputs And Field Groups

Inputs use visible labels, currency prefixes, percent/unit suffixes, concise helper text, and field-level errors. Field groups use staged headings such as Deal, Costs, Exit, and Decision where they improve scanning.

## Cards, Alerts, Tabs, Badges

Cards use direct headings and one clear purpose. Alerts include text labels, not color alone. Badges identify Free, Pro, Planned, Buy at ask, Negotiate, and Pass.

## Locked Pro States

Locked calculators remain visible and desirable, show a Pro badge, explain the decision they solve, and route to pricing. They must not expose the working form, fake calculations, blur fabricated results, or imply the user has already calculated anything.

## Result Hierarchy

Completed output is titled `Your Deal Analysis` and prioritizes:

1. Decision
2. Maximum Buy Price
3. Expected Profit
4. ROI
5. Hourly Profit when available

Detailed breakdown follows the summary.

## CTA Hierarchy

Primary CTA: run the free deal or get FlipCalc Pro. Secondary CTA: view Pro or return to the calculator catalog. Contextual Pro CTAs appear beneath completed free results, never before the promised free result.

## Homepage Persuasion Flow

1. Hero: maximum safe buy price before spending.
2. Clearly labeled example result preview.
3. The Cost of Guessing with labeled example scenarios.
4. Calculator catalog framed as deal questions.
5. Free versus Pro comparison.
6. FlipCalc Pro section as the complete reseller deal decision suite.
7. Trust section: user assumptions, transparent formulas, no invented market prices, estimates not guarantees.
8. Final CTA with one Pro CTA and one free calculator CTA.

## Calculator Page Structure

Every calculator page uses a compact title, plain-language question, user-supplied-data notice, grouped inputs, prominent Calculate, secondary Reset, result summary first, detailed breakdown second, and contextual Pro CTA after a completed free result where appropriate.

## Pricing Page Structure

Pricing is one clear Pro offer. It states the General Flip calculator is free, Pro unlocks specialized calculators, checkout is handled by Stripe in the monetization phase, and donations are separate from product purchase when added.

## Theme Behavior

Support `light`, `dark`, and `system`. First-time users default to system preference. Explicit selections persist in local storage and are never overwritten by system changes. Theme is applied before first paint where practical, updates `color-scheme`, and updates browser `theme-color`.

## Accessibility

All interactive controls need visible labels, keyboard operation, visible focus, accessible names, sufficient contrast, and 44px touch targets. Status must be communicated with text and structure, not color alone. Error summaries and field errors must be readable by assistive technology.
