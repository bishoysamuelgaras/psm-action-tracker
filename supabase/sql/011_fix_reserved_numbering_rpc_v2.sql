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
  entity_type text not null,
  parent_scope text not null,
  reserved_no text not null,
  reserved_by uuid,
  is_consumed boolean not null default false,
  consumed_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '2 hours',
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'reservation_key'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'parent_scope'
  ) then
    execute 'alter table public.number_reservations rename column reservation_key to parent_scope';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'reserved_number'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'reserved_no'
  ) then
    execute 'alter table public.number_reservations rename column reserved_number to reserved_no';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'parent_scope'
  ) then
    execute 'alter table public.number_reservations add column parent_scope text';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'reserved_no'
  ) then
    execute 'alter table public.number_reservations add column reserved_no text';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'reserved_by'
  ) then
    execute 'alter table public.number_reservations add column reserved_by uuid';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'is_consumed'
  ) then
    execute 'alter table public.number_reservations add column is_consumed boolean not null default false';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'consumed_at'
  ) then
    execute 'alter table public.number_reservations add column consumed_at timestamptz';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'expires_at'
  ) then
    execute 'alter table public.number_reservations add column expires_at timestamptz not null default timezone(''utc'', now()) + interval ''2 hours''';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'number_reservations' and column_name = 'created_at'
  ) then
    execute 'alter table public.number_reservations add column created_at timestamptz not null default timezone(''utc'', now())';
  end if;
end $$;

create unique index if not exists uq_number_reservations_entity_scope_no
  on public.number_reservations (entity_type, parent_scope, reserved_no);

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

create or replace function public.reserve_source_number_v2(
  p_source_date date,
  p_source_type_code text
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

create or replace function public.reserve_recommendation_number_v2(
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

create or replace function public.reserve_action_number_v2(
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

grant execute on function public.reserve_source_number_v2(date, text) to authenticated;
grant execute on function public.reserve_recommendation_number_v2(uuid) to authenticated;
grant execute on function public.reserve_action_number_v2(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
