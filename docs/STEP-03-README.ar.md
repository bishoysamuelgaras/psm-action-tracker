# Step 03 — Auth الحقيقي + Roles + أول ربط للداتا

الخطوة دي تضيف 3 حاجات مهمة جدًا:

1. **تسجيل دخول فعلي** من Supabase Auth
2. **تحميل الـ profile + role** من جدول `public.profiles`
3. **ربط Dashboard بداتا حقيقية** من جدول `actions`

---

## الملفات التي ستنسخها
انسخ كل الملفات داخل هذا الـ patch فوق المشروع الحالي بنفس المسارات.

أهم الملفات:
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/components/ProtectedRoute.tsx`
- `src/app/router.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/features/dashboard/api/dashboard.api.ts`
- `src/features/dashboard/hooks/useDashboardOverview.ts`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `supabase/sql/007_assign_roles_examples.sql`

---

## المطلوب تعمله فين بالضبط

### 1) في Supabase Dashboard
افتح:
- **Authentication**
- **Users**

ثم اعمل:
- **Add user**
- اكتب الإيميل والباسورد
- فعّل تأكيد الإيميل لو ظهر الاختيار

بعد إنشاء المستخدم:
- افتح **SQL Editor**
- افتح الملف:
  - `supabase/sql/007_assign_roles_examples.sql`
- انسخ الاستعلام المناسب وعدّل الإيميل والاسم والمسمى الوظيفي
- شغله

> مهم: لازم المستخدم يكون موجود في **Auth** أولًا، وبعدها صفه سيتولد تلقائيًا في `public.profiles` من التريجر اللي اتعمل في Step 2.

---

### 2) محليًا على المشروع
بعد نسخ الملفات:

```bash
npm run dev
```

ثم افتح التطبيق وسجل الدخول بالمستخدم الذي أنشأته في Supabase.

---

## ما الذي ستراه بعد التطبيق

### في صفحة Login
- تسجيل دخول حقيقي
- تنبيه واضح أن الحساب لازم يكون له profile داخل `public.profiles`

### في الـ route protection
- أي مستخدم غير مسجل دخول يذهب إلى `/login`
- أي مستخدم دوره غير مناسب يذهب إلى `/unauthorized`
- صفحة `Settings` أصبحت محمية ومسموح بها فقط لـ:
  - `admin`
  - `psm_manager`

### في الـ Sidebar
- العناصر تظهر حسب الدور
- مثلًا `Settings` لن تظهر لـ `viewer`

### في الـ Header
- يظهر اسم المستخدم
- الإيميل
- الـ role badge

### في Dashboard
- بيانات المستخدم الحالية من `profiles`
- KPIs حقيقية من جدول `actions`
- أقرب actions مستحقة حسب `due_date`

---

## لو ظهر خطأ بعد تسجيل الدخول

### حالة 1: Profile loading issue
هذا معناه غالبًا واحد من الآتي:
- Step 2 SQL لم يُنفذ بالكامل
- المستخدم موجود في Auth لكن ليس له row صحيح في `profiles`
- role_code غير مضبوط

الحل:
- راجع Step 2
- ثم نفّذ `007_assign_roles_examples.sql`

### حالة 2: Unauthorized
معناه المستخدم دخَل بنجاح لكن دوره لا يسمح بهذه الصفحة.

---

## ملاحظات مهمة
- هذه الخطوة **تقرأ من الداتا الحقيقية** لكنها لا تضيف CRUD screens بعد
- ما زلنا محافظين على الهيكل ومنظّمين جدًا قبل الدخول في الشاشات الثقيلة
- الخطوة التالية ستكون مناسبة جدًا لبدء:
  - Sources list
  - Source create form
  - Recommendations list/create

