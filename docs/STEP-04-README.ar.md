# Step 4 — Sources Module (أول CRUD حقيقي)

الخطوة دي بتحول صفحة **Sources** من placeholder إلى موديول شغال فعلاً:

- عرض قائمة المصادر من جدول `public.sources`
- Filters بالبحث + source type + department
- إضافة source جديد
- تعديل source موجود
- حذف source
- عرض metadata عن المصدر المختار
- احترام الصلاحيات:
  - **admin / psm_manager**: create + edit + delete
  - باقي الأدوار: read only

---

## تنفذها فين؟

داخل مشروع React الحالي على جهازك.

1. فك ضغط الحزمة.
2. انسخ الملفات فوق مشروعك الحالي **بنفس المسارات**.
3. شغّل:

```bash
npm run dev
```

---

## الملفات الجديدة/المعدلة المهمة

### UI helpers
- `src/components/ui/select.tsx`
- `src/components/ui/textarea.tsx`
- `src/lib/utils.ts`

### Sources module
- `src/features/sources/api/sources.api.ts`
- `src/features/sources/hooks/useSources.ts`
- `src/features/sources/components/SourceFilters.tsx`
- `src/features/sources/components/SourceListTable.tsx`
- `src/features/sources/components/SourceForm.tsx`
- `src/features/sources/pages/SourcesPage.tsx`

---

## ملاحظات مهمة

### 1) الحذف
الحذف هنا **hard delete** من جدول `sources`.

لو الـ source مربوط بالفعل بـ recommendations فغالبًا قاعدة البيانات سترفض الحذف بسبب الـ foreign key، وده مقصود علشان نحافظ على سلامة البيانات.

### 2) الصلاحيات
لو دخلت بحساب role = `viewer` أو `action_owner`:
- هتشوف القائمة
- لكن لن تستطيع create / edit / delete

### 3) created_by
عند إنشاء مصدر جديد، الكود يحفظ `created_by = auth.user.id` تلقائيًا.

---

## ماذا أختبر بعد التنفيذ؟

1. افتح `/sources`
2. جرّب إنشاء source جديد
3. تأكد أنه يظهر في الجدول
4. افتحه وعدل العنوان أو الـ summary
5. جرّب الـ filters
6. جرّب الدخول بحساب read-only وشاهد أن الصفحة تمنع التعديل

---

## لو ظهر خطأ
ابعتلي:
- نص الخطأ كامل
- هل الخطأ وقت create ولا update ولا delete
- وهل الحساب الحالي `admin` أو `psm_manager`

وأصلحه لك مباشرة في patch التالي.
