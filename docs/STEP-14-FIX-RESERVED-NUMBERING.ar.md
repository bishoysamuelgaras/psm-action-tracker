# Step 14 — Fix reserved numbering RPC mismatch

نفّذ الملف ده فقط لو الترقيم الأوتوماتيك في الفورم لا يظهر أو ظهر خطأ `PGRST202`.

## المطلوب
1. افتح **Supabase SQL Editor**
2. شغّل الملف:
   - `supabase/sql/011_fix_reserved_numbering_rpc_v2.sql`
3. اعمل **Refresh** للتطبيق
4. جرّب:
   - إنشاء Source
   - ثم Recommendation
   - ثم Action

## ماذا يصلح هذا الملف؟
- ينشئ RPC جديدة وثابتة:
  - `reserve_source_number_v2`
  - `reserve_recommendation_number_v2`
  - `reserve_action_number_v2`
- يطبع أسماء الأعمدة في `number_reservations` لو كانت قديمة أو مختلفة
- يضيف `notify pgrst, 'reload schema'`
- الواجهة نفسها أصبحت تحاول استخدام `v2` أولًا، ثم fallback للـ RPC القديمة لو كانت موجودة

## ملاحظات
- المستخدم لا يكتب الأرقام يدويًا
- الأرقام تظهر تلقائيًا داخل الفورم
- الرقم النهائي يظل مرتبطًا بالـ parent:
  - Source → Recommendation → Action
