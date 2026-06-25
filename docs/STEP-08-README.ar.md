# Step 08 — Master Data Workspace + Report Print Improvements

في الخطوة دي أضفنا **Master Data module** حقيقي بدل ما تبقى الإعدادات مجرد صفحة placeholder.

## الجديد في الخطوة
- صفحة جديدة: `Master Data`
- إدارة الجداول المرجعية الأساسية من داخل التطبيق:
  - Departments
  - Source Types
  - Recommendation Categories
  - Priority Levels
  - Action Statuses
- Create / Edit / Delete
- عدّادات سريعة لكل section
- صفحة `Settings` أصبحت Admin Center بسيط فيه shortcuts
- صفحة `Reports` أصبح فيها:
  - زر **Print report**
  - تحسينات للطباعة
  - إخفاء sidebar وأزرار التشغيل أثناء الطباعة
- تم تحديث الـ header والـ sidebar لإظهار المسار الجديد

## تنفذها فين؟
داخل مشروع React الحالي عندك.

## تنفذها إزاي؟
1. فك الضغط
2. انسخ الملفات فوق المشروع الحالي **بنفس المسارات**
3. شغّل:

```bash
npm run dev
```

## المسارات الجديدة المهمة
- `/master-data`
- `/settings`
- `/reports`

## الصلاحيات
- صفحة **Master Data** محمية لـ:
  - `admin`
  - `psm_manager`
- باقي المستخدمين لن يقدروا يفتحوها

## ملاحظات مهمة
- لا يوجد SQL جديد في هذه الخطوة
- الخطوة تعتمد على جداول Step 2 الموجودة بالفعل
- لو حاولت تحذف row مستخدمة بالفعل في actions أو recommendations قد ترفض قاعدة البيانات الحذف، وهذا طبيعي

## بعد التنفيذ اختبر الآتي
1. افتح `Master Data`
2. جرّب تعديل Department أو Priority
3. افتح `Reports`
4. اضغط **Print report** وتأكد أن الشكل أنظف وقت الطباعة
