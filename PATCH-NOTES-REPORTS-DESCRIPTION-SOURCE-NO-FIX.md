# Reports description + source number safety fix

## What changed

- Added each action description inside the Operational Actions print report.
- Added fallback display for source numbers: if `source_no` is accidentally blank, the UI can display `reference_no` instead of showing an empty value.
- Fixed Sources update logic so editing a source no longer sends `source_no: ""`, which was the reason a manually corrected source number could disappear.
- Added a database safety migration: `supabase/sql/019_source_number_display_and_repair.sql`.

## Important SQL

Run `supabase/sql/019_source_number_display_and_repair.sql` once in Supabase SQL Editor to:

1. Prevent future updates from clearing `source_no` at DB level.
2. Repair the single blank Incident Investigation source to `INC-2026-001` only if there is exactly one blank incident source and the number is not already used.

## Files changed

- `src/lib/source-display.ts`
- `src/features/sources/api/sources.api.ts`
- `src/features/sources/hooks/useSources.ts`
- `src/features/actions/api/actions.api.ts`
- `src/features/recommendations/api/recommendations.api.ts`
- `src/features/reports/api/reports.api.ts`
- `src/features/reports/pages/ReportsPage.tsx`
- `src/features/reports/components/FilteredActionsReport.tsx`
- `src/styles/globals.css`
- `supabase/sql/019_source_number_display_and_repair.sql`
