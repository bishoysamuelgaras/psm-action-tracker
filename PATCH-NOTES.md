# ANRPC Recommendations Groq Page Fix

هذا الـ patch مبني على آخر نسخة كاملة التي رفعتها (`New folder (11).zip`).

## ما الذي تم إصلاحه
- استرجاع `recommendations.api.ts` الأساسي بدل النسخة المكسورة التي كانت تحتوي فقط على rewrite helper.
- إضافة `rewriteRecommendationTextWithGroq` داخل نفس API file.
- تعديل `RecommendationsPage.tsx` ليستخدم Groq بدل `psmSmartWriter` المحلي.
- الحفاظ على الميكروفون والـ preview كما هم.

## مهم
تأكد أن هذا الملف موجود ومحدّث في مشروعك:
- `netlify/functions/rewrite-recommendation.js`

وتأكد من وجود متغيرات البيئة على Netlify:
- `GROQ_API_KEY`
- `GROQ_REWRITE_MODEL`
