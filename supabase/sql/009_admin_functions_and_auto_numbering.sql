begin;

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

create or replace function public.generate_source_no(p_source_type_code text, p_source_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text;
  v_prefix text;
  v_next integer;
begin
  v_year := to_char(coalesce(p_source_date, current_date), 'YYYY');
  v_prefix := public.source_type_prefix(p_source_type_code);
  v_next := public.next_running_number('source', p_source_type_code || ':' || v_year);

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
end;
$$;

create or replace function public.generate_recommendation_no(p_source_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_no text;
  v_next integer;
begin
  select source_no into v_source_no from public.sources where id = p_source_id;
  if v_source_no is null then raise exception 'Source not found for recommendation numbering'; end if;
  v_next := public.next_running_number('recommendation', p_source_id::text);
  return format('%s-R%s', v_source_no, lpad(v_next::text, 2, '0'));
end;
$$;

create or replace function public.generate_action_no(p_recommendation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recommendation_no text;
  v_next integer;
begin
  select recommendation_no into v_recommendation_no from public.recommendations where id = p_recommendation_id;
  if v_recommendation_no is null then raise exception 'Recommendation not found for action numbering'; end if;
  v_next := public.next_running_number('action', p_recommendation_id::text);
  return format('%s-A%s', v_recommendation_no, lpad(v_next::text, 2, '0'));
end;
$$;

create or replace function public.set_source_no_if_missing() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source_no is null or btrim(new.source_no) = '' then
    new.source_no := public.generate_source_no(new.source_type_code, new.source_date);
  end if;
  return new;
end;
$$;

create or replace function public.set_recommendation_no_if_missing() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.recommendation_no is null or btrim(new.recommendation_no) = '' then
    new.recommendation_no := public.generate_recommendation_no(new.source_id);
  end if;
  return new;
end;
$$;

create or replace function public.set_action_no_if_missing() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.action_no is null or btrim(new.action_no) = '' then
    new.action_no := public.generate_action_no(new.recommendation_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sources_auto_no on public.sources;
create trigger trg_sources_auto_no before insert on public.sources for each row execute function public.set_source_no_if_missing();

drop trigger if exists trg_recommendations_auto_no on public.recommendations;
create trigger trg_recommendations_auto_no before insert on public.recommendations for each row execute function public.set_recommendation_no_if_missing();

drop trigger if exists trg_actions_auto_no on public.actions;
create trigger trg_actions_auto_no before insert on public.actions for each row execute function public.set_action_no_if_missing();

commit;
