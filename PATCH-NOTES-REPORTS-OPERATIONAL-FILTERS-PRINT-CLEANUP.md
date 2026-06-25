# Reports Operational Filters & Clean Print Report Patch

## Scope
- Fixed Operational Summary department filtering so it filters by **Responsible department** instead of Source department.
- Improved search coverage to include action description, recommendation text, reference number, owner and verifier.
- Rebuilt the filtered printable report into a clean compact register-style layout similar to the on-screen table.
- Hid the Smart Assistant / chatbot from print output.

## Files changed
- `src/features/reports/api/reports.api.ts`
- `src/features/reports/components/FilteredActionsReport.tsx`
- `src/features/reports/pages/ReportsPage.tsx`
- `src/features/chatbot/components/ChatbotDrawer.tsx`
- `src/styles/globals.css`

## Validation
- `npm run build` completed successfully.
- Only the standard Vite chunk-size warning appeared.
