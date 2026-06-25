begin;

insert into public.help_topics (key, name_ar, name_en, sort_order)
values
  ('workflow', 'سير العمل', 'Workflow', 10),
  ('sources', 'المصادر', 'Sources', 20),
  ('recommendations', 'التوصيات', 'Recommendations', 30),
  ('actions', 'الإجراءات', 'Actions', 40),
  ('permissions', 'الصلاحيات والأدوار', 'Roles & permissions', 50),
  ('extension_requests', 'طلبات التمديد', 'Extension requests', 60),
  ('reports', 'التقارير', 'Reports', 70),
  ('troubleshooting', 'حل المشكلات', 'Troubleshooting', 80)
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
    ((select id from topic_map where key = 'workflow'), 'workflow_overview', 'ما هو الـ workflow؟', 'What is the workflow?', 10),
    ((select id from topic_map where key = 'workflow'), 'number_preview_vs_save', 'لماذا الرقم Preview فقط؟', 'Why is the number preview only?', 20),
    ((select id from topic_map where key = 'sources'), 'source_create_how', 'كيف أنشئ Source؟', 'How do I create a source?', 30),
    ((select id from topic_map where key = 'sources'), 'source_reference_manual_or_existing', 'هل Reference No يمكن أن يكون يدويًا؟', 'Can the reference number be manual?', 40),
    ((select id from topic_map where key = 'recommendations'), 'recommendation_voice_input_how', 'كيف أستخدم المايك في Recommendation؟', 'How do I use voice input in Recommendation?', 50),
    ((select id from topic_map where key = 'recommendations'), 'recommendation_rewrite_meaning', 'ما وظيفة Rewrite؟', 'What does Rewrite do?', 60),
    ((select id from topic_map where key = 'actions'), 'action_create_how', 'كيف أنشئ Action؟', 'How do I create an action?', 70),
    ((select id from topic_map where key = 'actions'), 'action_source_first_why', 'لماذا يجب اختيار Source أولًا؟', 'Why must I choose Source first?', 80),
    ((select id from topic_map where key = 'actions'), 'action_hidden_fields_on_create', 'لماذا لا تظهر بعض الحقول أثناء الإنشاء؟', 'Why are some fields hidden on create?', 90),
    ((select id from topic_map where key = 'actions'), 'action_attachment_how', 'كيف أرفع attachment؟', 'How do I upload an attachment?', 100),
    ((select id from topic_map where key = 'permissions'), 'roles_difference_responsible_owner_verifier', 'ما الفرق بين Responsible و Owner و Verifier؟', 'What is the difference between Responsible, Owner, and Verifier?', 110),
    ((select id from topic_map where key = 'extension_requests'), 'extension_who_can_approve', 'من يوافق على Extension Request؟', 'Who can approve an extension request?', 120),
    ((select id from topic_map where key = 'extension_requests'), 'extension_after_approval_what_happens', 'ماذا يحدث بعد الموافقة على التمديد؟', 'What happens after an extension is approved?', 130),
    ((select id from topic_map where key = 'reports'), 'reports_filter_source_type', 'كيف تعمل فلترة Reports حسب Source Type؟', 'How does reports filtering by source type work?', 140),
    ((select id from topic_map where key = 'troubleshooting'), 'permissions_why_button_hidden', 'لماذا بعض الأزرار لا تظهر لي؟', 'Why can’t I see some buttons?', 150)
  on conflict (intent_key) do update
  set topic_id = excluded.topic_id,
      title_ar = excluded.title_ar,
      title_en = excluded.title_en,
      priority = excluded.priority,
      is_active = true,
      updated_at = now()
  returning id, intent_key
)
select count(*) from upsert_intents;

