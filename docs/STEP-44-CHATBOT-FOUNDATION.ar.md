# STEP 44 — Chatbot Foundation

الخطوة دي تضيف أول نسخة من البوت داخل التطبيق بشكل محافظ جدًا ومنفصل عن الـ workflow الأساسي.

## ما الذي تم إضافته

- Floating chatbot أسفل اليمين
- Drawer بسيط داخل التطبيق
- Netlify functions للردود والاقتراحات والـ feedback
- جداول Supabase مستقلة لقاعدة المعرفة
- Seed أولي لأسئلة وإجابات عربية وإنجليزية

## لماذا هذه النسخة آمنة

- لا تلمس جداول sources / recommendations / actions الحالية
- لا تغيّر numbering أو permissions الموجودة
- كل الشغل additive فقط

## التنفيذ

1. نفّذ SQL رقم 021 ثم 022 في Supabase SQL Editor.
2. أضف ملفات الـ frontend والـ functions في نفس المسارات.
3. تأكد من وجود `SUPABASE_SERVICE_ROLE_KEY` على Netlify.
4. للتشغيل المحلي استخدم `netlify dev`.
5. بعد تسجيل الدخول ستظهر أيقونة البوت أسفل اليمين.

## ملاحظات

- البوت في هذه المرحلة لا يقرأ من بيانات الـ actions الحية.
- الردود في المرحلة الحالية FAQ / guided help فقط.
- لو السؤال خارج نطاق البرنامج، سيرد البوت داخل حدود النظام فقط.
