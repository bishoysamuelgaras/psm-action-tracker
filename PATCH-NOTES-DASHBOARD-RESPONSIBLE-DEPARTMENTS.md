# Dashboard Responsible Departments Update

## Scope
This patch updates the Dashboard department card only.

## What changed
- Replaced the old source-based Department Snapshot logic with action-responsibility-based department aggregation.
- The Dashboard now groups actions by the department responsible for the action.
- For actions assigned to a user, the user's profile department is used.
- For actions assigned manually to a department name, the department name is matched against the active departments list.
- The card now shows:
  - Total actions
  - Closed/finalized actions
  - Still-open actions
  - Overdue actions when available
  - Closure percentage
- Removed the previous `slice(0, 8)` limit so all responsible departments can appear.

## Preserved behavior
- No database schema change.
- No Supabase migration required.
- No change to save/edit/delete logic.
- No change to Actions page filters.
