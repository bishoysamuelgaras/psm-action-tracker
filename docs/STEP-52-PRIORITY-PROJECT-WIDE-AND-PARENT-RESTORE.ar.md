# STEP 52 — Priority project-wide + tooltip direction + parent guard restore

تم في هذه الخطوة:

- توحيد عرض الأولوية على مستوى المشروع إلى:
  - P1 — Serious
  - P2 — High
  - P3 — Medium
  - P4 — Low
- إبقاء قيم قاعدة البيانات كما هي داخليًا (`critical / high / medium / low`) بدون تغيير.
- إضافة مكوّن موحد لعرض صورة دليل الأولويات من `public/p.png`.
- جعل الـ tooltip يفتح ناحية اليمين.
- إعادة `Parent path + Parent card + Save check` داخل نموذج إنشاء الـ Action.

الملفات الأساسية المعدلة:
- `src/lib/priority.ts`
- `src/components/ui/priority-info-tooltip.tsx`
- `src/components/ui/form-field.tsx`
- `src/features/actions/components/ActionForm.tsx`
- `src/features/actions/components/ActionListTable.tsx`
- `src/features/actions/pages/ActionDetailsPage.tsx`
- `src/features/actions/api/actions.api.ts`
- `src/features/recommendations/api/recommendations.api.ts`
- `src/features/recommendations/pages/RecommendationsPage.tsx`
- `src/features/reports/pages/ReportsPage.tsx`
- `src/features/reports/components/IncidentFullReport.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `public/p.png`
