# Dashboard Pie Size & Alignment Patch

## Scope
- Dashboard UI only.
- No database changes.
- No changes to action save/edit logic.

## Changes
- Increased the doughnut/pie visual size for Owner workload and Responsible departments.
- Enlarged the color legend dots and legend font for better readability.
- Rebalanced the Owner workload and Responsible departments cards so the pie chart is the primary visual element.
- Aligned pie charts to the top of their cards instead of visually centering them in the middle.
- Applied the same top-alignment behavior to other dashboard doughnut cards for consistent layout.

## Verification
- `npm run build` completed successfully.
- Vite bundle-size warning only; no TypeScript or build errors.
