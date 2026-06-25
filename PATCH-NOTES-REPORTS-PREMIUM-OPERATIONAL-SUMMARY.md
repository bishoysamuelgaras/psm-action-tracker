# Patch Notes — Premium Operational Summary Report

## Scope
- Premium Operational Summary section styling.
- Premium printable Operational Actions Report.
- First-page report charts before the action register.
- Closed-only KPI philosophy and incident count card.

## Changes
- Added reusable `OperationalSummaryVisuals` component for the screen report section and printable report.
- Added first-page charts in the printed report:
  - Action lifecycle
  - Priority distribution
  - Owner workload
  - Responsible departments
- The action register now starts from page 2 in print/PDF.
- Replaced `Closed / verified` display with `Closed` only.
- Progress now follows closed-only philosophy: `Closed actions / Total actions × 100`.
- Added `Incidents` KPI using unique incident source count.
- Improved filter display using clean premium chips.
- Set the print document title to avoid strange browser/app labels such as `Home` in the report header.
- Kept existing sorting, filters, CSV, and print behavior.

## Build
- `npm run build` passed.
