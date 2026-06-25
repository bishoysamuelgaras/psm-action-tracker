# Step 30 — Dashboard + Reports polish

التعديل ده محافظ جدًا ومركز فقط على:

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/reports/pages/ReportsPage.tsx`

## الهدف
- تنضيف الـ Dashboard من غير لمس الموديولات اللي اتظبطت
- تنظيم Reports على شكل library
- التقرير ما يظهرش إلا لما المستخدم يفتحه
- الحفاظ على نفس APIs والبيانات الحالية

## ما الذي اتغير
### Dashboard
- إضافة Quick start card بسيطة
- تنظيم Needs attention و Account summary
- توحيد شكل KPI cards
- تحسين Upcoming actions لعرض card-based أوضح

### Reports
- إضافة Report library
- Incident / Operational summary / Source progress يفتحوا عند الضغط فقط
- زر Close لكل report section
- الحفاظ على نفس التصفية والتصدير والطباعة

## التنفيذ
انسخ الملفين فوق المشروع بنفس المسارات.
