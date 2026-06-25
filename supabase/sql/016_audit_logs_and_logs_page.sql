begin;

alter table public.role_permissions
  drop constraint if exists role_permissions_permission_code_check;

alter table public.role_permissions
  add constraint role_permissions_permission_code_check check (
    permission_code in (
      'dashboard.view',
      'sources.manage',
      'recommendations.manage',
      'actions.manage',
      'actions.assigned_update',
      'reports.view',
      'logs.view',
      'settings.users.manage',
      'settings.roles.manage'
    )
  );

insert into public.role_permissions (role_code, permission_code)
values
  ('admin', 'logs.view'),
  ('psm_manager', 'logs.view')
on conflict do nothing;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default timezone('utc', now()),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text,
  actor_email text,
  actor_role text,
  entity_type text not null,
  entity_id text,
  entity_label text,
  event_type text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  source text not null default 'app'
);

create index if not exists idx_audit_logs_occurred_at on public.audit_logs (occurred_at desc);
create index if not exists idx_audit_logs_entity_type on public.audit_logs (entity_type);
create index if not exists idx_audit_logs_event_type on public.audit_logs (event_type);
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_logs_view on public.audit_logs;
create policy audit_logs_select_logs_view
on public.audit_logs
for select
to authenticated
using (public.has_role_permission('logs.view'));

