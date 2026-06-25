# Reports filtered actions print + sidebar hover collapse

## What changed

- Fixed Operational Summary filtering flow by keeping the snapshot query and printable report query tied to the same `ReportsFilters` state.
- Added a printable **Operational Actions Report** that uses the current Operational Summary filters.
- The filtered report includes:
  - Applied filters
  - KPI totals
  - Action register summary
  - Source / recommendation grouping
  - Action details
  - Updates
  - Attachments
  - Extension requests
- Added a print mode for the filtered actions report without changing the existing Source Full Report.
- Updated the desktop sidebar to be collapsed by default and expand on mouse hover.
- Increased the main content max width to use the gained space from the collapsed sidebar.

## Safety notes

- No database schema changes.
- No Supabase write logic changes.
- Existing Source Full Report remains available.
- Existing mobile navigation remains unchanged.

## Build

`npm run build` completed successfully.
Only the Vite bundle size warning appeared.
