# Step 17 — Mobile navigation + reports UX cleanup

## ما الذي تم تعديله
- إخفاء الـ sidebar الكبير على الموبايل
- إضافة mobile nav أفقي صغير وسهل
- تحسين وضوح النص داخل حقول select / input / textarea
- إخفاء الكارت السفلي الفارغ في الـ sidebar لو لا يوجد بيانات مستخدم
- تحويل صفحة Reports إلى قائمة تقارير فقط في البداية
- لا يتم عرض التقرير إلا بعد الضغط عليه
- إضافة زر Close داخل كل تقرير مفتوح

## الملفات المعدلة
- `src/components/layout/navigation.ts`
- `src/components/layout/AppMobileNav.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/features/reports/pages/ReportsPage.tsx`

## النتيجة المتوقعة
- على الموبايل ستظهر روابط الصفحات كشريط أفقي صغير بدل القائمة الكبيرة
- العنصر المختار سيكون واضحًا
- النص داخل الـ select سيظهر بوضوح
- صفحة التقارير ستفتح أولًا كقائمة أسماء تقارير فقط
