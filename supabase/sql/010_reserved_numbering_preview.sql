begin;

create extension if not exists pgcrypto;

create table if not exists public.running_number_sequences (
  scope_type text not null,
  scope_key text not null,
  last_value integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope_type, scope_key)
);

create table if not exists public.number_reservations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('source', 'recommendation', 'action')),
  parent_scope text not null,
  reserved_no text not null unique,
  reserved_by uuid references public.profiles(id) on delete set null,
  is_consumed boolean not null default false,
  consumed_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '2 hours',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_number_reservations_lookup
  on public.number_reservations (entity_type, parent_scope, reserved_by, is_consumed, expires_at desc);

create or replace function public.next_running_number(
  p_scope_type text,
  p_scope_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  insert into public.running_number_sequences as seq (
    scope_type,
    scope_key,
    last_value
  )
  values (
    p_scope_type,
    p_scope_key,
    1
  )
  on conflict (scope_type, scope_key)
  do update
  set
    last_value = seq.last_value + 1,
    updated_at = timezone('utc', now())
  returning last_value into v_next;

  return v_next;
end;
$$;

create or replace function public.source_type_prefix(
  p_source_type_code text
)
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

create or replace function public.generate_source_no(
  p_source_type_code text,
  p_source_date date
)
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
  v_next integer;
begin
  select source_no
  into v_source_no
  from public.sources
  where id = p_source_id;

  if v_source_no is null or btrim(v_source_no) = '' then
    raise exception 'Source number is missing for source %', p_source_id;
  end if;

  v_next := public.next_running_number('recommendation', p_source_id::text);

  return format('%s-R%s', v_source_no, lpad(v_next::text, 2, '0'));
end;
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
  v_next integer;
begin
  select recommendation_no
  into v_recommendation_no
  from public.recommendations
  where id = p_recommendation_id;

  if v_recommendation_no is null or btrim(v_recommendation_no) = '' then
    raise exception 'Recommendation number is missing for recommendation %', p_recommendation_id;
  end if;

  v_next := public.next_running_number('action', p_recommendation_id::text);

  return format('%s-A%s', v_recommendation_no, lpad(v_next::text, 2, '0'));
end;
$$;

create or replace function public.reserve_source_number(
  p_source_type_code text,
  p_source_date date
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope text;
  v_existing text;
  v_reserved_no text;
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Authentication required to reserve source number';
  end if;

  if coalesce(btrim(p_source_type_code), '') = '' then
    raise exception 'Source type is required';
  end if;

  v_scope := p_source_type_code || ':' || to_char(coalesce(p_source_date, current_date), 'YYYY');

  select reserved_no
  into v_existing
  from public.number_reservations
  where entity_type = 'source'
    and parent_scope = v_scope
    and reserved_by = v_user
    and is_consumed = false
    and expires_at > timezone('utc', now())
  order by created_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  v_reserved_no := public.generate_source_no(p_source_type_code, p_source_date);

  insert into public.number_reservations (
    entity_type,
    parent_scope,
    reserved_no,
    reserved_by
  ) values (
    'source',
    v_scope,
    v_reserved_no,
    v_user
  );

  return v_reserved_no;
end;
$$;

create or replace function public.reserve_recommendation_number(
  p_source_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_reserved_no text;
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Authentication required to reserve recommendation number';
  end if;

  if p_source_id is null then
    raise exception 'Source is required';
  end if;

  select reserved_no
  into v_existing
  from public.number_reservations
  where entity_type = 'recommendation'
    and parent_scope = p_source_id::text
    and reserved_by = v_user
    and is_consumed = false
    and expires_at > timezone('utc', now())
  order by created_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  v_reserved_no := public.generate_recommendation_no(p_source_id);

  insert into public.number_reservations (
    entity_type,
    parent_scope,
    reserved_no,
    reserved_by
  ) values (
    'recommendation',
    p_source_id::text,
    v_reserved_no,
    v_user
  );

  return v_reserved_no;
end;
$$;

create or replace function public.reserve_action_number(
  p_recommendation_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_reserved_no text;
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Authentication required to reserve action number';
  end if;

  if p_recommendation_id is null then
    raise exception 'Recommendation is required';
  end if;

  select reserved_no
  into v_existing
  from public.number_reservations
  where entity_type = 'action'
    and parent_scope = p_recommendation_id::text
    and reserved_by = v_user
    and is_consumed = false
    and expires_at > timezone('utc', now())
  order by created_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  v_reserved_no := public.generate_action_no(p_recommendation_id);

  insert into public.number_reservations (
    entity_type,
    parent_scope,
    reserved_no,
    reserved_by
  ) values (
    'action',
    p_recommendation_id::text,
    v_reserved_no,
    v_user
  );

  return v_reserved_no;
end;
$$;

create or replace function public.consume_reserved_number(
  p_entity_type text,
  p_parent_scope text,
  p_reserved_no text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_reservation_id uuid;
begin
  if coalesce(btrim(p_reserved_no), '') = '' then
    return;
  end if;

  v_user := auth.uid();
  if v_user is null then
    return;
  end if;

  select id
  into v_reservation_id
  from public.number_reservations
  where entity_type = p_entity_type
    and parent_scope = p_parent_scope
    and reserved_no = p_reserved_no
    and reserved_by = v_user
    and is_consumed = false
    and expires_at > timezone('utc', now())
  order by created_at desc
  limit 1
  for update;

  if v_reservation_id is null then
    raise exception 'This number is not reserved for your current session. Refresh the form to get the next automatic number.';
  end if;

  update public.number_reservations
  set
    is_consumed = true,
    consumed_at = timezone('utc', now())
  where id = v_reservation_id;
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
  else
    perform public.consume_reserved_number(
      'source',
      new.source_type_code || ':' || to_char(coalesce(new.source_date, current_date), 'YYYY'),
      new.source_no
    );
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
  else
    perform public.consume_reserved_number(
      'recommendation',
      new.source_id::text,
      new.recommendation_no
    );
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
  else
    perform public.consume_reserved_number(
      'action',
      new.recommendation_id::text,
      new.action_no
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sources_auto_no on public.sources;
create trigger trg_sources_auto_no
before insert on public.sources
for each row
execute function public.set_source_no_if_missing();

drop trigger if exists trg_recommendations_auto_no on public.recommendations;
create trigger trg_recommendations_auto_no
before insert on public.recommendations
for each row
execute function public.set_recommendation_no_if_missing();

drop trigger if exists trg_actions_auto_no on public.actions;
create trigger trg_actions_auto_no
before insert on public.actions
for each row
execute function public.set_action_no_if_missing();

insert into public.sources (
  source_no,
  source_type_code,
  title,
  source_date,
  summary,
  created_by
)
select
  public.generate_source_no(source_type_code, source_date),
  source_type_code,
  title,
  source_date,
  summary,
  created_by
from public.sources
where false;

commit;
