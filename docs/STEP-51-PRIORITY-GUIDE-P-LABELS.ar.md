تم في هذه الخطوة:
- تغيير عرض الـ priority في صفحات Recommendations و Actions إلى:
  - P1 — Serious
  - P2 — High
  - P3 — Medium
  - P4 — Low
- إظهار البادجات المختصرة داخل الجداول والكروت بصيغة P1 / P2 / P3 / P4
- إضافة i صغيرة بجانب كلمة Priority في الأماكن الأساسية داخل Recommendations و Actions
- عند الوقوف على الـ i تظهر صورة الدليل من:
  public/p.png

الملفات المعدلة:
- src/lib/priority.ts
- src/components/ui/form-field.tsx
- src/components/ui/image-info-tooltip.tsx
- src/features/recommendations/api/recommendations.api.ts
- src/features/recommendations/pages/RecommendationsPage.tsx
- src/features/actions/api/actions.api.ts
- src/features/actions/components/ActionForm.tsx
- src/features/actions/components/ActionListTable.tsx
- src/features/actions/pages/ActionDetailsPage.tsx
- public/p.png
