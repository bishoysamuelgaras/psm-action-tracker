# تشغيل نسخة Action Tracker النهائية

هذه نسخة كاملة من المشروع بعد تعديلات صفحة Actions الأخيرة، وليست Patch.

## مهم جدًا
- فك الملف في فولدر جديد نظيف.
- لا تخلط هذه النسخة مع فولدر Patch قديم.
- لا تنسخ `postcss.config.js` من أي نسخة قديمة داخل هذا المشروع.
- هذه النسخة تستخدم Tailwind من خلال Vite plugin الموجود في `vite.config.ts`.

## التشغيل محليًا
افتح PowerShell داخل فولدر المشروع ثم نفذ:

```powershell
npm install
npm run dev
```

## اختبار Build

```powershell
npm run build
```

## ملف البيئة
انسخ `.env.example` إلى `.env.local` وضع قيم Supabase:

```txt
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## ملخص آخر تعديلات صفحة Actions
- New Action collapsed by default.
- Add New Action CTA أصبح أوضح بلون مختلف.
- استغلال أفضل للمساحات يمين وشمال.
- Compact filters لتقليل المساحات الفارغة.
- Pagination بعدد صفوف متغير: 10 / 20 / 30 / 50.
- Responsible filter يعرض الأشخاص والإدارات.
- تحسين عرض النصوص المختلطة عربي/إنجليزي Bidi بدون تغيير الداتا.
