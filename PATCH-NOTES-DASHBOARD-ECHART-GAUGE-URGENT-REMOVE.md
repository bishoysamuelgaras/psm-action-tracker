# Dashboard ECharts Gauge + Urgent Queue Removal

## Scope
- Dashboard page only.
- No database schema changes.
- No Supabase logic changes.

## Changes
- Replaced the PSM follow-up command center circular progress ring with an Apache ECharts gauge-style visual.
- The gauge displays progress based on closed actions / total actions.
- Gauge tooltip shows progress, closed/total actions, and attention percentage.
- Gauge remains clickable and opens the filtered closed actions view.
- Removed the Urgent queue card from the dashboard.
- Added `echarts` as a frontend dependency.

## Build
- `npm run build` completed successfully.
- Vite bundle size warning remains only as a warning.
