# Step 02 — تجهيز قاعدة البيانات على Supabase

الخطوة دي هدفها إنك تجهز **الهيكل الحقيقي للبيانات** قبل ما نبدأ شاشات الإدخال والتقارير.

## هتعملها فين بالضبط؟
من داخل مشروعك على **Supabase Dashboard**:

1. افتح مشروع Supabase
2. من الشريط الجانبي ادخل على **SQL Editor**
3. اضغط **New query**
4. انسخ محتوى كل ملف SQL وشغله **بالترتيب**

## ترتيب التنفيذ
شغّل الملفات دي بالترتيب ده:

1. `supabase/sql/001_init_schema.sql`
2. `supabase/sql/002_seed_master_data.sql`
3. `supabase/sql/003_functions_and_triggers.sql`
4. `supabase/sql/004_rls_policies.sql`
5. `supabase/sql/005_reporting_views.sql`

بعد كده جهّز أول Admin:

6. ادخل على **Authentication > Users**
7. اعمل **Add user** أو **Invite user** بالإيميل بتاعك
8. بعد إنشاء المستخدم، شغّل ملف:
   - `supabase/sql/006_bootstrap_first_admin.sql`
9. بدّل الإيميل داخل الملف بإيميلك الحقيقي قبل التنفيذ

## مهم جدًا
- ما تشغّلش ملف 006 قبل ما المستخدم يتعمل في Authentication
- لو عملت Invite لمستخدم جديد، التريجر هيضيف row تلقائي في `profiles`
- أول Admin لازم يتعمل يدويًا مرة واحدة فقط

## الجداول اللي اتضافت
### Master Data
- `departments`
- `app_roles`
- `priority_levels`
- `action_statuses`
- `source_types`
- `recommendation_categories`

### Security / Users
- `profiles`

### Core Business Tables
- `sources`
- `recommendations`
- `actions`
- `action_updates`
- `action_attachments`
- `action_extension_requests`
- `action_history`

## الـ workflow الحالي في الداتا
### Source
يمثل أصل الموضوع:
- Incident Investigation
- Audit
- Committee
- Inspection
- Management Review

### Recommendation
كل source ممكن يكون فيه أكثر من recommendation

### Action
كل recommendation ممكن يكون تحتها أكثر من action

### Action Update
المستخدم المسؤول يضيف progress updates بدل ما يغير كل حاجة مباشرة في action row
وده بيساعد جدًا في الـ history والـ audit trail

## الـ RLS الحالية
### مين يقرأ؟
كل المستخدمين الـ authenticated يقدروا يقرأوا البيانات

### مين يعدّل؟
- **Admin / PSM Manager**: إدارة كاملة تقريبًا
- **Action participants**: يقدروا يضيفوا updates وattachments وextension requests على الـ actions الخاصة بيهم

## الـ Views الجاهزة للتقارير
- `v_action_summary`
- `v_overdue_actions`
- `v_source_progress_summary`

## بعد ما تخلص
### جرّب الاستعلامات دي من SQL Editor
```sql
select * from public.departments order by code;
select * from public.source_types order by sort_order;
select * from public.priority_levels order by sort_order;
select * from public.action_statuses order by sort_order;
```

### وتأكد إن الـ views شغالة
```sql
select * from public.v_action_summary limit 20;
select * from public.v_overdue_actions limit 20;
select * from public.v_source_progress_summary limit 20;
```

## الخطوة التالية
بعد ما تقولّي إن التنفيذ تم بنجاح، هجهز لك **Step 3**:
- Auth الحقيقي
- Profile loading
- role guards
- أول CRUD screens متوصلة بـ Supabase
