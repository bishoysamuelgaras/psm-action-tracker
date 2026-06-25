# Action Tracker — Step 1 Foundation

هذه الحزمة هي بداية المشروع بشكل منظم واحترافي.

## داخل الحزمة ستجد
- React + Vite + TypeScript
- Routing منظم
- Layout احترافي
- Login foundation
- Supabase client
- Netlify config
- Placeholder pages منظمة
- Tailwind CSS setup
- Alias جاهز بصيغة `@/`

---

## تنزلها فين؟
اعمل فولدر جديد على جهازك باسم مثلًا:

`action-tracker`

ثم فك ضغط الملف داخله.

---

## افتح المشروع
من داخل نفس المسار افتح Terminal ثم نفذ:

```bash
npm install
```

بعدها انسخ ملف البيئة:

### Windows PowerShell
```powershell
Copy-Item .env.example .env
```

### أو يدويًا
اعمل ملف جديد اسمه:
`.env`

ثم انسخ فيه القيم الموجودة في `.env.example`

---

## عدّل ملف البيئة
افتح `.env` وضع القيم الحقيقية من Supabase:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### ستجدهم فين؟
داخل Supabase Dashboard:
- Project Settings
- Data API / API Settings
- انسخ:
  - Project URL
  - anon / publishable key

---

## تشغيل المشروع
```bash
npm run dev
```

---

## البناء للإنتاج
```bash
npm run build
```

---

## الرفع على Netlify
في Netlify:
- Build command:
  `npm run build`
- Publish directory:
  `dist`

وأضف نفس Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## ملاحظات مهمة
1. التطبيق الآن فيه هيكل احترافي وواجهة بداية فقط.
2. صفحات Dashboard / Sources / Recommendations / Actions / Reports ما زالت placeholders جاهزة للتوصيل.
3. في الخطوة القادمة سنعمل:
   - Database schema
   - master data
   - auth roles
   - RLS
   - first real tables

---

## ترتيب المجلدات
```text
src/
  app/
  components/
    layout/
    ui/
  features/
    auth/
    dashboard/
    sources/
    recommendations/
    actions/
    reports/
    settings/
  lib/
  styles/
  types/
supabase/
  sql/
docs/
```

---

## ماذا تعمل بعد تنزيل الحزمة؟
1. فك الضغط.
2. افتح المشروع في VS Code.
3. نفذ `npm install`
4. اضبط `.env`
5. شغل `npm run dev`

---

## الخطوة التالية معي
بعد أن تتأكد أن المشروع اشتغل، سنبدأ مباشرة في:
**Step 2 — Supabase schema + SQL files + master data foundation**
