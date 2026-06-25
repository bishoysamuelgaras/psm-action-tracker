# Dashboard Owner Workload Single Row

## Summary
- Moved **Owner workload** into its own full-width dashboard row.
- Kept the doughnut-first premium layout and preserved the existing dynamic hover/click behavior.
- Converted the owner compact workload rows into a responsive multi-column layout inside the full-width card.
- Kept **Urgent queue** as a separate full-width row so the Owner workload card is no longer sharing the same row.

## Files changed
- `src/features/dashboard/pages/DashboardPage.tsx`

## Notes
- No database schema changes.
- No Supabase logic changes.
- No routing or filtering behavior changes.
