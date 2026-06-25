# Reports patch - A4 Portrait Operational Summary

## Scope
Operational Summary screen and exported/printed Operational Actions Report.

## Changes
- Forced the Operational Actions Report print layout to A4 portrait.
- Reworked the first report page so the executive summary, filters, KPI cards, and four dashboard-equivalent charts stay together before the register.
- The Action Register starts from page 2.
- Added print break controls so KPI cards, chart cards, and table rows are not split between pages where possible.
- Moved the Incidents KPI card to be the first card.
- Aligned report chart colors and values with the Dashboard philosophy:
  - Action lifecycle: active/open versus closed actions.
  - Priority distribution: dashboard priority colors by priority code.
  - Owner workload: open action ownership split.
  - Responsible departments: total action distribution with closed/total helper.
- Kept Progress calculated as Closed actions / Total actions × 100.

## Validation
- npm install was run with --ignore-scripts to avoid optional native model downloads in this environment.
- npm run build completed successfully.
