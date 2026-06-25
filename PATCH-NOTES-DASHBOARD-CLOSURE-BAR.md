# Dashboard Responsible Departments Closure Bar Fix

## Scope
UI-only fix for the Dashboard `Responsible departments` card.

## What changed
- The progress/status bar now represents the closure rate: `closed actions / total actions`.
- The bar no longer compares each department's total action count against the department with the highest total.
- The bar color is green to reflect completion/closure progress.
- The label now displays `Closed X/Y · Z%` for clarity.
- Added tooltip/aria label: `Closed X of Y actions`.

## Files changed
- `src/features/dashboard/pages/DashboardPage.tsx`

## Notes
- No database changes.
- No Supabase logic changes.
- No action saving/filtering logic changes.
