# Step 15 — Build Fix

## ما الذي اتصلح
- إصلاح typing في `src/types/database.ts` بإضافة `Relationships` المطلوبة وإزالة type غير مستخدم.
- تثبيت helper الخاص بالـ RPC في `src/lib/rpc.ts` ليتعامل مع دوال الحجز الديناميكية بدون خطأ TypeScript.
- إصلاح `sources / recommendations / actions` بحيث أرقام الحجز مطلوبة كسلاسل نصية قبل الحفظ.
- إصلاح `ActionForm` و `ActionDetailsPage` لمشاكل `string | undefined` و return types.
- إصلاح `master-data` لحالات الحذف عند غياب `id`.
- تخفيف typing صارم في `users.api.ts` للناتج المتداخل من `profiles -> departments`.

## التحقق
تم تشغيل:
- `npm run build`

ونجح البناء بنجاح.
