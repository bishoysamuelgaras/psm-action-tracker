# Patch Notes — Master Data Create/Edit Safety Fix

## Problem fixed
When adding a new department from Master Data, the form could still carry the previous editing row identity, so saving could update an existing department instead of inserting a new row.

## What changed
- Added an explicit `mode: "create" | "update"` to Master Data saving.
- Create mode now always performs `insert` and never updates an existing row.
- Update mode now only updates after clicking an existing row's Edit button.
- After Save/Delete, the form resets safely to create mode.
- Added clearer form messages: Create vs Editing.
- Added a friendly duplicate code/name error message.

## Files changed
- `src/features/master-data/api/masterData.api.ts`
- `src/features/master-data/pages/MasterDataPage.tsx`

## Build
`npm run build` completed successfully.
