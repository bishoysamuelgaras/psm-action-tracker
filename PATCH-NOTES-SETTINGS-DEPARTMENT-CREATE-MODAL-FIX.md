# Settings Department Create Modal Fix

This patch fixes the `New department` button in Users & Access / Settings.

## What changed
- `New department` now opens a dedicated pop-up modal.
- Create and edit flows are fully separated.
- Creating a department sends `mode: "create"` and never reuses the selected department id.
- Editing a department sends `mode: "update"` only from the existing edit panel.
- The old issue where clearing the selected department was immediately overwritten by the auto-select effect is avoided.
- Build verified successfully with `npm run build`.

## Files changed
- `src/features/settings/pages/SettingsPage.tsx`
