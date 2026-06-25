# Step 16 — Reset reserved numbering RPC

نفّذ الملف التالي من Supabase SQL Editor:

- `supabase/sql/012_reset_reserved_numbering_rpc.sql`

الملف ده يعمل:
- تنظيف للدوال القديمة والمتضاربة
- إعادة إنشاء `reserve_source_number` و `reserve_source_number_v2`
- إعادة إنشاء `reserve_recommendation_number` و `reserve_recommendation_number_v2`
- إعادة إنشاء `reserve_action_number` و `reserve_action_number_v2`
- توافق مع هيكل `number_reservations` الحالي أو القديم
- `notify pgrst, 'reload schema'`

بعد التنفيذ:
1. اعمل Refresh للمتصفح
2. افتح شاشة Create Source
3. اختَر Source Type + Source Date
4. لازم الرقم يظهر تلقائيًا
