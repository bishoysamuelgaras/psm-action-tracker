# STEP 50 — Action parent guard

## الهدف
إضافة 3 طبقات توضيح داخل Action create form:

1. **Breadcrumb** أعلى الفورم يوضح المسار الحالي:
   Source / Recommendation / New Action
2. **Parent card** يوضح بالتفصيل الـ Source والـ Recommendation التي سيتبعها الـ Action
3. **Save warning خفيف** يظهر قبل الحفظ خصوصًا لو المستخدم غيّر الـ Source أو الـ Recommendation بعد ما بدأ يدخل تفاصيل التنفيذ

## الملفات المعدلة
- `src/features/actions/components/ActionForm.tsx`

## ملاحظات
- التعديل **محافظ جدًا**
- لم يغيّر الـ workflow الأساسي
- لم يغيّر numbering logic
- لم يغيّر filtering logic
- warning غير مانع للحفظ، لكنه تنبيه واضح قبل الـ save
