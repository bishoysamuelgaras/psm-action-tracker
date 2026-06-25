begin;

create extension if not exists pgcrypto;

create table if not exists public.running_number_sequences (
  scope_type text not null,
  scope_key text not null,
  last_value integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope_type, scope_key)
);

create or replace function public.next_running_number(p_scope_type text, p_scope_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  insert into public.running_number_sequences as seq (scope_type, scope_key, last_value)
  values (p_scope_type, p_scope_key, 1)
  on conflict (scope_type, scope_key)
  do update
  set last_value = seq.last_value + 1,
      updated_at = timezone('utc', now())
  returning last_value into v_next;

  return v_next;
end;
$$;

create or replace function public.source_type_prefix(p_source_type_code text)
returns text
language plpgsql
immutable
as $$
begin
  return case p_source_type_code
    when 'incident_investigation' then 'INC'
    when 'audit' then 'AUD'
    when 'committee' then 'COM'
    when 'inspection' then 'INS'
    when 'management_review' then 'MRV'
    when 'psm_review' then 'PSM'
    else upper(left(regexp_replace(coalesce(p_source_type_code, 'SRC'), '[^a-zA-Z0-9]', '', 'g'), 3))
  end;
end;
$$;

create or replace function public.sync_running_number_sequence(
  p_scope_type text,
  p_scope_key text,
  p_min_last_value integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.running_number_sequences as seq (scope_type, scope_key, last_value)
  values (p_scope_type, p_scope_key, greatest(coalesce(p_min_last_value, 0), 0))
  on conflict (scope_type, scope_key)
  do update
  set last_value = greatest(seq.last_value, excluded.last_value),
      updated_at = timezone('utc', now());
end;
$$;

create or replace function public.preview_source_number_v2(
  p_source_date date,
  p_source_type_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text;
  v_prefix text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  v_year := to_char(coalesce(p_source_date, current_date), 'YYYY');
  v_prefix := public.source_type_prefix(p_source_type_code);
  v_scope_key := coalesce(p_source_type_code, '') || ':' || v_year;

  select coalesce(max(substring(source_no from '(\d+)$')::integer), 0)
    into v_saved_max
  from public.sources
  where source_type_code = p_source_type_code
    and to_char(source_date, 'YYYY') = v_year;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'source' and scope_key = v_scope_key;

  v_next := greatest(v_saved_max, v_sequence_max) + 1;
  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
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

create or replace function public.generate_source_no(p_source_type_code text, p_source_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text;
  v_prefix text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  v_year := to_char(coalesce(p_source_date, current_date), 'YYYY');
  v_prefix := public.source_type_prefix(p_source_type_code);
  v_scope_key := coalesce(p_source_type_code, '') || ':' || v_year;

  select coalesce(max(substring(source_no from '(\d+)$')::integer), 0)
    into v_saved_max
  from public.sources
  where source_type_code = p_source_type_code
    and to_char(source_date, 'YYYY') = v_year;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'source' and scope_key = v_scope_key;

  perform public.sync_running_number_sequence('source', v_scope_key, greatest(v_saved_max, v_sequence_max));
  v_next := public.next_running_number('source', v_scope_key);

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
end;
$$;

create or replace function public.preview_recommendation_number_v2(
  p_source_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_no text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  select source_no into v_source_no
  from public.sources
  where id = p_source_id;

  if v_source_no is null or btrim(v_source_no) = '' then
    raise exception 'Source number is missing for source %', p_source_id;
  end if;

  v_scope_key := p_source_id::text;

  select coalesce(max(substring(recommendation_no from '-R(\d+)$')::integer), 0)
    into v_saved_max
  from public.recommendations
  where source_id = p_source_id;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'recommendation' and scope_key = v_scope_key;

  v_next := greatest(v_saved_max, v_sequence_max) + 1;
  return format('%s-R%s', v_source_no, lpad(v_next::text, 2, '0'));
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

create or replace function public.generate_recommendation_no(
  p_source_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_no text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  select source_no into v_source_no
  from public.sources
  where id = p_source_id;

  if v_source_no is null or btrim(v_source_no) = '' then
    raise exception 'Source number is missing for source %', p_source_id;
  end if;

  v_scope_key := p_source_id::text;

  select coalesce(max(substring(recommendation_no from '-R(\d+)$')::integer), 0)
    into v_saved_max
  from public.recommendations
  where source_id = p_source_id;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'recommendation' and scope_key = v_scope_key;

  perform public.sync_running_number_sequence('recommendation', v_scope_key, greatest(v_saved_max, v_sequence_max));
  v_next := public.next_running_number('recommendation', v_scope_key);

  return format('%s-R%s', v_source_no, lpad(v_next::text, 2, '0'));
end;
$$;

create or replace function public.preview_action_number_v2(
  p_recommendation_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recommendation_no text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  select recommendation_no into v_recommendation_no
  from public.recommendations
  where id = p_recommendation_id;

  if v_recommendation_no is null or btrim(v_recommendation_no) = '' then
    raise exception 'Recommendation number is missing for recommendation %', p_recommendation_id;
  end if;

  v_scope_key := p_recommendation_id::text;

  select coalesce(max(substring(action_no from '-A(\d+)$')::integer), 0)
    into v_saved_max
  from public.actions
  where recommendation_id = p_recommendation_id;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'action' and scope_key = v_scope_key;

  v_next := greatest(v_saved_max, v_sequence_max) + 1;
  return format('%s-A%s', v_recommendation_no, lpad(v_next::text, 2, '0'));
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

create or replace function public.generate_action_no(
  p_recommendation_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recommendation_no text;
  v_scope_key text;
  v_saved_max integer := 0;
  v_sequence_max integer := 0;
  v_next integer;
begin
  select recommendation_no into v_recommendation_no
  from public.recommendations
  where id = p_recommendation_id;

  if v_recommendation_no is null or btrim(v_recommendation_no) = '' then
    raise exception 'Recommendation number is missing for recommendation %', p_recommendation_id;
  end if;

  v_scope_key := p_recommendation_id::text;

  select coalesce(max(substring(action_no from '-A(\d+)$')::integer), 0)
    into v_saved_max
  from public.actions
  where recommendation_id = p_recommendation_id;

  select coalesce(last_value, 0)
    into v_sequence_max
  from public.running_number_sequences
  where scope_type = 'action' and scope_key = v_scope_key;

  perform public.sync_running_number_sequence('action', v_scope_key, greatest(v_saved_max, v_sequence_max));
  v_next := public.next_running_number('action', v_scope_key);

  return format('%s-A%s', v_recommendation_no, lpad(v_next::text, 2, '0'));
end;
$$;

create or replace function public.set_source_no_if_missing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source_no is null or btrim(new.source_no) = '' then
    new.source_no := public.generate_source_no(new.source_type_code, new.source_date);
  end if;
  return new;
end;
$$;

create or replace function public.set_recommendation_no_if_missing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.recommendation_no is null or btrim(new.recommendation_no) = '' then
    new.recommendation_no := public.generate_recommendation_no(new.source_id);
  end if;
  return new;
end;
$$;

create or replace function public.set_action_no_if_missing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.action_no is null or btrim(new.action_no) = '' then
    new.action_no := public.generate_action_no(new.recommendation_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sources_auto_no on public.sources;
create trigger trg_sources_auto_no
before insert on public.sources
for each row execute function public.set_source_no_if_missing();

drop trigger if exists trg_recommendations_auto_no on public.recommendations;
create trigger trg_recommendations_auto_no
before insert on public.recommendations
for each row execute function public.set_recommendation_no_if_missing();

drop trigger if exists trg_actions_auto_no on public.actions;
create trigger trg_actions_auto_no
before insert on public.actions
for each row execute function public.set_action_no_if_missing();

grant execute on function public.preview_source_number_v2(date, text) to authenticated;
grant execute on function public.preview_source_number(text, date) to authenticated;
grant execute on function public.preview_recommendation_number_v2(uuid) to authenticated;
grant execute on function public.preview_recommendation_number(uuid) to authenticated;
grant execute on function public.preview_action_number_v2(uuid) to authenticated;
grant execute on function public.preview_action_number(uuid) to authenticated;

commit;
