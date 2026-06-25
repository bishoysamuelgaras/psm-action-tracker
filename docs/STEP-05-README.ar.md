# Step 5 — Recommendations Module

الخطوة دي بتحول صفحة **Recommendations** من placeholder إلى CRUD حقيقي ومربوط بقاعدة البيانات.

## الملفات الموجودة في الباتش
- `src/features/recommendations/api/recommendations.api.ts`
- `src/features/recommendations/pages/RecommendationsPage.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/textarea.tsx`

## تعملها فين بالضبط؟
داخل مشروع React نفسه.

1. فك الضغط.
2. انسخ الملفات فوق مشروعك بنفس **نفس المسارات**.
3. شغّل:

```bash
npm run dev
```

## المطلوب يكون جاهز قبلها
- تكون منفذ **Step 2** في Supabase.
- تكون منفذ **Step 3** للـ auth.
- يفضل تكون منفذ **Step 4**، لكن أنا ضمنت `Select` و `Textarea` هنا أيضًا حتى تبقى الخطوة self-contained.

## ماذا ستجد بعد التنفيذ؟
- صفحة توصيات كاملة
- إضافة recommendation جديدة
- تعديل recommendation
- حذف recommendation
- فلترة حسب:
  - source
  - category
  - priority
  - search text
- لو فتحت الصفحة بهذا الشكل:

```text
/recommendations?sourceId=<SOURCE_UUID>
```

سيتم فلترة الصفحة على هذا المصدر تلقائيًا.

## الصلاحيات الحالية
- `admin` و `psm_manager`: create / edit / delete
- باقي الأدوار: read only

## ملاحظات مهمة
- رقم التوصية `recommendation_no` لازم يكون **unique داخل نفس المصدر** فقط، وده متوافق مع قاعدة البيانات.
- لو ظهر خطأ uniqueness، راجع أنك لم تكرر نفس رقم التوصية لنفس المصدر.
- لو ظهر خطأ permission، غالبًا المشكلة في:
  - `role_code`
  - أو عدم اكتمال RLS من Step 2

## الخطوة التالية
**Step 6 — Actions module**

وده هيكون أهم جزء فعلي في التطبيق، لأن كل recommendation بعدها هيتحول إلى action أو أكثر مع:
- owner
- due date
- status
- progress
- updates
