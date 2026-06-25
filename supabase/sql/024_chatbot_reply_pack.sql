begin;

insert into public.help_topics (key, name_ar, name_en, sort_order)
values
  ('logs', 'السجلات', 'Logs', 75),
  ('settings', 'الإعدادات', 'Settings', 76)
on conflict (key) do update
set name_ar = excluded.name_ar,
    name_en = excluded.name_en,
    sort_order = excluded.sort_order,
    is_active = true;

with topic_map as (
  select key, id from public.help_topics
), upsert_intents as (
  insert into public.help_intents (topic_id, intent_key, title_ar, title_en, priority)
  values
    ((select id from topic_map where key = 'actions'), 'action_update_how', 'كيف أعدل Action؟', 'How do I update an Action?', 34),
    ((select id from topic_map where key = 'actions'), 'action_details_what_can_i_do', 'ماذا أفعل داخل Action details؟', 'What can I do inside Action details?', 36),
    ((select id from topic_map where key = 'recommendations'), 'recommendation_text_tips', 'كيف أكتب Recommendation بشكل واضح؟', 'How do I write a clear Recommendation?', 26),
    ((select id from topic_map where key = 'reports'), 'reports_review_and_print', 'كيف أراجع أو أطبع التقرير؟', 'How do I review or print the report?', 16),
    ((select id from topic_map where key = 'logs'), 'logs_filters_and_pagination', 'كيف أستخدم الفلاتر وpagination في Logs؟', 'How do I use filters and pagination in Logs?', 18),
    ((select id from topic_map where key = 'settings'), 'settings_users_roles_help', 'ما الذي أفعله في صفحة Settings؟', 'What can I do in Settings?', 18)
  on conflict (intent_key) do update
  set topic_id = excluded.topic_id,
      title_ar = excluded.title_ar,
      title_en = excluded.title_en,
      priority = excluded.priority,
      is_active = true,
      updated_at = now()
  returning intent_key, id
), intent_map as (
  select intent_key, id from public.help_intents
  where intent_key in (
    'action_update_how',
    'action_details_what_can_i_do',
    'recommendation_text_tips',
    'reports_review_and_print',
    'logs_filters_and_pagination',
    'settings_users_roles_help'
  )
), phrases(intent_key, locale, phrase, normalized_phrase, weight) as (
  values
    ('action_update_how', 'ar', 'كيف أعدل Action', 'كيف اعدل action', 1.15),
    ('action_update_how', 'ar', 'ازاي اعدل الاكشن', 'ازاي اعدل الاكشن', 1.10),
    ('action_update_how', 'en', 'how do i update an action', 'how do i update an action', 1.15),
    ('action_update_how', 'en', 'edit action', 'edit action', 1.05),

    ('action_details_what_can_i_do', 'ar', 'ماذا أفعل داخل action details', 'ماذا افعل داخل action details', 1.15),
    ('action_details_what_can_i_do', 'ar', 'ايه اللي اقدر اعمله جوه تفاصيل الاكشن', 'ايه اللي اقدر اعمله جوه تفاصيل الاكشن', 1.10),
    ('action_details_what_can_i_do', 'en', 'what can i do inside action details', 'what can i do inside action details', 1.15),
    ('action_details_what_can_i_do', 'en', 'action details help', 'action details help', 1.05),

    ('recommendation_text_tips', 'ar', 'كيف أكتب recommendation بشكل واضح', 'كيف اكتب recommendation بشكل واضح', 1.15),
    ('recommendation_text_tips', 'ar', 'عايز اكتب توصية كويسه', 'عايز اكتب توصيه كويسه', 1.10),
    ('recommendation_text_tips', 'en', 'how do i write a clear recommendation', 'how do i write a clear recommendation', 1.15),
    ('recommendation_text_tips', 'en', 'recommendation writing tips', 'recommendation writing tips', 1.05),

    ('reports_review_and_print', 'ar', 'كيف أراجع أو أطبع التقرير', 'كيف اراجع او اطبع التقرير', 1.15),
    ('reports_review_and_print', 'ar', 'طباعة التقرير', 'طباعه التقرير', 1.10),
    ('reports_review_and_print', 'en', 'how do i review or print the report', 'how do i review or print the report', 1.15),
    ('reports_review_and_print', 'en', 'print report', 'print report', 1.10),

    ('logs_filters_and_pagination', 'ar', 'كيف أستخدم الفلاتر وpagination في logs', 'كيف استخدم الفلاتر pagination في logs', 1.15),
    ('logs_filters_and_pagination', 'ar', 'فلترة اللوجز', 'فلتره اللوجز', 1.10),
    ('logs_filters_and_pagination', 'en', 'how do i use filters and pagination in logs', 'how do i use filters and pagination in logs', 1.15),
    ('logs_filters_and_pagination', 'en', 'logs filters and pagination', 'logs filters and pagination', 1.10),

    ('settings_users_roles_help', 'ar', 'ما الذي أفعله في صفحة settings', 'ما الذي افعله في صفحه settings', 1.15),
    ('settings_users_roles_help', 'ar', 'صفحة الاعدادات فيها ايه', 'صفحه الاعدادات فيها ايه', 1.10),
    ('settings_users_roles_help', 'en', 'what can i do in settings', 'what can i do in settings', 1.15),
    ('settings_users_roles_help', 'en', 'settings page help', 'settings page help', 1.10)
)
insert into public.help_intent_phrases (intent_id, locale, phrase, normalized_phrase, weight, is_active)
select im.id, p.locale, p.phrase, p.normalized_phrase, p.weight, true
from phrases p
join intent_map im on im.intent_key = p.intent_key
on conflict (intent_id, locale, normalized_phrase) do update
set phrase = excluded.phrase,
    weight = excluded.weight,
    is_active = true;

