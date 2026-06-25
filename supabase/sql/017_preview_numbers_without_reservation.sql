begin;

create or replace function public.preview_source_number_v2(
  p_source_date date,
  p_source_type_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.generate_source_no(p_source_type_code, p_source_date);
end;
$$;

create or replace function public.preview_source_number(
  p_source_type_code text,
  p_source_date date
)
returns text
language sql
security definer
set search_path = public
as $$
  select public.preview_source_number_v2(p_source_date, p_source_type_code);
$$;

create or replace function public.preview_recommendation_number_v2(
  p_source_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.generate_recommendation_no(p_source_id);
end;
$$;

create or replace function public.preview_recommendation_number(
  p_source_id uuid
)
returns text
language sql
security definer
set search_path = public
as $$
  select public.preview_recommendation_number_v2(p_source_id);
$$;

create or replace function public.preview_action_number_v2(
  p_recommendation_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.generate_action_no(p_recommendation_id);
end;
$$;

create or replace function public.preview_action_number(
  p_recommendation_id uuid
)
returns text
language sql
security definer
set search_path = public
as $$
  select public.preview_action_number_v2(p_recommendation_id);
$$;

grant execute on function public.preview_source_number_v2(date, text) to authenticated;
grant execute on function public.preview_source_number(text, date) to authenticated;
grant execute on function public.preview_recommendation_number_v2(uuid) to authenticated;
grant execute on function public.preview_recommendation_number(uuid) to authenticated;
grant execute on function public.preview_action_number_v2(uuid) to authenticated;
grant execute on function public.preview_action_number(uuid) to authenticated;

commit;
