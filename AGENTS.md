# Codex Repository Instructions

## Product

FlipCalc is a mobile-first browser and Android-installable PWA containing niche buying, selling, repair, and profit calculators for resellers.

## Required workflow

1. Read this file and the relevant documents in `docs/` before changing code.
2. Inspect existing code before implementing anything.
3. Preserve working behavior unless the task explicitly requests a change.
4. Do not invent formulas, thresholds, deductions, market values, or business rules.
5. Put calculation logic in pure TypeScript functions under `src/calculators/`.
6. Add or update Vitest tests for every formula and decision rule.
7. Keep UI components separate from calculation logic.
8. Validate all numeric input. Never allow `NaN`, `Infinity`, or negative values where they are invalid.
9. Run `npm run lint`, `npm run test`, and `npm run build` before finishing.
10. Report exactly what changed, tests run, and any unresolved issue.

## Architecture

- `src/calculators/`: pure calculation logic, schemas, tests
- `src/components/`: reusable visual components
- `src/pages/`: route-level screens
- `src/types/`: shared TypeScript types
- `src/storage/`: browser storage helpers
- `docs/`: product specifications, formulas, design rules

## Coding rules

- TypeScript strict mode stays enabled.
- Avoid `any`.
- Prefer named exports.
- Functions should be small, deterministic, and testable.
- Money is represented as numbers rounded for display only unless a specification says otherwise.
- Never mix display-formatted currency strings into calculation functions.
- Accessibility is required: labels, keyboard operation, visible focus, and readable errors.
- The app must remain mobile-first and usable at 320px width.
- Do not add external dependencies unless they are necessary and explained.
- Do not add authentication, a backend, analytics, advertisements, payments, or cloud storage unless explicitly requested.

## Definition of done

A task is complete only when:

- Requirements are implemented.
- Formula tests cover normal and edge cases.
- No existing tests fail.
- Lint passes.
- Production build passes.
- Documentation is updated when behavior changes.