with intent_map as (
  select intent_key, id from public.help_intents
), answers(intent_key, locale, short_answer, detailed_answer, steps, note_text, warning_text, related_question_labels, quick_actions) as (
  values
    ('action_update_how', 'ar', 'بعد إنشاء الـ Action وحفظها، افتح السجل نفسه مرة أخرى في وضع التعديل لتحديث الحقول الإضافية.', 'التعديل يتم عادة من نفس سجل الـ Action أو من شاشة التفاصيل. وهناك ستظهر الحقول التي لا تظهر في مرحلة الإنشاء الأولي مثل بعض بيانات الإغلاق أو المتابعة.', '["احفظ الـ Action أولًا إذا كانت جديدة","افتح السجل من القائمة أو التفاصيل","عدّل الحقول المطلوبة ثم احفظ التغييرات"]'::jsonb, 'لو كنت تبحث عن Completed date أو Verified date فغالبًا ستجدها في وضع التعديل وليس الإنشاء.', null, '[{"label":"لماذا لا تظهر بعض الحقول أثناء الإنشاء؟","intentKey":"action_hidden_fields_on_create"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_update_how', 'en', 'After creating and saving the Action, open the same record again in edit mode to update the additional fields.', 'Updating is usually done from the Action row itself or from the details screen. That is where fields hidden during initial creation become available.', '["Save the Action first if it is new","Open the record from the list or details page","Update the needed fields and save"]'::jsonb, 'If you are looking for Completed date or Verified date, they are usually in edit mode rather than create mode.', null, '[{"label":"Why are some fields hidden on create?","intentKey":"action_hidden_fields_on_create"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),

    ('action_details_what_can_i_do', 'ar', 'داخل Action details يمكنك مراجعة البيانات، متابعة التحديثات، رفع المرفقات، والتعامل مع التمديد أو التحقق حسب الصلاحية.', 'هذه الشاشة مناسبة أكثر بعد حفظ الـ Action، لأنها تعرض السجل بصورة أوضح وتربطك بالمرفقات والتحديثات والطلبـات المرتبطة به.', '["افتح Action من القائمة","راجع البيانات الحالية","أضف مرفقات أو تحديثات عند الحاجة","تعامل مع التمديد أو التحقق إذا كانت الصلاحية متاحة"]'::jsonb, null, null, '[{"label":"كيف أرفع attachment؟","intentKey":"action_attachment_how"},{"label":"كيف أعدل Action؟","intentKey":"action_update_how"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_details_what_can_i_do', 'en', 'Inside Action details you can review the record, follow updates, upload attachments, and handle extension or verification depending on your permission.', 'This screen becomes more useful after the Action is saved because it gives a clearer view of the record and its attachments, updates, and related requests.', '["Open the Action from the list","Review the current data","Add attachments or updates when needed","Handle extension or verification if you have permission"]'::jsonb, null, null, '[{"label":"How do I add attachments?","intentKey":"action_attachment_how"},{"label":"How do I update an Action?","intentKey":"action_update_how"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),

    ('recommendation_text_tips', 'ar', 'أفضل Recommendation تكون واضحة وقابلة للتنفيذ ومختصرة ومربوطة بالمشكلة أو المصدر.', 'اكتب ما المطلوب فعله بالضبط، وبصياغة عملية، وتجنب الجمل العامة جدًا. وإذا احتجت تحسين الصياغة يمكنك استخدام rewrite بعد كتابة النص الأساسي.', '["ابدأ بالفعل المطلوب أو التغيير المقترح","اجعل التوصية محددة وليست عامة","اربطها بالمشكلة أو المصدر إن أمكن","استخدم rewrite لتحسين الصياغة لا لتغيير المعنى بالكامل"]'::jsonb, 'الأفضل دائمًا أن تكتب الفكرة الأصلية أولًا ثم تستخدم أدوات المساعدة للتحسين فقط.', null, '[{"label":"كيف أنشئ Recommendation؟","intentKey":"recommendation_create_how"},{"label":"ما وظيفة rewrite؟","intentKey":"recommendation_rewrite_meaning"}]'::jsonb, '[]'::jsonb),
    ('recommendation_text_tips', 'en', 'A good Recommendation should be clear, actionable, concise, and tied to the issue or source.', 'State exactly what should be done, keep it practical, and avoid overly generic wording. If needed, use rewrite after writing the core idea first.', '["Start with the required action or proposed change","Keep it specific rather than generic","Tie it to the issue or source whenever possible","Use rewrite to improve wording, not to replace your intent completely"]'::jsonb, 'It is best to write the original idea first, then use helper tools only for polishing.', null, '[{"label":"How do I create a Recommendation?","intentKey":"recommendation_create_how"},{"label":"What does rewrite do?","intentKey":"recommendation_rewrite_meaning"}]'::jsonb, '[]'::jsonb),

    ('reports_review_and_print', 'ar', 'بعد اختيار Source Type وSource المناسب، راجع النتائج ثم استخدم الطباعة أو التصدير حسب المتاح في الصفحة الحالية.', 'الأفضل أن تضبط الفلاتر أولًا حتى يظهر لك التقرير المطلوب فقط، ثم تراجع المحتوى النهائي قبل الطباعة أو الحفظ.', '["افتح Reports","اختر Source Type وSource أو All","راجع النتائج المعروضة","اطبع أو صدّر من الخيار المتاح في الصفحة"]'::jsonb, 'اختيار فلتر صحيح قبل الطباعة يوفر عليك إعادة المحاولة ويجعل التقرير أنظف.', null, '[{"label":"كيف أستخدم Reports؟","intentKey":"reports_how_to_use"},{"label":"كيف تعمل فلترة Reports؟","intentKey":"reports_filter_source_type"}]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),
    ('reports_review_and_print', 'en', 'After choosing the correct Source Type and Source, review the results and then use print or export from the current page.', 'Set the filters first so only the required report appears, then review the final content before printing or saving.', '["Open Reports","Choose the Source Type and a Source or All","Review the displayed results","Print or export from the available option on the page"]'::jsonb, 'Correct filtering before printing usually gives a cleaner report and saves time.', null, '[{"label":"How do I use Reports?","intentKey":"reports_how_to_use"},{"label":"How does Reports filtering work?","intentKey":"reports_filter_source_type"}]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),

    ('logs_filters_and_pagination', 'ar', 'استخدم الفلاتر أولًا لتقليل النتائج، ثم تنقل بين الصفحات باستخدام pagination لمراجعة السجلات بشكل أسرع.', 'صفحة Logs غالبًا تعرض عددًا كبيرًا من السجلات، لذلك الأفضل أن تضبط الفلاتر أو النوع أو التاريخ إن وجد، ثم تنتقل بين الصفحات بدل البحث اليدوي الطويل.', '["افتح Logs","حدّد الفلاتر المناسبة إن وجدت","راجع النتائج الحالية","انتقل بين الصفحات باستخدام pagination"]'::jsonb, 'لو لم تظهر الصفحة من الأساس فقد تكون المشكلة صلاحيات وليست فلترة.', null, '[{"label":"ما الذي تسجله Logs؟","intentKey":"logs_what_is_tracked"},{"label":"لماذا لا تظهر لي Logs؟","intentKey":"logs_why_not_visible"}]'::jsonb, '[{"type":"navigate","label":"Open Logs","target":"/logs"}]'::jsonb),
    ('logs_filters_and_pagination', 'en', 'Use filters first to narrow the results, then move through the pages with pagination to review records faster.', 'The Logs page can hold many records, so it is better to filter by what you need and then page through the results rather than scanning everything manually.', '["Open Logs","Set the relevant filters if available","Review the current results","Move between pages using pagination"]'::jsonb, 'If the page itself is not visible, the issue may be permissions rather than filtering.', null, '[{"label":"What is tracked in Logs?","intentKey":"logs_what_is_tracked"},{"label":"Why can’t I see Logs?","intentKey":"logs_why_not_visible"}]'::jsonb, '[{"type":"navigate","label":"Open Logs","target":"/logs"}]'::jsonb),

    ('settings_users_roles_help', 'ar', 'صفحة Settings مخصصة عادة لإدارة المستخدمين والأدوار والصلاحيات وبعض إعدادات الوصول داخل النظام.', 'إذا كانت لديك الصلاحية، يمكنك من خلالها مراجعة المستخدمين، الأدوار، ومن يرى ماذا داخل النظام. وبعض المستخدمين قد يرون أجزاء أقل حسب role أو permission.', '["افتح Settings","راجع المستخدمين أو الأدوار المتاحة","تحقق من الصلاحيات المرتبطة بكل دور","نفّذ التعديل فقط إذا كانت الصلاحية متاحة لك"]'::jsonb, 'لو لم تظهر لك بعض الخيارات داخل Settings فقد يكون ذلك طبيعيًا حسب دورك الحالي.', null, '[{"label":"لماذا لا أرى بعض الأزرار؟","intentKey":"permissions_why_button_hidden"},{"label":"ما الفرق بين Responsible و Owner و Verifier؟","intentKey":"roles_difference_responsible_owner_verifier"}]'::jsonb, '[{"type":"navigate","label":"Open Settings","target":"/settings"}]'::jsonb),
    ('settings_users_roles_help', 'en', 'The Settings page is usually used to manage users, roles, permissions, and some access-related setup inside the system.', 'If you have permission, you can review users, roles, and what each role can access. Some users will naturally see fewer options depending on their role or permissions.', '["Open Settings","Review the available users or roles","Check the permissions linked to each role","Make changes only if that access is allowed for you"]'::jsonb, 'If some options are hidden inside Settings, that may be normal for your current role.', null, '[{"label":"Why are some buttons hidden?","intentKey":"permissions_why_button_hidden"},{"label":"What is the difference between Responsible, Owner, and Verifier?","intentKey":"roles_difference_responsible_owner_verifier"}]'::jsonb, '[{"type":"navigate","label":"Open Settings","target":"/settings"}]'::jsonb)
)
insert into public.help_answers (
  intent_id,
  locale,
  short_answer,
  detailed_answer,
  steps,
  note_text,
  warning_text,
  related_question_labels,
  quick_actions,
  version_no,
  is_active
)
select
  im.id,
  a.locale,
  a.short_answer,
  a.detailed_answer,
  a.steps,
  a.note_text,
  a.warning_text,
  a.related_question_labels,
  a.quick_actions,
  1,
  true
from answers a
join intent_map im on im.intent_key = a.intent_key
on conflict (intent_id, locale, version_no) do update
set short_answer = excluded.short_answer,
    detailed_answer = excluded.detailed_answer,
    steps = excluded.steps,
    note_text = excluded.note_text,
    warning_text = excluded.warning_text,
    related_question_labels = excluded.related_question_labels,
    quick_actions = excluded.quick_actions,
    is_active = true,
    updated_at = now();

with intent_map as (
  select intent_key, id from public.help_intents
), contexts(intent_key, page_key, route_pattern, sort_order, is_primary) as (
  values
    ('action_update_how', 'actions', '/actions', 35, false),
    ('action_update_how', 'action_details', '/actions', 20, false),
    ('action_details_what_can_i_do', 'action_details', '/actions', 8, true),
    ('recommendation_text_tips', 'recommendations', '/recommendations', 15, false),
    ('reports_review_and_print', 'reports', '/reports', 16, false),
    ('logs_filters_and_pagination', 'logs', '/logs', 18, false),
    ('settings_users_roles_help', 'settings', '/settings', 12, true)
)
insert into public.help_page_contexts (intent_id, page_key, route_pattern, sort_order, is_primary)
select im.id, c.page_key, c.route_pattern, c.sort_order, c.is_primary
from contexts c
join intent_map im on im.intent_key = c.intent_key
on conflict do nothing;

with intent_map as (
  select intent_key, id from public.help_intents
), related(source_key, related_key, sort_order) as (
  values
    ('action_details_what_can_i_do', 'action_attachment_how', 10),
    ('action_details_what_can_i_do', 'action_update_how', 20),
    ('action_update_how', 'action_hidden_fields_on_create', 10),
    ('recommendation_text_tips', 'recommendation_rewrite_meaning', 10),
    ('reports_review_and_print', 'reports_filter_source_type', 10),
    ('logs_filters_and_pagination', 'logs_what_is_tracked', 10),
    ('settings_users_roles_help', 'permissions_why_button_hidden', 10)
)
insert into public.help_related_intents (source_intent_id, related_intent_id, sort_order)
select s.id, r.id, rel.sort_order
from related rel
join intent_map s on s.intent_key = rel.source_key
join intent_map r on r.intent_key = rel.related_key
on conflict (source_intent_id, related_intent_id) do update
set sort_order = excluded.sort_order;

commit;
