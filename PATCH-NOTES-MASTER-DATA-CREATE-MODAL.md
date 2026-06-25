# Master Data Create Modal Fix

## Scope
- File changed: `src/features/master-data/pages/MasterDataPage.tsx`

## What changed
- `New Department` / `New row` now opens a pop-up modal instead of using the right-side edit panel.
- Create state is fully separated from edit state.
- Clicking `New Department` clears the edit selection and opens a clean create form.
- Saving from the modal sends `mode: "create"` only.
- Editing existing rows still uses the side panel and sends `mode: "update"` only.
- Escape key and backdrop click close the modal when not saving.

## Build
- `npm run build` completed successfully.
- Vite bundle-size warning only.
