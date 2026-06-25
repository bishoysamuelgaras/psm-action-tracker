# Step 11 — Users & Access + Dashboard Notifications

## الموجود في الحزمة
- إدارة المستخدمين والأدوار من داخل التطبيق على صفحة `/settings`
- تعديل:
  - الاسم
  - الكود الوظيفي
  - المسمى الوظيفي
  - القسم
  - الدور
  - التفعيل / الإيقاف
- Dashboard alerts عملية:
  - Overdue now
  - Due this week
  - Pending verification
  - Extension approvals
- تحديث عنوان الصفحة والـ sidebar إلى **Users & Access**

## تنفذها فين
فك الضغط ثم انسخ الملفات فوق مشروعك الحالي **بنفس المسارات**.

## أوامر التشغيل
```bash
npm run dev
```

## فحص TypeScript
تمت مراجعة الحزمة محليًا على نسخة الفحص بالأمر:
```bash
tsc -p tsconfig.json --noEmit
```

## ملاحظات مهمة
- لا يوجد SQL جديد في هذه الخطوة.
- إدارة المستخدمين هنا تعمل على **الحسابات الموجودة بالفعل** داخل `public.profiles`.
- لو أردت بعد ذلك أضيف لك **Invite user / reset password** من داخل التطبيق نفسه، نعملها بخطوة تالية عبر Netlify Functions + Supabase service role بشكل آمن.
