التعديل ده بسيط ومحافظ جدًا.

اللي اتعمل:
- إخفاء الـ mobile top nav أثناء طباعة Incident report.
- إخفاء جزء Reports library وبطاقات التقارير أثناء الطباعة فقط.

الملفات:
- src/components/layout/AppMobileNav.tsx
- src/features/reports/pages/ReportsPage.tsx

ملحوظة:
- التعديل لا يغيّر شكل الصفحة أثناء الاستخدام العادي.
- الإخفاء فقط وقت الطباعة / Save as PDF عندما يكون وضع الطباعة = incident-report.
