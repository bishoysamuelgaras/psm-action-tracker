تم تعديل حقل Responsible داخل Action form بحيث يعرض مجموعتين داخل نفس الـ dropdown:
- System users
- Departments

لو اخترت Department، سيتم حفظ اسم الإدارة داخل الاسم اليدوي للمسؤول، مع إبقاء Source = From system كما هو.

الملفات المعدلة:
- src/features/actions/api/actions.api.ts
- src/features/actions/components/ActionForm.tsx
