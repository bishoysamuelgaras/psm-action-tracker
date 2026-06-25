تم إصلاح أخطاء الـ build الأخيرة في ActionForm بشكل محافظ.

الذي تم إصلاحه:
- إزالة الاعتماد على extensionReason و evidenceSummary من ActionListItem عند فتح وضع التعديل.
- استخدام شكل departments الحالي بدون الاعتماد على code.
- الإبقاء على دعم users + departments + manual names كما هو.

انسخ الملف فوق مشروعك بنفس المسار ثم شغل:
- npm run build
