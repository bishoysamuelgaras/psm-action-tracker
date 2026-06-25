# STEP 31 — Recommendations + Actions final cleanup

## ماذا اتعدل
- Recommendation form بقى مرتب بشكل رأسي وواضح:
  - Source
  - Recommendation no.
  - Category
  - Priority
  - ثم Preview
  - ثم Recommendation details
- تم استبدال Field المحلي بـ FormField الموحد.
- تم تبسيط Snapshot في Recommendation باستخدام selectedSource بدل تكرار البحث أكثر من مرة.
- Action form بقى بنفس الأسلوب المحافظ:
  - Recommendation
  - Action no.
  - ثم Preview
  - ثم باقي الحقول
- تقليل ازدحام الحقول في Action form، خصوصًا في التنفيذ والتواريخ.

## ملاحظات
- لم يتم لمس APIs أو workflow أو الترقيم.
- التعديل UI فقط وبشكل محافظ.
- لو ظهرت مشكلة build محليًا، تأكد أولًا من تثبيت الحزم:
  - npm install
