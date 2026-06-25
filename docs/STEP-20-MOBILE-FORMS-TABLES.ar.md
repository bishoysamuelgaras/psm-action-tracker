# Step 20 — تحسين الفورمات والجداول على الموبايل

## الملفات المعدلة
- `src/components/ui/form-field.tsx`
- `src/features/sources/components/SourceForm.tsx`
- `src/features/sources/components/SourceFilters.tsx`
- `src/features/sources/components/SourceListTable.tsx`
- `src/features/recommendations/pages/RecommendationsPage.tsx`
- `src/features/actions/components/ActionForm.tsx`
- `src/features/actions/components/ActionFilters.tsx`
- `src/features/actions/components/ActionListTable.tsx`

## أهم التحسينات
- إضافة `FormField` موحد لزيادة وضوح الحقول والـ hints والـ errors.
- تبسيط فورم `Sources` إلى خطوات واضحة مع snapshot جانبي.
- تحسين فورم `Actions` إلى أقسام مرتبة: الربط والترقيم، التنفيذ، التواريخ، الأدلة.
- جعل فلاتر `Sources` و`Actions` أوضح على الموبايل.
- تحسين عرض القوائم على الموبايل في `Sources` و`Recommendations` و`Actions` على شكل cards بدل الاعتماد على overflow.
- إصلاح مشكلة `Field` داخل صفحة `Recommendations`.

## بعد النسخ
شغّل:

```bash
npm run build
```

ثم:

```bash
npm run dev
```
