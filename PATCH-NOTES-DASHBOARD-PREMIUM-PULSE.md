# Patch Notes — Premium Dashboard + Supabase Pulse

## Dashboard redesign

- Rebuilt the dashboard as a premium command center with dynamic cards, doughnuts, bars, and trends.
- Account summary is now compact and displays the active department name instead of the department id.
- PSM follow-up overview is now a useful executive health card with closure, attention, active workload, and verification signals.
- Removed the old Upcoming actions card.
- Priority distribution is now a doughnut and shows total / closed / open / overdue per priority.
- Average progress now follows the agreed philosophy: closed actions ÷ total actions, not weighted action progress.
- Intervention mix was replaced with a professional intervention command matrix.
- Owner workload and Responsible departments were kept and made clickable.
- Dashboard signals navigate to the Actions page with the relevant filters.

## Filtering updates

- Added `dashboardFilter` support for dashboard-driven filters:
  - active
  - closed
  - verified
  - overdue
  - due_soon
  - pending_verification
  - pending_extensions
- Owner workload now filters by responsible user/manual responsible name.
- Priority, status, and department dashboard widgets are clickable.

## Supabase pulse

- Added a Netlify scheduled function: `netlify/functions/supabase-pulse.js`.
- It writes a lightweight row into `audit_logs` every 5 days to keep Supabase active.
- Required Netlify environment variables:
  - `VITE_SUPABASE_URL` or `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Build validation

- `npm run build` completed successfully.
- Only the standard Vite bundle-size warning appeared.
