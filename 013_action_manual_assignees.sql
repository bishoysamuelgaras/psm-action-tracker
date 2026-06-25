begin;

alter table public.actions
  add column if not exists responsible_name_manual text,
  add column if not exists owner_name_manual text,
  add column if not exists verifier_name_manual text;

create or replace view public.v_action_summary
with (security_invoker = true)
as
select
  a.id as action_id,
  a.action_no,
  a.title as action_title,
  a.description as action_description,
  a.status_code,
  st.name as status_name,
  a.priority_code,
  pl.name as priority_name,
  pl.sort_order as priority_sort_order,
  a.progress_percent,
  a.start_date,
  a.due_date,
  a.completed_date,
  a.verified_date,
  a.latest_extension_until,
  a.extension_reason,
  a.evidence_summary,
  (a.due_date - current_date) as days_to_due,
  (
    a.due_date < current_date
    and a.status_code not in ('closed', 'verified', 'cancelled')
  ) as is_overdue,
  a.created_at,
  a.updated_at,
  rec.id as recommendation_id,
  rec.recommendation_no,
  rec.recommendation_text,
  cat.code as category_code,
  cat.name as category_name,
  src.id as source_id,
  src.source_no,
  src.title as source_title,
  src.reference_no,
  src.source_date,
  src.source_type_code,
  stp.name as source_type_name,
  dept.code as department_code,
  dept.name as department_name,
  responsible.id as responsible_user_id,
  coalesce(responsible.full_name, a.responsible_name_manual) as responsible_name,
  owner_user.id as owner_user_id,
  coalesce(owner_user.full_name, a.owner_name_manual) as owner_name,
  verifier.id as verifier_user_id,
  coalesce(verifier.full_name, a.verifier_name_manual) as verifier_name
from public.actions a
join public.recommendations rec on rec.id = a.recommendation_id
join public.sources src on src.id = rec.source_id
left join public.source_types stp on stp.code = src.source_type_code
left join public.departments dept on dept.id = src.department_id
left join public.recommendation_categories cat on cat.id = rec.category_id
left join public.priority_levels pl on pl.code = a.priority_code
left join public.action_statuses st on st.code = a.status_code
left join public.profiles responsible on responsible.id = a.responsible_user_id
left join public.profiles owner_user on owner_user.id = a.owner_user_id
left join public.profiles verifier on verifier.id = a.verifier_user_id;

create or replace view public.v_overdue_actions
with (security_invoker = true)
as
select *
from public.v_action_summary
where is_overdue = true;

notify pgrst, 'reload schema';

commit;
