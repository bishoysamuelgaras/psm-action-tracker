# Step 09 — Dashboard Upgrade + Read-only cleanup

الخطوة دي فيها 3 تحسينات رئيسية:

1. **ترقية الـ Dashboard**
   - KPIs أوضح
   - Upcoming actions
   - Owner workload
   - Department snapshot
   - Priority split

2. **تفعيل read-only بشكل أنظف**
   - صفحة Sources تعرض التفاصيل بشكل واضح في وضع القراءة
   - صفحة Recommendations تسمح باختيار أي recommendation وعرضها حتى لو المستخدم read-only
   - صفحة Action details تعرض الـ timeline والـ attachments بدون فورمات معطلة مزعجة

3. **تنضيف النصوص الزائدة**
   - إزالة placeholder / step text غير المهم
   - تبسيط النصوص في الـ login / protected route / sidebar / settings

## التنفيذ

1. فك الضغط.
2. انسخ الملفات فوق مشروعك الحالي بنفس المسارات.
3. شغّل:

```bash
npm run dev
```

## ملاحظات

- لا يوجد SQL جديد في الخطوة دي.
- الخطوة مبنية على كل اللي قبلها.
- لو ظهر أي خطأ TypeScript أو runtime ابعتهولي كما هو وأنا أرجعهولك في patch إصلاح مباشر.
