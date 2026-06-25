# Dashboard pie emphasis, report progress, sortable headers, and pulse verification

## What changed

- Owner workload and Responsible departments are now doughnut-first cards.
- Existing bar/ranking rows remain, but are compact and scroll inside the card.
- Dashboard pie sections are aligned from the top for a more consistent premium layout.
- Report KPI `Progress` now uses the same philosophy as the dashboard:
  - closed/verified actions ÷ total actions × 100
- Operational summary report table follows the current sort order.
- Added clickable sortable headers to the main operational tables:
  - Actions register
  - Reports Operational summary
  - Sources list
  - Recommendations list
- Added explicit Netlify scheduled function declaration for `supabase-pulse` in `netlify.toml` in addition to the inline function config.

## Local note

When running only `npm run dev`, Netlify Functions are not served by Vite, so calls to `/.netlify/functions/...` can return 404 locally. Use `netlify dev` to test Netlify Functions locally.
