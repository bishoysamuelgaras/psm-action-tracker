begin;

insert into public.help_topics (key, name_ar, name_en, sort_order)
values
  ('verification', 'التحقق', 'Verification', 65),
  ('logs', 'السجلات', 'Logs', 75)
on conflict (key) do update
set name_ar = excluded.name_ar,
    name_en = excluded.name_en,
    sort_order = excluded.sort_order,
    is_active = true;

with topic_map as (
  select key, id from public.help_topics
), intents(topic_key, intent_key, title_ar, title_en, priority) as (
  values
    ('workflow', 'workflow_first_step', 'ما أول خطوة في النظام؟', 'What is the first step in the system?', 15),
    ('sources', 'source_reference_no_meaning', 'ما معنى reference no.؟', 'What does reference no. mean?', 35),
    ('recommendations', 'recommendation_create_how', 'كيف أنشئ Recommendation؟', 'How do I create a Recommendation?', 45),
    ('actions', 'action_filtering_logic', 'كيف تعمل الفلاتر في Actions؟', 'How do Actions filters work?', 95),
    ('extension_requests', 'extension_who_can_request', 'من يقدر يطلب Extension Request؟', 'Who can request an extension?', 115),
    ('verification', 'verification_queue_meaning', 'ما معنى Completed Actions need verification؟', 'What does Completed Actions need verification mean?', 125),
    ('verification', 'verification_who_can_do', 'من يقدر يعمل verification؟', 'Who can perform verification?', 126),
    ('reports', 'reports_how_to_use', 'كيف أستخدم Reports؟', 'How do I use Reports?', 145),
    ('logs', 'logs_what_is_tracked', 'ما الذي تسجله Logs؟', 'What is tracked in Logs?', 155),
    ('logs', 'logs_why_not_visible', 'لماذا لا تظهر لي Logs؟', 'Why can’t I see Logs?', 156)
)
insert into public.help_intents (topic_id, intent_key, title_ar, title_en, priority)
select tm.id, i.intent_key, i.title_ar, i.title_en, i.priority
from intents i
join topic_map tm on tm.key = i.topic_key
on conflict (intent_key) do update
set topic_id = excluded.topic_id,
    title_ar = excluded.title_ar,
    title_en = excluded.title_en,
    priority = excluded.priority,
    is_active = true,
    updated_at = now();

