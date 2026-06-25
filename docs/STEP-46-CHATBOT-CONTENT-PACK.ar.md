# STEP 46 — Chatbot Content Pack + Smarter Matching

هذه الخطوة مخصصة لتحسين **محتوى** البوت وذكائه داخل نطاق النظام فقط، بدون لمس الـ workflow الأساسي أو منطق الصفحات الحساسة.

## ما الذي تضيفه هذه الخطوة؟

- زيادة intents وأسئلة وأجوبة جاهزة جديدة
- ربط أسئلة مرتبطة (related intents)
- تحسين matching بين سؤال المستخدم والـ FAQ
- دعم أفضل للأسئلة العربية والإنجليزية والمختلطة
- تحسين suggestions حسب الصفحة الحالية مع fallback عام

## الملفات التي تم تعديلها

- `netlify/functions/chatbot-ask.js`
- `netlify/functions/chatbot-suggestions.js`
- `src/features/chatbot/hooks/useChatbot.ts`
- `supabase/sql/023_chatbot_content_pack.sql`

## ماذا تنفذ في Supabase؟

إذا كنت نفذت الخطوتين السابقتين بالفعل، **نفذ هذا الملف فقط**:

- `supabase/sql/023_chatbot_content_pack.sql`

## ماذا لا تفعل هذه الخطوة؟

- لا تقرأ live data من Actions / Recommendations
- لا تغير permissions الحالية
- لا تلمس numbering أو Source-first logic
- لا تضيف أي dependency جديدة

## كيف تختبر؟

### من صفحة Sources
- ما معنى reference no.؟
- هل Reference No يمكن أن يكون يدويًا؟

### من صفحة Recommendations
- كيف أنشئ Recommendation؟
- كيف أستخدم المايك؟

### من صفحة Actions
- كيف تعمل الفلاتر في Actions؟
- من يقدر يطلب Extension Request؟
- ما معنى Completed Actions need verification؟

### من صفحة Reports
- كيف أستخدم Reports؟
- كيف تعمل فلترة Reports حسب Source Type؟

### من صفحة Logs
- ما الذي تسجله Logs؟
- لماذا لا تظهر لي Logs؟

## تشغيل محلي

استخدم:

```bash
netlify dev
```

## ملاحظة

هذه الخطوة تركز على **المعرفة والردود** فقط.
الخطوة التالية المنطقية بعد نجاحها ستكون:
- زيادة seed data أكثر
- أو ربط البوت بـ page-aware actions أذكى
- أو إدخال live data بشكل آمن حسب الصلاحيات
