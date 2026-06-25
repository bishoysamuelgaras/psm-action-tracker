# الخطوة 7 — رفع المرفقات + بداية التقارير + اللوجو

## الجديد في الخطوة دي
1. تم إضافة `logo.png` أعلى يمين الـ header.
2. تم تحويل جزء المرفقات داخل صفحة تفاصيل الـ action إلى **رفع فعلي** على Supabase Storage.
3. تم إضافة:
   - Upload
   - Download
   - Delete attachment record
4. تم استبدال صفحة التقارير المؤقتة بصفحة تقارير فعلية تعتمد على الـ views:
   - `v_action_summary`
   - `v_overdue_actions`
   - `v_source_progress_summary`

## تنفذ فين؟
### أولًا: داخل المشروع
انسخ الملفات فوق مشروعك الحالي **بنفس المسارات**.

### ثانيًا: داخل Supabase
افتح:
- **Supabase Dashboard**
- **SQL Editor**
- **New Query**

ثم شغّل الملف:
- `supabase/sql/008_storage_bucket_and_policies.sql`

> مهم: هذا الملف ينشئ bucket باسم `action-evidence` ويضيف سياسات تخزين أساسية حتى ينجح الرفع والتنزيل من التطبيق.

## قبل التجربة
تأكد أن:
- `public/logo.png` موجود بالفعل داخل المشروع
- المستخدم مسجل دخول
- تم تنفيذ الخطوات السابقة خاصة Step 2 و Step 3

## ماذا ستجد بعد التنفيذ؟
### في Action Details
- Card جديدة/محدثة للمرفقات
- اختيار ملف + وصف اختياري + زر Upload
- قائمة بالمرفقات مع:
  - اسم الملف
  - الحجم
  - من رفعه
  - وقت الرفع
  - Download
  - Delete (بحسب الصلاحية)

### في Reports
- كروت KPI
- Filters
- Export CSV
- جدول summary للأكشنات
- جدول مختصر لتقدم الـ sources

## التشغيل
```bash
npm run dev
```

## لو ظهر خطأ
ابعتلي رسالة الخطأ **كما هي** بالضبط.