with intent_map as (
  select intent_key, id from public.help_intents
), phrases(intent_key, locale, phrase, normalized_phrase, weight) as (
  values
    ('workflow_overview', 'ar', 'ما هو workflow البرنامج', 'ما هو workflow البرنامج', 1.0::numeric),
    ('workflow_overview', 'ar', 'ازاي البرنامج ده شغال', 'ازاي البرنامج ده شغال', 0.95::numeric),
    ('workflow_overview', 'en', 'what is the workflow of this system', 'what is the workflow of this system', 1.0::numeric),
    ('workflow_overview', 'en', 'how does the workflow work', 'how does the workflow work', 0.95::numeric),
    ('number_preview_vs_save', 'ar', 'ليه الرقم preview بس', 'ليه الرقم preview بس', 1.0::numeric),
    ('number_preview_vs_save', 'ar', 'امتى الرقم يتاكد', 'امتى الرقم يتاكد', 0.95::numeric),
    ('number_preview_vs_save', 'en', 'why is the number preview only', 'why is the number preview only', 1.0::numeric),
    ('number_preview_vs_save', 'en', 'when is the number finalized', 'when is the number finalized', 0.95::numeric),
    ('source_create_how', 'ar', 'كيف انشئ source', 'كيف انشئ source', 1.0::numeric),
    ('source_create_how', 'ar', 'ازاي اضيف source', 'ازاي اضيف source', 0.95::numeric),
    ('source_create_how', 'en', 'how do i create a source', 'how do i create a source', 1.0::numeric),
    ('source_reference_manual_or_existing', 'ar', 'هل reference no يدوي', 'هل reference no يدوي', 1.0::numeric),
    ('source_reference_manual_or_existing', 'en', 'can reference number be manual', 'can reference number be manual', 1.0::numeric),
    ('recommendation_voice_input_how', 'ar', 'كيف استخدم المايك في recommendation', 'كيف استخدم المايك في recommendation', 1.0::numeric),
    ('recommendation_voice_input_how', 'ar', 'ازاي استخدم voice input', 'ازاي استخدم voice input', 0.95::numeric),
    ('recommendation_voice_input_how', 'en', 'how do i use voice input in recommendation', 'how do i use voice input in recommendation', 1.0::numeric),
    ('recommendation_rewrite_meaning', 'ar', 'ما وظيفة rewrite', 'ما وظيفة rewrite', 1.0::numeric),
    ('recommendation_rewrite_meaning', 'en', 'what does rewrite do', 'what does rewrite do', 1.0::numeric),
    ('action_create_how', 'ar', 'كيف انشئ action', 'كيف انشئ action', 1.0::numeric),
    ('action_create_how', 'ar', 'ازاي اضيف action', 'ازاي اضيف action', 0.95::numeric),
    ('action_create_how', 'en', 'how do i create an action', 'how do i create an action', 1.0::numeric),
    ('action_source_first_why', 'ar', 'ليه لازم اختار source الاول في action', 'ليه لازم اختار source الاول في action', 1.0::numeric),
    ('action_source_first_why', 'ar', 'لماذا يجب اختيار source اولا', 'لماذا يجب اختيار source اولا', 0.98::numeric),
    ('action_source_first_why', 'en', 'why must i choose source first', 'why must i choose source first', 1.0::numeric),
    ('action_hidden_fields_on_create', 'ar', 'ليه بعض الحقول مش ظاهرة وقت الانشاء', 'ليه بعض الحقول مش ظاهرة وقت الانشاء', 1.0::numeric),
    ('action_hidden_fields_on_create', 'en', 'why are some fields hidden on create', 'why are some fields hidden on create', 1.0::numeric),
    ('action_attachment_how', 'ar', 'كيف ارفع attachment', 'كيف ارفع attachment', 1.0::numeric),
    ('action_attachment_how', 'en', 'how do i upload attachment', 'how do i upload attachment', 1.0::numeric),
    ('roles_difference_responsible_owner_verifier', 'ar', 'ما الفرق بين responsible و owner و verifier', 'ما الفرق بين responsible و owner و verifier', 1.0::numeric),
    ('roles_difference_responsible_owner_verifier', 'en', 'difference between responsible owner and verifier', 'difference between responsible owner and verifier', 1.0::numeric),
    ('extension_who_can_approve', 'ar', 'مين يوافق على extension request', 'مين يوافق على extension request', 1.0::numeric),
    ('extension_who_can_approve', 'en', 'who can approve extension request', 'who can approve extension request', 1.0::numeric),
    ('extension_after_approval_what_happens', 'ar', 'ماذا يحدث بعد الموافقة على التمديد', 'ماذا يحدث بعد الموافقة على التمديد', 1.0::numeric),
    ('extension_after_approval_what_happens', 'en', 'what happens after extension approval', 'what happens after extension approval', 1.0::numeric),
    ('reports_filter_source_type', 'ar', 'كيف تعمل فلترة التقارير حسب source type', 'كيف تعمل فلترة التقارير حسب source type', 1.0::numeric),
    ('reports_filter_source_type', 'en', 'how does reports filtering by source type work', 'how does reports filtering by source type work', 1.0::numeric),
    ('permissions_why_button_hidden', 'ar', 'ليه بعض الازرار مش ظاهرة', 'ليه بعض الازرار مش ظاهرة', 1.0::numeric),
    ('permissions_why_button_hidden', 'en', 'why cant i see some buttons', 'why cant i see some buttons', 1.0::numeric)
)
insert into public.help_intent_phrases (intent_id, locale, phrase, normalized_phrase, weight)
select im.id, p.locale, p.phrase, p.normalized_phrase, p.weight
from phrases p
join intent_map im on im.intent_key = p.intent_key
on conflict do nothing;

