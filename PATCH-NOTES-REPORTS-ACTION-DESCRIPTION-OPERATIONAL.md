# Reports Operational Summary - Action Description Display

## What changed

- Operational Summary table now displays the **Action Description** under each action number instead of the action title.
- The printable **Operational Actions Report** now displays the **Action Description** in the first column.
- CSV export now includes `action_description` as the primary action text while keeping `action_title` for reference.
- If an action has no description, the UI falls back safely to the action title, then `—`.

## Scope

- No database changes.
- No Supabase logic changes.
- No filter logic changes.
- No source/recommendation/action saving logic changes.

## Validation

- `npm run build` completed successfully.
- Vite showed only the usual large bundle warning.