create or replace function public.insert_audit_log(
  p_entity_type text,
  p_event_type text,
  p_entity_id text default null,
  p_entity_label text default null,
  p_message text default null,
  p_details jsonb default '{}'::jsonb,
  p_source text default 'app'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_log_id bigint;
begin
  if auth.uid() is not null then
    select *
    into v_profile
    from public.profiles
    where id = auth.uid()
    limit 1;
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_name,
    actor_email,
    actor_role,
    entity_type,
    entity_id,
    entity_label,
    event_type,
    message,
    details,
    source
  )
  values (
    auth.uid(),
    v_profile.full_name,
    v_profile.email,
    v_profile.role_code,
    coalesce(nullif(trim(p_entity_type), ''), 'other'),
    nullif(trim(coalesce(p_entity_id, '')), ''),
    nullif(trim(coalesce(p_entity_label, '')), ''),
    coalesce(nullif(trim(p_event_type), ''), 'other'),
    coalesce(
      nullif(trim(coalesce(p_message, '')), ''),
      initcap(replace(coalesce(p_event_type, 'event'), '_', ' ')) || ' ' || coalesce(p_entity_type, 'item')
    ),
    coalesce(p_details, '{}'::jsonb),
    coalesce(nullif(trim(p_source), ''), 'app')
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

create or replace function public.write_audit_log(
  p_entity_type text,
  p_event_type text,
  p_entity_id text default null,
  p_entity_label text default null,
  p_message text default null,
  p_details jsonb default '{}'::jsonb
)
returns bigint
language sql
security definer
set search_path = public
as $$
  select public.insert_audit_log(
    p_entity_type,
    p_event_type,
    p_entity_id,
    p_entity_label,
    p_message,
    p_details,
    'app'
  );
$$;

revoke all on function public.write_audit_log(text, text, text, text, text, jsonb) from public;
grant execute on function public.write_audit_log(text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.write_audit_log(text, text, text, text, text, jsonb) to service_role;

create or replace function public.audit_sources_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_audit_log(
      'source',
      'create',
      new.id::text,
      new.source_no,
      'Created source ' || new.source_no,
      jsonb_build_object('source_no', new.source_no, 'title', new.title, 'source_date', new.source_date),
      'trigger'
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.insert_audit_log(
      'source',
      'update',
      new.id::text,
      new.source_no,
      'Updated source ' || new.source_no,
      jsonb_build_object('source_no', new.source_no, 'title', new.title, 'previous_title', old.title),
      'trigger'
    );
    return new;
  end if;

  perform public.insert_audit_log(
    'source',
    'delete',
    old.id::text,
    old.source_no,
    'Deleted source ' || old.source_no,
    jsonb_build_object('source_no', old.source_no, 'title', old.title),
    'trigger'
  );
  return old;
end;
$$;

create or replace function public.audit_recommendations_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_audit_log(
      'recommendation',
      'create',
      new.id::text,
      new.recommendation_no,
      'Created recommendation ' || new.recommendation_no,
      jsonb_build_object('recommendation_no', new.recommendation_no, 'source_id', new.source_id, 'priority_code', new.priority_code),
      'trigger'
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.insert_audit_log(
      'recommendation',
      'update',
      new.id::text,
      new.recommendation_no,
      'Updated recommendation ' || new.recommendation_no,
      jsonb_build_object('recommendation_no', new.recommendation_no, 'priority_code', new.priority_code),
      'trigger'
    );
    return new;
  end if;

  perform public.insert_audit_log(
    'recommendation',
    'delete',
    old.id::text,
    old.recommendation_no,
    'Deleted recommendation ' || old.recommendation_no,
    jsonb_build_object('recommendation_no', old.recommendation_no, 'source_id', old.source_id),
    'trigger'
  );
  return old;
end;
$$;

create or replace function public.audit_actions_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_audit_log(
      'action',
      'create',
      new.id::text,
      new.action_no,
      'Created action ' || new.action_no,
      jsonb_build_object('action_no', new.action_no, 'title', new.title, 'status_code', new.status_code, 'due_date', new.due_date),
      'trigger'
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.insert_audit_log(
      'action',
      'update',
      new.id::text,
      new.action_no,
      'Updated action ' || new.action_no,
      jsonb_build_object('action_no', new.action_no, 'status_code', new.status_code, 'priority_code', new.priority_code, 'progress_percent', new.progress_percent),
      'trigger'
    );
    return new;
  end if;

  perform public.insert_audit_log(
    'action',
    'delete',
    old.id::text,
    old.action_no,
    'Deleted action ' || old.action_no,
    jsonb_build_object('action_no', old.action_no, 'title', old.title),
    'trigger'
  );
  return old;
end;
$$;

create or replace function public.audit_action_updates_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action_no text;
begin
  select a.action_no into v_action_no from public.actions a where a.id = new.action_id;

  perform public.insert_audit_log(
    'action_update',
    'create',
    new.id::text,
    coalesce(v_action_no, new.action_id::text),
    'Posted progress update for action ' || coalesce(v_action_no, new.action_id::text),
    jsonb_build_object('status_code', new.status_code, 'progress_percent', new.progress_percent, 'next_follow_up_date', new.next_follow_up_date),
    'trigger'
  );

  return new;
end;
$$;

create or replace function public.audit_extension_requests_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action_no text;
begin
  if tg_op = 'DELETE' then
    select a.action_no into v_action_no from public.actions a where a.id = old.action_id;
    perform public.insert_audit_log(
      'extension_request',
      'delete',
      old.id::text,
      coalesce(v_action_no, old.action_id::text),
      'Deleted extension request for action ' || coalesce(v_action_no, old.action_id::text),
      jsonb_build_object('requested_until', old.requested_until, 'request_status', old.request_status),
      'trigger'
    );
    return old;
  end if;

  select a.action_no into v_action_no from public.actions a where a.id = coalesce(new.action_id, old.action_id);

  if tg_op = 'INSERT' then
    perform public.insert_audit_log(
      'extension_request',
      'request',
      new.id::text,
      coalesce(v_action_no, new.action_id::text),
      'Requested extension for action ' || coalesce(v_action_no, new.action_id::text),
      jsonb_build_object('requested_until', new.requested_until, 'request_status', new.request_status),
      'trigger'
    );
    return new;
  end if;

  perform public.insert_audit_log(
    'extension_request',
    'decision',
    new.id::text,
    coalesce(v_action_no, new.action_id::text),
    'Updated extension request for action ' || coalesce(v_action_no, new.action_id::text),
    jsonb_build_object('requested_until', new.requested_until, 'request_status', new.request_status, 'decided_at', new.decided_at),
    'trigger'
  );
  return new;
end;
$$;

create or replace function public.audit_profiles_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_audit_log(
      'profile',
      'create',
      new.id::text,
      new.email,
      'Created user profile ' || new.email,
      jsonb_build_object('email', new.email, 'role_code', new.role_code, 'is_active', new.is_active),
      'trigger'
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.insert_audit_log(
      'profile',
      'update',
      new.id::text,
      new.email,
      'Updated user profile ' || new.email,
      jsonb_build_object('email', new.email, 'role_code', new.role_code, 'is_active', new.is_active),
      'trigger'
    );
    return new;
  end if;

  perform public.insert_audit_log(
    'profile',
    'delete',
    old.id::text,
    old.email,
    'Deleted user profile ' || old.email,
    jsonb_build_object('email', old.email, 'role_code', old.role_code),
    'trigger'
  );
  return old;
end;
$$;

drop trigger if exists trg_sources_audit_logs on public.sources;
create trigger trg_sources_audit_logs
  after insert or update or delete on public.sources
  for each row
  execute function public.audit_sources_changes();

drop trigger if exists trg_recommendations_audit_logs on public.recommendations;
create trigger trg_recommendations_audit_logs
  after insert or update or delete on public.recommendations
  for each row
  execute function public.audit_recommendations_changes();

drop trigger if exists trg_actions_audit_logs on public.actions;
create trigger trg_actions_audit_logs
  after insert or update or delete on public.actions
  for each row
  execute function public.audit_actions_changes();

drop trigger if exists trg_action_updates_audit_logs on public.action_updates;
create trigger trg_action_updates_audit_logs
  after insert on public.action_updates
  for each row
  execute function public.audit_action_updates_changes();

drop trigger if exists trg_action_extension_requests_audit_logs on public.action_extension_requests;
create trigger trg_action_extension_requests_audit_logs
  after insert or update or delete on public.action_extension_requests
  for each row
  execute function public.audit_extension_requests_changes();

drop trigger if exists trg_profiles_audit_logs on public.profiles;
create trigger trg_profiles_audit_logs
  after insert or update or delete on public.profiles
  for each row
  execute function public.audit_profiles_changes();

commit;
