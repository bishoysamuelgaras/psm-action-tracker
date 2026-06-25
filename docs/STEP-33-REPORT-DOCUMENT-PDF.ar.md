# Step 33 — Professional incident report document layout

## الهدف
تحويل Incident full report من شكل cards كبيرة إلى document layout منظم للطباعة و Export PDF.

## الملفات
- `src/features/reports/components/IncidentFullReport.tsx`
- `src/features/reports/pages/ReportsPage.tsx`
- `src/styles/globals.css`

## ماذا تغيّر
- إزالة البطاقات الكبيرة من جسم التقرير.
- اعتماد sections وجداول مهنية مضغوطة.
- ترتيب واضح:
  1. Source overview
  2. Report totals
  3. People involved
  4. Recommendations and actions
- تحت كل Recommendation:
  - Recommendation text
  - Action summary table
  - تفاصيل كل Action
  - Updates table
  - Attachments table
  - Extension requests table
- زر `Export PDF` يستخدم وضع الطباعة الحالي، ثم من نافذة المتصفح اختر **Save as PDF**.

## التنفيذ
1. انسخ الملفات فوق المشروع بنفس المسارات.
2. شغّل التطبيق.
3. افتح Reports > Incident full report.
4. اختر incident.
5. اضغط `Export PDF`.
6. من نافذة الطباعة اختر `Save as PDF`.

## ملاحظة
هذا التعديل يغيّر فقط شكل التقرير والطباعة، بدون تعديل APIs أو workflow.
