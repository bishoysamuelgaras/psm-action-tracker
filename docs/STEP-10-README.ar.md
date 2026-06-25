# Step 10 — Incident Full Report

الخطوة دي فيها تطوير مهم لصفحة **Reports**:

## الجديد
- اختيار أي **Incident Investigation** من صفحة التقارير
- عرض **Full Incident Report** شامل:
  - بيانات الحادثة الأساسية
  - الملخص
  - كل الـ recommendations
  - كل الـ actions تحت كل recommendation
  - الأشخاص المرتبطين بكل action
  - التواريخ المهمة
  - progress updates
  - attachments
  - extension requests
- زر **Print incident report**
- تحسين طباعة التقرير بحيث يختفي الـ sidebar والـ header وقت الطباعة
- تقليل النصوص الزائدة في صفحة التقارير

## تنفذها إزاي
1. فك الضغط
2. انسخ الملفات فوق مشروعك الحالي **بنفس المسارات**
3. شغّل المشروع:

```bash
npm run dev
```

## ملاحظات مهمة
- لا يوجد SQL جديد في الخطوة دي
- التقرير يعتمد على الداتا الموجودة فعلًا في:
  - `sources`
  - `recommendations`
  - `actions`
  - `action_updates`
  - `action_attachments`
  - `action_extension_requests`
- قائمة الحوادث في التقارير تعتمد على `source_type_code = incident_investigation`

## لو التقرير مش بيظهر
راجع الآتي:
- هل الـ source نوعه فعلًا `incident_investigation`؟
- هل في recommendations/actions مرتبطة بالمصدر؟
- هل RLS يسمح للمستخدم الحالي بالقراءة؟

## بعد الخطوة دي
الخطوة التالية الأفضل تكون:
- تحسينات على **print branding**
- **PDF export**
- **Report cover page**
- أو **Admin user management** حسب الأولوية اللي تحبها
