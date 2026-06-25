# Step 27 — Recommendation form + Netlify env

## التعديلات
- Recommendation form بقى مترتب تحت بعض علشان النصوص تبان أوضح.
- Preview / Recommendation snapshot بقى تحت الحقول مباشرة.
- Action filters بقت مختصرة وفي صفين واضحين.
- لون العنصر المختار في القائمة الجانبية بقى أوضح.

## Netlify
أضف هذه المتغيرات في Netlify:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_APP_URL
- SUPABASE_SERVICE_ROLE_KEY (لو هتستخدم دعوات المستخدمين والريست باسورد)

ثم اعمل Clear cache and deploy site أو Trigger deploy after saving variables.
