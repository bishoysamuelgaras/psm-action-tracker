# Step 40 — Actions layout like Recommendations

تم تعديل صفحة **Actions** فقط بحيث تكون بنفس روح صفحة **Recommendations**:

- **الإدخال على الشمال**
- **الـ register والفلترة على اليمين**
- الحفاظ على نفس الـ logic الموجود
- بدون تعديل في APIs أو SQL

## الملفات المعدلة
- `src/features/actions/pages/ActionsPage.tsx`

## الملحوظات
- زر **New action** يفتح الفورم على الشمال
- عند الضغط على **Edit** من أي row، الفورم يفتح على الشمال مباشرة
- الفلاتر والقائمة أصبحوا داخل Card واحدة على اليمين، مثل صفحة التوصيات