with intent_map as (
  select intent_key, id from public.help_intents
), phrases(intent_key, locale, phrase, normalized_phrase, weight) as (
  values
    ('workflow_first_step', 'ar', 'ما اول خطوة في النظام', 'ما اول خطوه في النظام', 1.0),
    ('workflow_first_step', 'ar', 'ابدأ منين في البرنامج', 'ابدا منين في البرنامج', 1.1),
    ('workflow_first_step', 'ar', 'اعمل ايه الاول', 'اعمل ايه الاول', 1.0),
    ('workflow_first_step', 'en', 'what is the first step in the system', 'what is the first step in the system', 1.0),
    ('workflow_first_step', 'en', 'where do i start in the app', 'where do i start in the app', 1.1),
    ('workflow_first_step', 'en', 'what should i do first', 'what should i do first', 1.0),

    ('source_reference_no_meaning', 'ar', 'ما معنى reference no', 'ما معني reference no', 1.0),
    ('source_reference_no_meaning', 'ar', 'يعني ايه reference number', 'يعني ايه reference number', 1.0),
    ('source_reference_no_meaning', 'ar', 'المقصود ب reference no', 'المقصود ب reference no', 0.95),
    ('source_reference_no_meaning', 'en', 'what does reference no mean', 'what does reference no mean', 1.0),
    ('source_reference_no_meaning', 'en', 'what is reference number for', 'what is reference number for', 1.0),
    ('source_reference_no_meaning', 'en', 'reference no meaning', 'reference no meaning', 0.95),

    ('recommendation_create_how', 'ar', 'كيف انشئ recommendation', 'كيف انشي recommendation', 1.0),
    ('recommendation_create_how', 'ar', 'ازاي اعمل توصية', 'ازاي اعمل توصيه', 1.1),
    ('recommendation_create_how', 'ar', 'خطوات انشاء recommendation', 'خطوات انشاء recommendation', 1.0),
    ('recommendation_create_how', 'en', 'how do i create a recommendation', 'how do i create a recommendation', 1.0),
    ('recommendation_create_how', 'en', 'create recommendation steps', 'create recommendation steps', 1.0),
    ('recommendation_create_how', 'en', 'how to add recommendation', 'how to add recommendation', 1.0),

    ('action_filtering_logic', 'ar', 'كيف تعمل الفلاتر في actions', 'كيف تعمل الفلاتر في actions', 1.0),
    ('action_filtering_logic', 'ar', 'لما اختار all بيحصل ايه في action', 'لما اختار all بيحصل ايه في action', 1.1),
    ('action_filtering_logic', 'ar', 'منطق فلترة actions', 'منطق فلتره actions', 1.0),
    ('action_filtering_logic', 'en', 'how do actions filters work', 'how do actions filters work', 1.0),
    ('action_filtering_logic', 'en', 'what happens when filters are all in actions', 'what happens when filters are all in actions', 1.1),
    ('action_filtering_logic', 'en', 'actions filtering logic', 'actions filtering logic', 1.0),

    ('extension_who_can_request', 'ar', 'مين يقدر يطلب extension request', 'مين يقدر يطلب extension request', 1.1),
    ('extension_who_can_request', 'ar', 'من يحق له طلب تمديد', 'من يحق له طلب تمديد', 1.0),
    ('extension_who_can_request', 'ar', 'مين يطلب extension', 'مين يطلب extension', 1.0),
    ('extension_who_can_request', 'en', 'who can request an extension', 'who can request an extension', 1.1),
    ('extension_who_can_request', 'en', 'who can submit extension request', 'who can submit extension request', 1.0),
    ('extension_who_can_request', 'en', 'who is allowed to request extension', 'who is allowed to request extension', 1.0),

    ('verification_queue_meaning', 'ar', 'ما معنى completed actions need verification', 'ما معني completed actions need verification', 1.1),
    ('verification_queue_meaning', 'ar', 'يعني ايه actions need verification', 'يعني ايه actions need verification', 1.0),
    ('verification_queue_meaning', 'ar', 'ما المقصود بطابور التحقق', 'ما المقصود بطابور التحقق', 0.95),
    ('verification_queue_meaning', 'en', 'what does completed actions need verification mean', 'what does completed actions need verification mean', 1.1),
    ('verification_queue_meaning', 'en', 'what is verification queue', 'what is verification queue', 1.0),
    ('verification_queue_meaning', 'en', 'meaning of actions need verification', 'meaning of actions need verification', 1.0),

    ('verification_who_can_do', 'ar', 'من يقدر يعمل verification', 'من يقدر يعمل verification', 1.1),
    ('verification_who_can_do', 'ar', 'مين يعمل التحقق النهائي', 'مين يعمل التحقق النهائي', 1.0),
    ('verification_who_can_do', 'ar', 'من المسؤول عن verification', 'من المسؤول عن verification', 1.0),
    ('verification_who_can_do', 'en', 'who can perform verification', 'who can perform verification', 1.1),
    ('verification_who_can_do', 'en', 'who does final verification', 'who does final verification', 1.0),
    ('verification_who_can_do', 'en', 'who is allowed to verify actions', 'who is allowed to verify actions', 1.0),

    ('reports_how_to_use', 'ar', 'كيف استخدم reports', 'كيف استخدم reports', 1.1),
    ('reports_how_to_use', 'ar', 'ازاي اشتغل على التقارير', 'ازاي اشتغل علي التقارير', 1.0),
    ('reports_how_to_use', 'ar', 'خطوات استخدام reports', 'خطوات استخدام reports', 1.0),
    ('reports_how_to_use', 'en', 'how do i use reports', 'how do i use reports', 1.1),
    ('reports_how_to_use', 'en', 'how to use reports page', 'how to use reports page', 1.0),
    ('reports_how_to_use', 'en', 'reports usage steps', 'reports usage steps', 1.0),

    ('logs_what_is_tracked', 'ar', 'ما الذي تسجله logs', 'ما الذي تسجله logs', 1.1),
    ('logs_what_is_tracked', 'ar', 'ايه اللي بيتسجل في logs', 'ايه اللي بيتسجل في logs', 1.0),
    ('logs_what_is_tracked', 'ar', 'السجلات بتسجل ايه', 'السجلات بتسجل ايه', 1.0),
    ('logs_what_is_tracked', 'en', 'what is tracked in logs', 'what is tracked in logs', 1.1),
    ('logs_what_is_tracked', 'en', 'what does logs page record', 'what does logs page record', 1.0),
    ('logs_what_is_tracked', 'en', 'what gets logged', 'what gets logged', 0.95),

    ('logs_why_not_visible', 'ar', 'لماذا لا تظهر لي logs', 'لماذا لا تظهر لي logs', 1.1),
    ('logs_why_not_visible', 'ar', 'ليه صفحة logs مش ظاهرة', 'ليه صفحه logs مش ظاهره', 1.0),
    ('logs_why_not_visible', 'ar', 'مش شايف logs page', 'مش شايف logs page', 1.0),
    ('logs_why_not_visible', 'en', 'why cant i see logs', 'why cant i see logs', 1.1),
    ('logs_why_not_visible', 'en', 'why is logs page hidden', 'why is logs page hidden', 1.0),
    ('logs_why_not_visible', 'en', 'i cannot see logs page', 'i cannot see logs page', 1.0),

    ('action_source_first_why', 'ar', 'ليه لازم اختار source الاول في action', 'ليه لازم اختار source الاول في action', 1.2),
    ('action_source_first_why', 'en', 'why choose source first in action', 'why choose source first in action', 1.1),
    ('action_hidden_fields_on_create', 'ar', 'ليه في حقول مش ظاهرة وقت انشاء action', 'ليه في حقول مش ظاهره وقت انشاء action', 1.15),
    ('action_hidden_fields_on_create', 'en', 'why some action fields are hidden on create', 'why some action fields are hidden on create', 1.1),
    ('number_preview_vs_save', 'ar', 'ليه الرقم preview بس', 'ليه الرقم preview بس', 1.2),
    ('number_preview_vs_save', 'en', 'why is number preview only', 'why is number preview only', 1.2),
    ('reports_filter_source_type', 'ar', 'فلترة reports حسب source type', 'فلتره reports حسب source type', 1.1),
    ('reports_filter_source_type', 'en', 'reports filter by source type', 'reports filter by source type', 1.1),
    ('permissions_why_button_hidden', 'ar', 'ليه بعض الازرار مش ظاهرة', 'ليه بعض الازرار مش ظاهره', 1.15),
    ('permissions_why_button_hidden', 'en', 'why are some buttons hidden', 'why are some buttons hidden', 1.15),
    ('extension_who_can_approve', 'ar', 'مين يوافق على extension request', 'مين يوافق علي extension request', 1.15),
    ('extension_who_can_approve', 'en', 'who approves extension request', 'who approves extension request', 1.15)
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
    ('workflow_first_step', 'ar', 'ابدأ دائمًا بإنشاء Source أولًا، ثم Recommendation، ثم Action، وبعد ذلك Reports والمتابعة.', 'الـ workflow المعتمد في النظام هو: Source ثم Recommendation ثم Action ثم Report. هذا الترتيب مهم للحفاظ على التسلسل الصحيح وربط العناصر ببعضها بصورة سليمة.', '["أنشئ Source","أضف Recommendation تحت هذا الـ Source","أنشئ Action مرتبطة بالتوصية","استخدم Reports والمتابعة بعد ذلك"]'::jsonb, 'هذا هو المسار الأساسي المستقر في النظام الحالي.', null, '[]'::jsonb, '[]'::jsonb),
    ('workflow_first_step', 'en', 'Always start by creating a Source, then a Recommendation, then an Action, and finally use Reports and follow-up.', 'The approved workflow in the system is: Source, then Recommendation, then Action, then Report. This order keeps the structure and linkage correct.', '["Create a Source","Add a Recommendation under that Source","Create an Action linked to the Recommendation","Use Reports and follow-up afterward"]'::jsonb, 'This is the stable baseline workflow in the current system.', null, '[]'::jsonb, '[]'::jsonb),

    ('source_reference_no_meaning', 'ar', 'Reference no. هو رقم المرجع المرتبط بالمصدر، ويُستخدم لتمييزه وربطه داخل النظام.', 'هذا الرقم قد يكون قادمًا من مرجع موجود بالفعل أو يتم إدخاله يدويًا حسب السيناريو المعتمد في صفحة Sources. الهدف منه هو سهولة التتبع والربط.', '["راجع حقل reference no.","حدّد هل ستختار مرجعًا موجودًا أم ستدخله يدويًا","احفظ الـ Source بعد التأكد من صحة المرجع"]'::jsonb, null, null, '[{"label":"هل Reference No يمكن أن يكون يدويًا؟","intentKey":"source_reference_manual_or_existing"}]'::jsonb, '[]'::jsonb),
    ('source_reference_no_meaning', 'en', 'Reference no. is the source reference number used to identify and track the source inside the system.', 'It may come from an existing recorded reference or be entered manually depending on the Sources page scenario. Its main purpose is traceability and linkage.', '["Review the reference no. field","Decide whether to select an existing reference or enter one manually","Save the Source after confirming the correct reference"]'::jsonb, null, null, '[{"label":"Can the reference number be manual?","intentKey":"source_reference_manual_or_existing"}]'::jsonb, '[]'::jsonb),

    ('recommendation_create_how', 'ar', 'لإنشاء Recommendation اختر الـ Source أولًا أو اربطها بالمصدر المناسب ثم اكتب النص واحفظ.', 'صفحة Recommendations مصممة بحيث تربط التوصية بالسياق الصحيح ثم تدخل النص المطلوب. ويمكنك استخدام المايك أو الـ rewrite لتحسين الصياغة داخل الصفحة.', '["افتح صفحة Recommendations","حدّد الـ Source المرتبط إن كان مطلوبًا","اكتب نص التوصية أو استخدم المايك","احفظ التوصية"]'::jsonb, 'بعد الحفظ ستظهر التوصية داخل السجل ويمكن استخدامها لاحقًا عند إنشاء Action.', null, '[{"label":"كيف أستخدم المايك في Recommendation؟","intentKey":"recommendation_voice_input_how"},{"label":"ما وظيفة Rewrite؟","intentKey":"recommendation_rewrite_meaning"}]'::jsonb, '[{"type":"navigate","label":"Open Recommendations","target":"/recommendations"}]'::jsonb),
    ('recommendation_create_how', 'en', 'To create a Recommendation, choose or link the proper Source first, then write the text and save.', 'The Recommendations page is built to keep the recommendation connected to the right context before saving. You can also use voice input or rewrite inside the page.', '["Open the Recommendations page","Select the related Source if needed","Write the recommendation or use voice input","Save the recommendation"]'::jsonb, 'After saving, the recommendation appears in the register and can be used later when creating an Action.', null, '[{"label":"How do I use voice input in Recommendation?","intentKey":"recommendation_voice_input_how"},{"label":"What does Rewrite do?","intentKey":"recommendation_rewrite_meaning"}]'::jsonb, '[{"type":"navigate","label":"Open Recommendations","target":"/recommendations"}]'::jsonb),

    ('action_filtering_logic', 'ar', 'في سجل Actions: لو الفلاتر على All أو بدون اختيار محدد، يعرض النظام كل الـ actions. ولو اخترت Source أو Recommendation، يتم التصفية حسب الاختيار.', 'منطق الفلاتر في صفحة Actions منفصل عن منطق الإنشاء. داخل الإنشاء يجب اختيار Source أولًا، لكن في السجل يمكن أن ترى كل الـ actions أو جزءًا منها حسب الفلاتر.', '["حدّد Source أو Recommendation لو أردت تضييق النتائج","لو تركت الفلاتر على All سيظهر كل السجل","داخل الإنشاء يظل Source first قاعدة أساسية"]'::jsonb, 'هذا يوازن بين سهولة المراجعة في السجل وصحة الربط أثناء الإنشاء.', null, '[{"label":"لماذا يجب اختيار Source أولًا؟","intentKey":"action_source_first_why"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),
    ('action_filtering_logic', 'en', 'On the Actions register, if filters are set to All or nothing is selected, the system shows all actions. If you choose a Source or Recommendation, the list is filtered accordingly.', 'Filtering logic in the register is separate from the creation logic. During creation you must choose the Source first, but in the register you may view all actions or a filtered subset.', '["Choose a Source or Recommendation if you want narrower results","Leave filters on All to show the full register","During creation, Source-first still remains a core rule"]'::jsonb, 'This balances easy review in the register with correct linkage during creation.', null, '[{"label":"Why must I choose Source first?","intentKey":"action_source_first_why"}]'::jsonb, '[{"type":"navigate","label":"Open Actions","target":"/actions"}]'::jsonb),

    ('extension_who_can_request', 'ar', 'يمكن لـ Responsible أو Owner طلب Extension Request، وقد يظهر ذلك أيضًا للمستخدمين ذوي الصلاحيات الإدارية حسب النظام.', 'طلب التمديد يهدف إلى رفع طلب رسمي قبل تغيير due date. أما الاعتماد النهائي فيبقى لجهة approval المخولة.', '["افتح الـ Action المطلوبة","أدخل تاريخ التمديد المقترح والسبب","أرسل الطلب للمراجعة والاعتماد"]'::jsonb, 'الموافقة نفسها تختلف عن تقديم الطلب.', null, '[{"label":"من يوافق على Extension Request؟","intentKey":"extension_who_can_approve"},{"label":"ماذا يحدث بعد الموافقة على التمديد؟","intentKey":"extension_after_approval_what_happens"}]'::jsonb, '[]'::jsonb),
    ('extension_who_can_request', 'en', 'Responsible or Owner can request an Extension Request, and some administrative roles may also see that option depending on the system setup.', 'The extension request is the formal step before changing the due date. Final approval still belongs to the users with approval authority.', '["Open the target Action","Enter the requested extension date and reason","Submit the request for review and approval"]'::jsonb, 'Requesting an extension is different from approving it.', null, '[{"label":"Who can approve an extension request?","intentKey":"extension_who_can_approve"},{"label":"What happens after an extension is approved?","intentKey":"extension_after_approval_what_happens"}]'::jsonb, '[]'::jsonb),

    ('verification_queue_meaning', 'ar', 'Completed Actions need verification تعني أن الـ Action تم استكمالها لكنها ما زالت تنتظر مراجعة واعتماد الإغلاق من الشخص المخول.', 'هذا الصف أو الطابور يساعد على فصل التنفيذ الفعلي عن التحقق النهائي، بحيث لا يعتبر الإجراء مغلقًا بالكامل إلا بعد المراجعة.', '["أكمل الـ Action","انتقل إلى حالة تنتظر التحقق","يقوم المستخدم المخول بمراجعة الإغلاق واعتماده"]'::jsonb, null, null, '[{"label":"من يقدر يعمل verification؟","intentKey":"verification_who_can_do"}]'::jsonb, '[]'::jsonb),
    ('verification_queue_meaning', 'en', 'Completed Actions need verification means that the Action has been completed but is still waiting for final closure review by the authorized user.', 'This queue separates actual completion from final verification, so the Action is not considered fully closed until the verification step is done.', '["Complete the Action","Move it to the waiting-for-verification state","The authorized user reviews and confirms the closure"]'::jsonb, null, null, '[{"label":"Who can perform verification?","intentKey":"verification_who_can_do"}]'::jsonb, '[]'::jsonb),

    ('verification_who_can_do', 'ar', 'التحقق النهائي يرتبط عادةً بدور Verifier أو بالمستخدم الذي يملك صلاحية التحقق في النظام.', 'المهم هنا أن التحقق ليس مجرد تنفيذ، بل مراجعة لصحة الإغلاق قبل اعتماده نهائيًا. وقد يكون ذلك مرتبطًا بدور أو permission محددة.', '["راجع الـ Action بعد اكتمالها","تأكد من صحة الإغلاق والمرفقات إن وجدت","اعتمد التحقق إذا كانت لديك الصلاحية"]'::jsonb, 'لو لم تظهر لك أدوات التحقق فقد تكون الصلاحية غير متاحة لك.', null, '[{"label":"ما الفرق بين Responsible و Owner و Verifier؟","intentKey":"roles_difference_responsible_owner_verifier"}]'::jsonb, '[]'::jsonb),
    ('verification_who_can_do', 'en', 'Final verification is usually tied to the Verifier role or to a user who has the verification permission in the system.', 'Verification is not just execution; it is the review of correct closure before final acceptance. It may depend on a role or a specific permission.', '["Review the Action after completion","Confirm the closure details and attachments if any","Approve the verification if you have the required permission"]'::jsonb, 'If verification controls are not visible to you, the permission may not be assigned to your account.', null, '[{"label":"What is the difference between Responsible, Owner, and Verifier?","intentKey":"roles_difference_responsible_owner_verifier"}]'::jsonb, '[]'::jsonb),

    ('reports_how_to_use', 'ar', 'ابدأ من Source Type ثم اختر Source محددًا أو All، وبعدها راجع النتائج أو اطبع التقرير حسب الحاجة.', 'صفحة Reports مبنية لتعرض التقارير بصورة منظمة حسب نوع المصدر ثم المصدر نفسه، بحيث ترى hierarchy واضحة بدون كسر التقارير الحالية.', '["افتح صفحة Reports","اختر Source Type","اختر Source أو All","راجع التقرير أو اطبعه"]'::jsonb, 'اختيار All مفيد عند الرغبة في عرض أوسع، بينما الاختيار المحدد يعطيك تقريرًا أدق.', null, '[{"label":"كيف تعمل فلترة Reports حسب Source Type؟","intentKey":"reports_filter_source_type"}]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),
    ('reports_how_to_use', 'en', 'Start with Source Type, then choose a specific Source or All, and review or print the report as needed.', 'The Reports page is designed to present reporting in a structured way by source type and then by source itself, keeping the current reports stable.', '["Open the Reports page","Choose the Source Type","Choose a Source or All","Review or print the report"]'::jsonb, 'Using All is useful for a broader view, while a specific source gives you a more focused report.', null, '[{"label":"How does reports filtering by source type work?","intentKey":"reports_filter_source_type"}]'::jsonb, '[{"type":"navigate","label":"Open Reports","target":"/reports"}]'::jsonb),

    ('logs_what_is_tracked', 'ar', 'صفحة Logs تسجل أحداثًا مثل login / logout وبعض عمليات الإضافة أو التعديل داخل النظام حسب ما هو مربوط بها.', 'الهدف من Logs هو الـ audit trail: معرفة من قام بالعملية ومتى. وقد تشمل سجلات للمصادر والتوصيات والإجراءات والتحديثات حسب ما تم تفعيله وربطه في المشروع.', '["افتح صفحة Logs","استخدم الفلاتر أو pagination عند الحاجة","راجع نوع العملية وتاريخها والمستخدم المرتبط بها"]'::jsonb, null, null, '[{"label":"لماذا لا تظهر لي Logs؟","intentKey":"logs_why_not_visible"}]'::jsonb, '[{"type":"navigate","label":"Open Logs","target":"/logs"}]'::jsonb),
    ('logs_what_is_tracked', 'en', 'The Logs page tracks events such as login/logout and some create/update operations inside the system based on what is wired into it.', 'The purpose of Logs is to provide an audit trail: who did what and when. It may include records for sources, recommendations, actions, and updates depending on the connected logging points.', '["Open the Logs page","Use filters or pagination if needed","Review the operation type, date, and related user"]'::jsonb, null, null, '[{"label":"Why can’t I see Logs?","intentKey":"logs_why_not_visible"}]'::jsonb, '[{"type":"navigate","label":"Open Logs","target":"/logs"}]'::jsonb),

    ('logs_why_not_visible', 'ar', 'غالبًا السبب أن صفحة Logs أو بياناتها مرتبطة بصلاحية مثل logs.view أو بصلاحيات أعلى.', 'إذا كانت الصفحة أو السجلات غير ظاهرة لك، فذلك غالبًا بسبب role أو permission غير متاحة لحسابك الحالي، وليس بسبب خطأ في الاستخدام فقط.', '["راجع دورك الحالي","تحقق من الصلاحيات المربوطة بصفحة Logs","اطلب من الأدمن منحك الصلاحية إذا لزم الأمر"]'::jsonb, null, null, '[{"label":"ما الذي تسجله Logs؟","intentKey":"logs_what_is_tracked"},{"label":"لماذا بعض الأزرار لا تظهر لي؟","intentKey":"permissions_why_button_hidden"}]'::jsonb, '[]'::jsonb),
    ('logs_why_not_visible', 'en', 'Most likely the Logs page or its data is tied to a permission such as logs.view or to a higher access level.', 'If the page or its records are hidden from you, the most likely reason is your current role or permission set rather than a usage mistake.', '["Review your current role","Check the permissions tied to the Logs page","Ask the admin to grant the required access if needed"]'::jsonb, null, null, '[{"label":"What is tracked in Logs?","intentKey":"logs_what_is_tracked"},{"label":"Why can’t I see some buttons?","intentKey":"permissions_why_button_hidden"}]'::jsonb, '[]'::jsonb)
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
    ('workflow_first_step', 'dashboard', '/dashboard', 12, false),
    ('workflow_first_step', 'general', null, 12, false),
    ('source_reference_no_meaning', 'sources', '/sources', 15, false),
    ('recommendation_create_how', 'recommendations', '/recommendations', 8, true),
    ('action_filtering_logic', 'actions', '/actions', 25, false),
    ('action_filtering_logic', 'action_details', '/actions', 25, false),
    ('extension_who_can_request', 'actions', '/actions', 55, false),
    ('extension_who_can_request', 'action_details', '/actions', 55, false),
    ('verification_queue_meaning', 'actions', '/actions', 65, false),
    ('verification_queue_meaning', 'action_details', '/actions', 65, false),
    ('verification_who_can_do', 'actions', '/actions', 66, false),
    ('verification_who_can_do', 'action_details', '/actions', 66, false),
    ('reports_how_to_use', 'reports', '/reports', 12, false),
    ('logs_what_is_tracked', 'logs', '/logs', 10, true),
    ('logs_why_not_visible', 'logs', '/logs', 20, false)
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
    ('workflow_overview', 'workflow_first_step', 10),
    ('workflow_first_step', 'workflow_overview', 10),
    ('source_reference_no_meaning', 'source_reference_manual_or_existing', 10),
    ('recommendation_create_how', 'recommendation_voice_input_how', 10),
    ('recommendation_create_how', 'recommendation_rewrite_meaning', 20),
    ('action_create_how', 'action_source_first_why', 10),
    ('action_create_how', 'action_hidden_fields_on_create', 20),
    ('action_create_how', 'action_filtering_logic', 30),
    ('action_source_first_why', 'action_filtering_logic', 10),
    ('action_filtering_logic', 'action_source_first_why', 10),
    ('extension_who_can_request', 'extension_who_can_approve', 10),
    ('extension_who_can_approve', 'extension_after_approval_what_happens', 10),
    ('verification_queue_meaning', 'verification_who_can_do', 10),
    ('verification_who_can_do', 'roles_difference_responsible_owner_verifier', 10),
    ('reports_how_to_use', 'reports_filter_source_type', 10),
    ('logs_what_is_tracked', 'logs_why_not_visible', 10),
    ('logs_why_not_visible', 'permissions_why_button_hidden', 10)
)
insert into public.help_related_intents (source_intent_id, related_intent_id, sort_order)
select s.id, r.id, rel.sort_order
from related rel
join intent_map s on s.intent_key = rel.source_key
join intent_map r on r.intent_key = rel.related_key
on conflict (source_intent_id, related_intent_id) do update
set sort_order = excluded.sort_order;

commit;
