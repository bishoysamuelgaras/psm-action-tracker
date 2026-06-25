begin;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role_code
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin_or_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'psm_manager'), false);
$$;

create or replace function public.is_action_participant(p_action_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.actions a
    where a.id = p_action_id
      and auth.uid() is not null
      and auth.uid() in (a.responsible_user_id, a.owner_user_id, a.verifier_user_id)
  );
$$;


create or replace function public.stamp_sources_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by = auth.uid();
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_recommendations_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by = auth.uid();
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_actions_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by = auth.uid();
    end if;
  end if;

  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.stamp_action_update_actor()
returns trigger
language plpgsql
as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.stamp_action_attachment_actor()
returns trigger
language plpgsql
as $$
begin
  new.uploaded_by = auth.uid();
  return new;
end;
$$;

create or replace function public.stamp_action_extension_request_actor()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.requested_by = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    role_code,
    is_active
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.email, ''),
    'viewer',
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.apply_action_update_to_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.actions a
  set
    progress_percent = coalesce(new.progress_percent, a.progress_percent),
    status_code = coalesce(new.status_code, a.status_code),
    updated_by = coalesce(new.updated_by, auth.uid(), a.updated_by),
    updated_at = timezone('utc', now()),
    completed_date = case
      when new.status_code = 'closed' and a.completed_date is null then (new.update_date at time zone 'utc')::date
      else a.completed_date
    end,
    verified_date = case
      when new.status_code = 'verified' and a.verified_date is null then (new.update_date at time zone 'utc')::date
      else a.verified_date
    end
  where a.id = new.action_id;

  return new;
end;
$$;

drop trigger if exists trg_action_updates_apply_to_action on public.action_updates;
create trigger trg_action_updates_apply_to_action
  after insert on public.action_updates
  for each row
  execute function public.apply_action_update_to_action();

create or replace function public.log_action_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status_code is distinct from new.status_code then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'status_code', to_jsonb(old.status_code), to_jsonb(new.status_code), auth.uid(), 'trigger');
  end if;

  if old.priority_code is distinct from new.priority_code then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'priority_code', to_jsonb(old.priority_code), to_jsonb(new.priority_code), auth.uid(), 'trigger');
  end if;

  if old.responsible_user_id is distinct from new.responsible_user_id then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'responsible_user_id', to_jsonb(old.responsible_user_id), to_jsonb(new.responsible_user_id), auth.uid(), 'trigger');
  end if;

  if old.owner_user_id is distinct from new.owner_user_id then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'owner_user_id', to_jsonb(old.owner_user_id), to_jsonb(new.owner_user_id), auth.uid(), 'trigger');
  end if;

  if old.verifier_user_id is distinct from new.verifier_user_id then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'verifier_user_id', to_jsonb(old.verifier_user_id), to_jsonb(new.verifier_user_id), auth.uid(), 'trigger');
  end if;

  if old.start_date is distinct from new.start_date then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'start_date', to_jsonb(old.start_date), to_jsonb(new.start_date), auth.uid(), 'trigger');
  end if;

  if old.due_date is distinct from new.due_date then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'due_date', to_jsonb(old.due_date), to_jsonb(new.due_date), auth.uid(), 'trigger');
  end if;

  if old.completed_date is distinct from new.completed_date then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'completed_date', to_jsonb(old.completed_date), to_jsonb(new.completed_date), auth.uid(), 'trigger');
  end if;

  if old.verified_date is distinct from new.verified_date then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'verified_date', to_jsonb(old.verified_date), to_jsonb(new.verified_date), auth.uid(), 'trigger');
  end if;

  if old.progress_percent is distinct from new.progress_percent then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'progress_percent', to_jsonb(old.progress_percent), to_jsonb(new.progress_percent), auth.uid(), 'trigger');
  end if;

  if old.latest_extension_until is distinct from new.latest_extension_until then
    insert into public.action_history (action_id, field_name, old_value, new_value, changed_by, change_source)
    values (new.id, 'latest_extension_until', to_jsonb(old.latest_extension_until), to_jsonb(new.latest_extension_until), auth.uid(), 'trigger');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_actions_log_history on public.actions;
create trigger trg_actions_log_history
  after update on public.actions
  for each row
  execute function public.log_action_history();


drop trigger if exists trg_sources_stamp_actor_columns on public.sources;
create trigger trg_sources_stamp_actor_columns
  before insert on public.sources
  for each row
  execute function public.stamp_sources_actor_columns();

drop trigger if exists trg_recommendations_stamp_actor_columns on public.recommendations;
create trigger trg_recommendations_stamp_actor_columns
  before insert on public.recommendations
  for each row
  execute function public.stamp_recommendations_actor_columns();

drop trigger if exists trg_actions_stamp_actor_columns on public.actions;
create trigger trg_actions_stamp_actor_columns
  before insert or update on public.actions
  for each row
  execute function public.stamp_actions_actor_columns();

drop trigger if exists trg_action_updates_stamp_actor on public.action_updates;
create trigger trg_action_updates_stamp_actor
  before insert on public.action_updates
  for each row
  execute function public.stamp_action_update_actor();

drop trigger if exists trg_action_attachments_stamp_actor on public.action_attachments;
create trigger trg_action_attachments_stamp_actor
  before insert on public.action_attachments
  for each row
  execute function public.stamp_action_attachment_actor();

drop trigger if exists trg_action_extension_requests_stamp_actor on public.action_extension_requests;
create trigger trg_action_extension_requests_stamp_actor
  before insert on public.action_extension_requests
  for each row
  execute function public.stamp_action_extension_request_actor();


drop trigger if exists trg_departments_set_updated_at on public.departments;
create trigger trg_departments_set_updated_at before update on public.departments for each row execute function public.set_row_updated_at();

drop trigger if exists trg_app_roles_set_updated_at on public.app_roles;
create trigger trg_app_roles_set_updated_at before update on public.app_roles for each row execute function public.set_row_updated_at();

drop trigger if exists trg_priority_levels_set_updated_at on public.priority_levels;
create trigger trg_priority_levels_set_updated_at before update on public.priority_levels for each row execute function public.set_row_updated_at();

drop trigger if exists trg_action_statuses_set_updated_at on public.action_statuses;
create trigger trg_action_statuses_set_updated_at before update on public.action_statuses for each row execute function public.set_row_updated_at();

drop trigger if exists trg_source_types_set_updated_at on public.source_types;
create trigger trg_source_types_set_updated_at before update on public.source_types for each row execute function public.set_row_updated_at();

drop trigger if exists trg_recommendation_categories_set_updated_at on public.recommendation_categories;
create trigger trg_recommendation_categories_set_updated_at before update on public.recommendation_categories for each row execute function public.set_row_updated_at();

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at before update on public.profiles for each row execute function public.set_row_updated_at();

drop trigger if exists trg_sources_set_updated_at on public.sources;
create trigger trg_sources_set_updated_at before update on public.sources for each row execute function public.set_row_updated_at();

drop trigger if exists trg_recommendations_set_updated_at on public.recommendations;
create trigger trg_recommendations_set_updated_at before update on public.recommendations for each row execute function public.set_row_updated_at();

drop trigger if exists trg_actions_set_updated_at on public.actions;
create trigger trg_actions_set_updated_at before update on public.actions for each row execute function public.set_row_updated_at();

drop trigger if exists trg_action_extension_requests_set_updated_at on public.action_extension_requests;
create trigger trg_action_extension_requests_set_updated_at before update on public.action_extension_requests for each row execute function public.set_row_updated_at();

commit;
