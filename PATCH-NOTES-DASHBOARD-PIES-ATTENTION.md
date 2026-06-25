# Dashboard Pie Charts + Attention Filter Patch

## Scope
This patch updates the Dashboard only, with one supporting Actions filter change.

## Changes
- Renamed **Average progress** to **Progress**.
- Renamed **Active workload** to **Open actions**.
- Added an `attention` dashboard filter that opens actions matching any attention condition:
  - overdue open actions,
  - actions due in the next 7 days,
  - pending verification actions,
  - actions with pending extension approval.
- Added compact pie/doughnut visual summaries above:
  - Owner workload,
  - Responsible departments.
- Kept the existing workload/progress bars but made them more compact to avoid taking too much space.
- Kept all workload and department rows clickable.
- Kept the Supabase scheduled pulse function from the previous step:
  - `netlify/functions/supabase-pulse.js`
  - schedule: every 5 days at 07:00 UTC.

## Attention index formula
`Attention index = (overdue + due soon + pending extensions + pending verification) / total actions × 100`

It represents how much of the action register currently needs active follow-up or management attention.

## Netlify scheduled pulse notes
The function is already implemented in code. It needs a production Netlify deploy and the following variables:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The function writes a system row to `audit_logs` as a 5-day pulse.