with intent_map as (
  select intent_key, id, title_ar, title_en from public.help_intents
), answers(intent_key, locale, short_answer, detailed_answer, steps, note_text, warning_text, related_question_labels, quick_actions) as (
  values
    ('workflow_overview', 'ar', 'الترتيب الأساسي في النظام هو: Source ثم Recommendation ثم Action ثم Report.', 'ابدأ بتسجيل Source أولًا، ثم اربط به Recommendation، وبعدها أنشئ Action مرتبطًا بالتوصية، وأخيرًا استخدم Reports للمراجعة والطباعة.', '["أنشئ Source","أضف Recommendation تحت الـ Source","أنشئ Action مرتبطًا بالتوصية","استخدم Reports للمتابعة"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Sources","target":"/sources"}]'::jsonb),
    ('workflow_overview', 'en', 'The core system flow is: Source, then Recommendation, then Action, then Report.', 'Start by creating a Source, then add a Recommendation under it, then create an Action linked to that recommendation, and finally use Reports for review and printing.', '["Create a Source","Add a Recommendation under the source","Create an Action linked to that recommendation","Use Reports for follow-up"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Sources","target":"/sources"}]'::jsonb),
    ('number_preview_vs_save', 'ar', 'الرقم يظهر Preview فقط قبل الحفظ، ولا يتم تثبيته فعليًا إلا عند Save.', 'هذا يمنع استهلاك أرقام بدون داعٍ ويحافظ على التسلسل الصحيح عند وجود أكثر من مستخدم يعملون في نفس الوقت.', '["ابدأ الإدخال بشكل طبيعي","لاحظ رقم الـ Preview الظاهر","عند الضغط على Save فقط يتم أخذ الرقم النهائي"]'::jsonb, 'هذا السلوك مقصود ومثبت في النظام.', null, '[]'::jsonb, '[]'::jsonb),
    ('number_preview_vs_save', 'en', 'The number is shown as a preview before save and is finalized only when you click Save.', 'This avoids wasting numbers and keeps the sequence consistent when multiple users are working at the same time.', '["Start filling the form","Notice the preview number","The final number is assigned only on Save"]'::jsonb, 'This is intentional system behavior.', null, '[]'::jsonb, '[]'::jsonb),
    ('source_create_how', 'ar', 'من صفحة Sources املأ بيانات المصدر ثم احفظه ليظهر في السجل على اليمين.', 'الصفحة مصممة بحيث يكون الإدخال في جهة، والسجل في الجهة الأخرى. بعد الحفظ ستتمكن من استخدام الـ Source لاحقًا في Recommendations و Actions.', '["افتح صفحة Sources","املأ البيانات الأساسية","راجع رقم المصدر الظاهر","اضغط Save"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Sources","target":"/sources"}]'::jsonb),
    ('source_create_how', 'en', 'Open the Sources page, fill in the source details, then save it so it appears in the register.', 'The page is designed with the form on one side and the register on the other. After saving, the source becomes available for Recommendations and Actions.', '["Open the Sources page","Fill in the core details","Review the shown source number","Click Save"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Sources","target":"/sources"}]'::jsonb),
    ('source_reference_manual_or_existing', 'ar', 'Reference No يمكن أن يكون من مصدر مسجل بالفعل أو يتم إدخاله يدويًا حسب الحالة.', 'النظام يدعم الطريقتين حتى يمكنك ربط السجل بمصدر داخلي موجود أو إدخال رقم مرجعي خارجي عند الحاجة.', '["حدّد إن كان لديك مرجع موجود","اختره من القائمة إذا كان مسجلًا","أو أدخله يدويًا إذا كان مرجعًا خارجيًا"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('source_reference_manual_or_existing', 'en', 'The Reference No can come from an existing saved source or be entered manually when needed.', 'The system supports both approaches so you can link to an internal source or enter an external reference number when required.', '["Decide whether the reference already exists","Select it from the list if it exists","Or enter it manually if it is external"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('recommendation_voice_input_how', 'ar', 'يمكنك الضغط على زر المايك داخل Recommendation والبدء في الإملاء مباشرة.', 'في النسخة الحالية يوجد اختيار لغة للمساعدة في إدخال النص عربيًا أو إنجليزيًا أو بشكل Auto حسب السياق القريب من مكان الكتابة.', '["افتح صفحة Recommendations","اضغط زر المايك داخل الحقل","اختر اللغة المناسبة أو Auto","ابدأ الكلام ثم راجع النص الناتج"]'::jsonb, 'في الجمل المختلطة جدًا بين العربي والإنجليزي، اختيار اللغة يدويًا يكون أدق.', null, '[]'::jsonb, '[{"type":"navigate","label":"Open Recommendations","target":"/recommendations"}]'::jsonb),
    ('recommendation_voice_input_how', 'en', 'You can click the microphone button inside the Recommendation field and start dictating immediately.', 'The current version supports choosing Arabic, English, or Auto to improve voice input based on the text context near the cursor.', '["Open Recommendations","Click the microphone button","Choose Arabic, English, or Auto","Start speaking and review the result"]'::jsonb, 'For heavily mixed Arabic-English sentences, manual language selection is usually more accurate.', null, '[]'::jsonb, '[{"type":"navigate","label":"Open Recommendations","target":"/recommendations"}]'::jsonb),
    ('recommendation_rewrite_meaning', 'ar', 'زر Rewrite يساعد في إعادة صياغة النص ليصبح أوضح وأكثر مهنية دون تغيير المعنى الأساسي.', 'استخدمه بعد كتابة الفكرة الأولية، ثم راجع النتيجة واعتمد ما يناسبك. الهدف هو تحسين الصياغة، وليس اختراع معلومات جديدة.', '["اكتب النص الأساسي","اضغط Rewrite","راجع الصياغة الجديدة","عدّلها إذا احتجت قبل الحفظ"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('recommendation_rewrite_meaning', 'en', 'The Rewrite button helps rephrase the text into a clearer, more professional form without changing the core meaning.', 'Use it after writing the initial idea, then review the output and keep what fits. The goal is better wording, not inventing new facts.', '["Write the base text","Click Rewrite","Review the rewritten version","Adjust it before saving if needed"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('action_create_how', 'ar', 'لإنشاء Action جديدة اختر Source أولًا، ثم Recommendation، ثم أكمل باقي البيانات واحفظ.', 'صفحة Actions مرتبطة مباشرة بالـ workflow، لذلك يتم تقييد التوصيات المعروضة حسب الـ Source المختار لتقليل الأخطاء.', '["افتح صفحة Actions","اختر Source","اختر Recommendation من القائمة المتفلترة","أكمل الحقول الأساسية واضغط Save"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_create_how', 'en', 'To create a new Action, choose the Source first, then the Recommendation, complete the remaining fields, and save.', 'The Actions page is tightly linked to the workflow, so recommendations are filtered by the selected source to reduce mistakes.', '["Open the Actions page","Choose the Source","Pick the Recommendation from the filtered list","Complete the core fields and click Save"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_source_first_why', 'ar', 'يجب اختيار Source أولًا لأن Recommendations في صفحة Actions تتفلتر بناءً عليه.', 'هذا يمنع ربط Action بتوصية ليست تحت نفس المصدر ويحافظ على التسلسل المنطقي للـ workflow.', '["اختر Source","افتح قائمة Recommendation","اختر التوصية من النتائج الظاهرة فقط"]'::jsonb, 'لو كانت الفلاتر على All في السجل، يمكن عرض كل الـ actions، لكن داخل الإنشاء يظل Source first أساسيًا.', null, '[{"label":"لماذا لا تظهر بعض الحقول أثناء الإنشاء؟","intentKey":"action_hidden_fields_on_create"}]'::jsonb, '[]'::jsonb),
    ('action_source_first_why', 'en', 'You must choose the Source first because Recommendations on the Actions page are filtered based on it.', 'This prevents linking an Action to a Recommendation under a different source and keeps the workflow structure correct.', '["Choose the Source","Open the Recommendation list","Pick from the filtered results only"]'::jsonb, 'Even if the register filters are set to All, Source-first still applies during creation.', null, '[{"label":"Why are some fields hidden on create?","intentKey":"action_hidden_fields_on_create"}]'::jsonb, '[]'::jsonb),
    ('action_hidden_fields_on_create', 'ar', 'بعض الحقول تظهر فقط أثناء Edit Action وليس أثناء الإنشاء الأولي.', 'الحقول مثل Completed date و Verified date و Progress و Extension details تم تأجيلها لوضع التعديل للحفاظ على بساطة مرحلة الإنشاء.', '["أنشئ الـ Action واحفظه","افتحه مرة أخرى في وضع التعديل","ستظهر الحقول الإضافية هناك"]'::jsonb, 'هذا سلوك مقصود في النسخة الحالية.', null, '[]'::jsonb, '[]'::jsonb),
    ('action_hidden_fields_on_create', 'en', 'Some fields are shown only in Edit mode, not during the initial Action creation.', 'Fields such as Completed date, Verified date, Progress, and Extension details are intentionally deferred to edit mode to keep creation simpler.', '["Create and save the Action","Open it again in edit mode","The additional fields will appear there"]'::jsonb, 'This is intentional in the current version.', null, '[]'::jsonb, '[]'::jsonb),
    ('action_attachment_how', 'ar', 'يمكنك رفع attachment بعد حفظ الـ Action، وخاصة من شاشة التفاصيل أو التعديل.', 'إذا كانت الـ Action جديدة تمامًا فالأفضل حفظها أولًا، ثم استخدام الرفع من شاشة التفاصيل أو التعديل حيث يكون الربط بالسجل واضحًا.', '["احفظ الـ Action أولًا","افتح شاشة التفاصيل أو التعديل","استخدم جزء الـ attachments لرفع الملف"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_attachment_how', 'en', 'You can upload an attachment after saving the Action, especially from the details or edit screen.', 'If the Action is brand new, save it first, then upload the file from the details or edit view where the record linkage is already established.', '["Save the Action first","Open the details or edit view","Use the attachments section to upload the file"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('roles_difference_responsible_owner_verifier', 'ar', 'Responsible هو المنفذ الفعلي، Owner هو صاحب المسؤولية والمتابعة، و Verifier هو من يراجع الإغلاق النهائي.', 'الفصل بين الأدوار مهم في النظام حتى لا تختلط مسؤولية التنفيذ مع المتابعة مع التحقق النهائي.', '["Responsible ينفذ العمل","Owner يتابع الالتزام والموعد","Verifier يراجع صحة الإغلاق قبل الاعتماد"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('roles_difference_responsible_owner_verifier', 'en', 'Responsible is the actual executor, Owner is accountable for follow-up and commitment, and Verifier reviews final closure.', 'Separating these roles is important so execution, accountability, and final verification do not get mixed together.', '["Responsible performs the work","Owner follows up on commitment and due date","Verifier checks the closure before final approval"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('extension_who_can_approve', 'ar', 'الموافقة على Extension Request تكون من PSM Manager أو Admin فقط.', 'المستخدم المسؤول أو الـ Owner يمكنهم طلب التمديد، لكن الاعتماد النهائي يبقى لمن لديهم صلاحية approval.', '["افتح الـ Action المطلوبة","راجع طلب التمديد","إذا كانت لديك الصلاحية سيظهر لك إجراء الاعتماد"]'::jsonb, null, null, '[{"label":"ماذا يحدث بعد الموافقة على التمديد؟","intentKey":"extension_after_approval_what_happens"}]'::jsonb, '[]'::jsonb),
    ('extension_who_can_approve', 'en', 'An Extension Request can be approved only by a PSM Manager or Admin.', 'Responsible users or owners may submit the extension request, but final approval belongs to users with the approval permission.', '["Open the target Action","Review the extension request","If you have permission, the approval control will be available"]'::jsonb, null, null, '[{"label":"What happens after approval?","intentKey":"extension_after_approval_what_happens"}]'::jsonb, '[]'::jsonb),
    ('extension_after_approval_what_happens', 'ar', 'بعد الموافقة يتم تحديث due date إلى التاريخ الجديد، مع الاحتفاظ بالتاريخ القديم كمرجع.', 'النظام يسجل previous due date داخل طلب التمديد ويحدّث بيانات الـ Action نفسها بالتاريخ الجديد الموافق عليه.', '["اعتماد طلب التمديد","تحديث due date في الـ Action","الاحتفاظ بالتاريخ السابق كمرجع"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('extension_after_approval_what_happens', 'en', 'After approval, the due date is updated to the new approved date while the old date remains as a reference.', 'The system stores the previous due date on the extension request and updates the Action with the approved new date.', '["Approve the extension request","Update the Action due date","Keep the old date as reference"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('reports_filter_source_type', 'ar', 'في Reports يمكنك اختيار Source Type أولًا، ثم تحديد Source من القائمة التابعة له أو اختيار All.', 'هذا التدرج يجعل التقارير أدق، خاصة عندما يكون عندك أكثر من نوع مصادر مثل Incident أو Audit أو Committee.', '["افتح صفحة Reports","اختر Source Type","اختر Source محدد أو All","اعرض التقرير"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),
    ('reports_filter_source_type', 'en', 'On the Reports page, choose the Source Type first, then select a Source under that type or choose All.', 'This hierarchy makes reporting more accurate, especially when you have multiple source types such as Incident, Audit, or Committee.', '["Open Reports","Choose the Source Type","Select a specific Source or All","Display the report"]'::jsonb, null, null, '[]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),
    ('permissions_why_button_hidden', 'ar', 'غالبًا السبب أن الزر مرتبط بصلاحية أو دور غير متاحين لك حاليًا.', 'بعض الأزرار والإجراءات في النظام تظهر فقط إذا كانت لديك permission مناسبة مثل reports.view أو logs.view أو actions.verify.', '["راجع دورك الحالي","تحقق من الصلاحيات المرتبطة بالصفحة","اطلب من الأدمن تعديل الصلاحية إذا لزم الأمر"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb),
    ('permissions_why_button_hidden', 'en', 'Most likely the button is tied to a role or permission that you do not currently have.', 'Some buttons and actions appear only when your profile has the right permission, such as reports.view, logs.view, or actions.verify.', '["Check your current role","Review the permissions tied to that page","Ask the admin to adjust the permission if needed"]'::jsonb, null, null, '[]'::jsonb, '[]'::jsonb)
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
    ('workflow_overview', 'dashboard', '/dashboard', 10, true),
    ('number_preview_vs_save', 'sources', '/sources', 20, false),
    ('number_preview_vs_save', 'recommendations', '/recommendations', 20, false),
    ('number_preview_vs_save', 'actions', '/actions', 20, false),
    ('source_create_how', 'sources', '/sources', 10, true),
    ('source_reference_manual_or_existing', 'sources', '/sources', 20, false),
    ('recommendation_voice_input_how', 'recommendations', '/recommendations', 10, true),
    ('recommendation_rewrite_meaning', 'recommendations', '/recommendations', 20, false),
    ('action_create_how', 'actions', '/actions', 10, true),
    ('action_source_first_why', 'actions', '/actions', 20, false),
    ('action_hidden_fields_on_create', 'actions', '/actions', 30, false),
    ('action_attachment_how', 'actions', '/actions', 40, false),
    ('roles_difference_responsible_owner_verifier', 'actions', '/actions', 50, false),
    ('extension_who_can_approve', 'actions', '/actions', 60, false),
    ('extension_after_approval_what_happens', 'actions', '/actions', 70, false),
    ('reports_filter_source_type', 'reports', '/reports', 10, true),
    ('permissions_why_button_hidden', 'settings', '/settings', 30, false),
    ('permissions_why_button_hidden', 'reports', '/reports', 30, false),
    ('permissions_why_button_hidden', 'logs', '/logs', 30, false)
)
insert into public.help_page_contexts (intent_id, page_key, route_pattern, sort_order, is_primary)
select im.id, c.page_key, c.route_pattern, c.sort_order, c.is_primary
from contexts c
join intent_map im on im.intent_key = c.intent_key
on conflict do nothing;

commit;
