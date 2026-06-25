# Step 06 — Actions Module

الخطوة دي بتحول التطبيق من مجرد تتبع مصادر وتوصيات إلى **نظام تنفيذ ومتابعة فعلي**.

## الموجود في الحزمة
- صفحة Actions رئيسية فيها:
  - KPI cards
  - Search + filters
  - جدول actions
  - Create / edit / delete
- صفحة تفاصيل لكل action
- Timeline للـ progress updates
- نموذج إضافة update
- نموذج طلب extension
- قائمة history و attachment records
- تحديث router لإضافة مسار:
  - `/actions/:actionId`

## تنفذها فين؟
1. فك الضغط.
2. انسخ الملفات إلى مشروعك الحالي **بنفس المسارات**.
3. شغّل:

```bash
npm run dev
```

## مهم
- لازم تكون منفذ Step 2 و Step 3.
- الـ attachments هنا **عرض records فقط** لو موجودة في الجدول.
- رفع الملفات نفسه هنحسنه في الخطوة القادمة مع إعداد bucket وuploader مرتب.

## ما الذي تختبره؟
### داخل صفحة Actions
- إنشاء action جديد
- تعديل action موجود
- حذف action
- الفلاتر:
  - status
  - priority
  - recommendation
  - responsible person
  - overdue only

### داخل Action Details
- إضافة progress update
- التأكد أن status/progress يتحدثوا على action الأساسي
- إضافة extension request
- من admin / psm_manager:
  - approve أو reject لطلب extension
- مراجعة history

## لو ظهر error
ابعتلي نص الـ error كما هو، خصوصًا لو كان متعلقًا بـ:
- RLS
- foreign keys
- profile / role
- missing table column
