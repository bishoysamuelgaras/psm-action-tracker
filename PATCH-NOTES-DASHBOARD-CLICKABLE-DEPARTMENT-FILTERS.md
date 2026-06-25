# Dashboard clickable responsible department filters

## What changed
- Responsible department cards in the Dashboard are now clickable.
- Clicking a department card opens `/actions` with the department filter already applied.
- The Actions page now reads URL filters, keeps the Add New Action form collapsed, and shows the filtered register immediately.
- Responsible filter now supports real department filtering by department id, not only manual responsible text.
- Department filtering now includes:
  - Actions assigned to a person whose profile belongs to the department.
  - Actions assigned manually to a department name.
- The selected department appears as an active filter badge above the action register.

## Files changed
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/actions/pages/ActionsPage.tsx`
- `src/features/actions/components/ActionFilters.tsx`
- `src/features/actions/api/actions.api.ts`

## Build
- `npm run build` completed successfully.
- Vite reported only the standard bundle-size warning.
