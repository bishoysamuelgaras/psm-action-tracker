# Step 18 — UI cleanup + easier usage

## What changed
- Tightened dashboard cards and fixed duplicated labels.
- Made mobile shell cleaner:
  - compact top header
  - sticky mobile navigation
  - cleaner sidebar profile block
- Improved input/select/textarea text visibility.
- Reports now open by library selection only.
- Added simple intro cards to explain each page quickly.
- Standardized KPI/stat cards across dashboard, sources, recommendations, actions, and users.

## Files included
- src/components/layout/AppHeader.tsx
- src/components/layout/AppLayout.tsx
- src/components/layout/AppMobileNav.tsx
- src/components/layout/AppSidebar.tsx
- src/components/ui/card.tsx
- src/components/ui/input.tsx
- src/components/ui/select.tsx
- src/components/ui/textarea.tsx
- src/components/ui/feature-intro.tsx
- src/components/ui/stat-card.tsx
- src/features/dashboard/pages/DashboardPage.tsx
- src/features/reports/pages/ReportsPage.tsx
- src/features/sources/pages/SourcesPage.tsx
- src/features/recommendations/pages/RecommendationsPage.tsx
- src/features/actions/pages/ActionsPage.tsx
- src/features/settings/pages/SettingsPage.tsx
- src/styles/globals.css

## Apply
Copy the files over the same paths, then run the app.
