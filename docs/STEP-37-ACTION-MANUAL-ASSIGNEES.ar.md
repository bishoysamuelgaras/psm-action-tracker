# Step 37 — Hybrid assignees for Actions

الخطوة دي بتضيف دعم هجين في Action form:
- تختار الشخص من المستخدمين الموجودين على السيستم
- أو تدخل الاسم يدويًا لو الشخص غير موجود على السيستم

## اتعدل إيه
- Responsible
- Owner
- Verifier

كل واحد فيهم بقى فيه اختيار:
- From system
- Enter name

## مهم جدًا
لازم تشغّل SQL ده على Supabase:
- `supabase/sql/013_action_manual_assignees.sql`

## بعد تنفيذ الـ SQL
انسخ ملفات الـ patch فوق مشروعك بنفس المسارات، ثم جرّب:
1. افتح Action form
2. غيّر Responsible / Owner / Verifier إلى `Enter name`
3. اكتب الاسم يدويًا
4. اعمل Save
5. اتأكد إن الاسم ظاهر في:
   - Action list
   - Action details
   - Reports

## ملاحظة
الفلترة الحالية بـ Responsible user ستظل مرتبطة فقط بالمستخدمين الموجودين على السيستم.
الأسماء اليدوية ستظهر في العرض والتقرير، لكن لن تدخل في فلتر المستخدمين الداخليين.
