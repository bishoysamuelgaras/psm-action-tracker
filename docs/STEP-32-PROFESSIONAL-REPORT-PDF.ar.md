# Step 32 — Professional Incident Report PDF

## ما الذي اتغير
- تحويل **Incident full report** إلى شكل document منظم بدل الكروت الكبيرة.
- إضافة زر **Export PDF** داخل صفحة Reports.
- التصدير يتم عبر **نافذة الطباعة** مع layout مخصص للطباعة، بحيث تختار **Save as PDF** ويطلع الملف بشكل بروفيشنال.
- تنظيم التقرير هرميًا:
  - Source overview
  - People involved
  - Recommendations
  - لكل Recommendation: Action summary table
  - لكل Action: execution details + updates + attachments + extension requests

## الملفات المعدلة
- `src/features/reports/components/IncidentFullReport.tsx`
- `src/features/reports/pages/ReportsPage.tsx`
- `src/styles/globals.css`

## الاستخدام
1. افتح `Reports`
2. افتح `Incident full report`
3. اختر الـ incident المطلوب
4. اضغط **Export PDF**
5. من نافذة الطباعة اختر **Save as PDF**

## ملاحظات
- التعديل محافظ ولم يغير APIs أو منطق البيانات.
- تم التركيز على شكل الطباعة والـ PDF فقط.
- لو تريد لاحقًا يمكن إضافة logo أعلى التقرير أو footer برقم الصفحة والتاريخ.
