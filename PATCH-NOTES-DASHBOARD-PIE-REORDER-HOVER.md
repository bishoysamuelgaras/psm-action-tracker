# Dashboard pie reorder and hover polish

## Scope
- Moved `Responsible departments` directly below `Action lifecycle` and `Priority distribution`.
- Moved `Intervention command matrix` to the bottom of the dashboard page.
- Increased main pie / doughnut chart size for `Owner workload` and `Responsible departments`.
- Increased legend font size and color-dot size.
- Added hover / focus interaction on doughnut chart segments:
  - Segment opacity changes dynamically.
  - Active segment becomes visually stronger.
  - Center label changes to the hovered segment value and label.
  - Tooltip shows segment name, count, and percentage.
  - Keyboard focus and Enter / Space navigation are supported for clickable segments.

## Build
- `npm run build` completed successfully.
- Only the standard Vite bundle-size warning appeared.
