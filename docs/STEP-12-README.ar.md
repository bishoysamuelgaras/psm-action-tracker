# Step 12

## الموجود في الخطوة دي
- Invite user من داخل التطبيق
- Reset password بتوليد temporary password
- ترقيم تلقائي مترابط للـ sources / recommendations / actions

## SQL
شغّل الملف ده من Supabase SQL Editor:
- `supabase/sql/009_admin_functions_and_auto_numbering.sql`

## Netlify Environment Variables
أضف المتغيرات دي في Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`

## شكل الترقيم
- Source / Incident: `INC-2026-0001`
- Recommendation: `INC-2026-0001-R01`
- Action: `INC-2026-0001-R01-A01`

## ملاحظات
- الأرقام القديمة تظل كما هي
- الإنشاءات الجديدة فقط هي التي ستتولد تلقائيًا
- Invite / reset password متاحين للأدمن فقط
